import type { LayoutInput } from "./input";

type Structure = Pick<LayoutInput, "structuralSystem" | "spatialSupports">;
export type BracketReturn = Pick<LayoutInput, "shapeId" | "variant" | "roof" | "opening">;

/** A bracket temporarily opens the wall canopy, without replacing the user's dimensions. */
export function selectStructuralLayout(input: LayoutInput, previous: BracketReturn | null,
  id: LayoutInput["structuralSystem"] | "spatial-combined", toggle = true) {
  if (id === "wall-bracket") {
    return {
      input: { ...input, shapeId: "C5" as const, variant: "shelter" as const,
        structuralSystem: id, spatialSupports: false, roof: true,
        opening: { ...input.opening, enabled: false } },
      previous: previous ?? { shapeId: input.shapeId, variant: input.variant,
        roof: input.roof, opening: { ...input.opening } },
    };
  }
  const restored = previous ? { ...input, ...previous, opening: { ...previous.opening,
    enabled: previous.opening.enabled && input.walls
      && (!["C2", "C4"].includes(previous.shapeId) || input.sides[0])
      && previous.opening.offset + previous.opening.width <= input.length
      && previous.opening.height <= input.height } } : input;
  const structure = id === "spatial-combined"
    ? { structuralSystem: "spatial-truss" as const, spatialSupports: true }
    : toggle ? toggleStructure(input, id) : { structuralSystem: id, spatialSupports: false };
  return { input: { ...restored, ...structure }, previous: null };
}

export function isStructureSelected(value: Structure, id: LayoutInput["structuralSystem"]) {
  if (id === "spatial-column") return value.structuralSystem === id || value.spatialSupports;
  if (id === "tube-post" && value.spatialSupports) return false;
  return value.structuralSystem === id;
}

/** The two spatial cards control independent columns and beams in the existing graph. */
export function toggleStructure(value: Structure, id: LayoutInput["structuralSystem"]): Structure {
  if (id === "spatial-column") {
    if (value.structuralSystem === "spatial-truss")
      return { structuralSystem: "spatial-truss", spatialSupports: !value.spatialSupports };
    return { structuralSystem: isStructureSelected(value, id) ? "tube-post" : id, spatialSupports: false };
  }
  if (id === "spatial-truss") {
    if (value.structuralSystem === id)
      return { structuralSystem: value.spatialSupports ? "spatial-column" : "tube-post", spatialSupports: false };
    return { structuralSystem: id, spatialSupports: isStructureSelected(value, "spatial-column") };
  }
  return { structuralSystem: id, spatialSupports: false };
}
