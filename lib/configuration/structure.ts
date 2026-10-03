import type { LayoutInput } from "./input";

type Structure = Pick<LayoutInput, "structuralSystem" | "spatialSupports">;

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
