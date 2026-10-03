/** Data contract only. Runtime validation and geometry belong to B03.1+. */
export const CONFIGURATION_SCHEMA_VERSION = 1 as const;
export const CONFIGURATION_UNITS = {
  length: "m",
  area: "m2",
  mass: "kg",
} as const;

export const SHAPE_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] as const;
export const MATERIAL_IDS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"] as const;
export const WALL_MODULE_IDS = ["W1", "W2", "W3"] as const;
export const STRUCTURAL_SYSTEM_IDS = [
  "tube-post", "spatial-column", "frame", "spatial-truss", "guyed-mast", "wall-bracket",
] as const;
export const SERVICE_IDS = ["design", "manufacturing", "supply", "delivery", "installation"] as const;

export type ShapeId = (typeof SHAPE_IDS)[number];
export type MaterialId = (typeof MATERIAL_IDS)[number];
export type WallModuleId = (typeof WALL_MODULE_IDS)[number];
export type StructuralSystemId = (typeof STRUCTURAL_SYSTEM_IDS)[number];
export type ServiceId = (typeof SERVICE_IDS)[number];
export type CrossSectionKind = "round-tube" | "profile-tube";
export type ConnectionKind = "bolted" | "welded";
export type EstimateMode = "demo" | "commercial" | "manual";

type ShapeKeyById = {
  C1: "screen";
  C2: "perimeter";
  C3: "canopy";
  C4: "enclosure";
  C5: "facade";
  C6: "passage";
  C7: "round";
  C8: "complex";
};
export type ShapeKey = ShapeKeyById[ShapeId];
export type ShapeIdentity = { [Id in ShapeId]: Readonly<{ id: Id; key: ShapeKeyById[Id] }> }[ShapeId];
export type SurfaceRole = "roof" | "front" | "back" | "left" | "right" | "circumference";

export type Opening = Readonly<{
  id: string;
  width: number;
  height: number;
  horizontalOffset: number;
  verticalOffset: number;
}>;

/** Enabled changes the order; viewer visibility is stored separately. */
export type SurfaceConfiguration = Readonly<{
  id: string;
  role: SurfaceRole;
  enabled: boolean;
  materialId: MaterialId;
  layers: number;
  openings: readonly Opening[];
}>;

type BaseConfiguration<Id extends ShapeId> = Readonly<{
  schemaVersion: typeof CONFIGURATION_SCHEMA_VERSION;
  shapeId: Id;
  shape: ShapeKeyById[Id];
  templateId: string;
  structuralSystem: StructuralSystemId;
  crossSection: CrossSectionKind;
  connections: ConnectionKind;
  surfaces: readonly SurfaceConfiguration[];
  foundationTemplateId?: string;
  services: readonly ServiceId[];
  regionId?: string;
}>;

type DimensionKey = "length" | "width" | "height" | "diameter" | "rise" | "offset" | "projection";
/** Known dimensions belonging to other shapes cannot leak into this shape. */
type Dimensions<Required extends DimensionKey> = Readonly<
  Record<Required, number> & Partial<Record<Exclude<DimensionKey, Required>, never>>
>;

export type ScreenConfiguration = BaseConfiguration<"C1"> & Readonly<{
  dimensions: Dimensions<"length" | "height">;
}>;
export type PerimeterConfiguration = BaseConfiguration<"C2"> & Readonly<{
  dimensions: Dimensions<"length" | "width" | "height">;
}>;
export type CanopyConfiguration = BaseConfiguration<"C3"> & Readonly<{
  dimensions: Dimensions<"length" | "width" | "height">;
}>;
export type EnclosureConfiguration = BaseConfiguration<"C4"> & Readonly<{
  dimensions: Dimensions<"length" | "width" | "height">;
}>;
export type FacadeConfiguration = BaseConfiguration<"C5"> & (
  | Readonly<{ variant: "screen"; dimensions: Dimensions<"length" | "height" | "offset"> }>
  | Readonly<{ variant: "shelter"; dimensions: Dimensions<"length" | "height" | "projection"> }>
);
export type PassageConfiguration = BaseConfiguration<"C6"> & (
  | Readonly<{ variant: "portal"; dimensions: Dimensions<"length" | "width" | "height"> }>
  | Readonly<{ variant: "arch" | "cable"; dimensions: Dimensions<"length" | "width" | "height" | "rise"> }>
);
export type RoundConfiguration = BaseConfiguration<"C7"> & (
  | Readonly<{ variant: "perimeter"; dimensions: Dimensions<"diameter" | "height"> }>
  | Readonly<{ variant: "dome"; dimensions: Dimensions<"diameter" | "height" | "rise"> }>
);

export type ComplexContour = Readonly<{
  id: string;
  enabled: boolean;
  offsetFromObject: number;
  height: number;
  templateId: string;
  structuralSystem: StructuralSystemId;
  surfaces: readonly SurfaceConfiguration[];
}>;
/** A complex enclosure contains one to three independent contours. */
type Contours = readonly [ComplexContour] | readonly [ComplexContour, ComplexContour]
  | readonly [ComplexContour, ComplexContour, ComplexContour];
export type ComplexConfiguration = BaseConfiguration<"C8"> & Readonly<{
  dimensions: Dimensions<"length" | "width" | "height">;
  contours: Contours;
  wallModule?: Readonly<{ moduleId: WallModuleId; enabled: boolean }>;
}>;

export type Configuration = ScreenConfiguration | PerimeterConfiguration
  | CanopyConfiguration | EnclosureConfiguration | FacadeConfiguration
  | PassageConfiguration | RoundConfiguration | ComplexConfiguration;

/** Never embed this in the commercial order or use it to change quantities. */
export type ViewerState = Readonly<{
  view: "perspective" | "top" | "front" | "side";
  mode: "complete" | "frame-only";
  showDimensions: boolean;
  hiddenSurfaceIds: readonly string[];
  hiddenContourIds: readonly string[];
}>;
