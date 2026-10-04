import type { LayoutInput } from "./input";

export function roofRequired(input: Pick<LayoutInput, "shapeId" | "variant">) {
  return input.shapeId === "C3" || (input.shapeId === "C5" && input.variant === "shelter");
}

export function selectRoof(input: Pick<LayoutInput, "shapeId" | "variant" | "roof" | "roofMaterialId">,
  materialId: LayoutInput["roofMaterialId"]): Pick<LayoutInput, "roof" | "roofMaterialId"> {
  return { roofMaterialId: materialId, roof: roofRequired(input) || !input.roof || input.roofMaterialId !== materialId };
}
