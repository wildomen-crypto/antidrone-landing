import type { LayoutInput } from "./input";

export function hasWallOptions(input: Pick<LayoutInput, "shapeId" | "variant">) {
  return input.shapeId !== "C3" && !(input.shapeId === "C5" && input.variant === "shelter");
}

function wallSides(input: Pick<LayoutInput, "shapeId">) {
  return input.shapeId === "C7" ? [0] : input.shapeId === "C6" ? [1, 3] : [0, 1, 2, 3];
}

export function wallFillingEnabled(input: Pick<LayoutInput, "shapeId" | "variant" | "walls" | "sides">) {
  return hasWallOptions(input) && input.walls &&
    (["C1", "C5"].includes(input.shapeId) || wallSides(input).some(i => input.sides[i]));
}

export function selectWalls(input: Pick<LayoutInput, "shapeId" | "variant" | "walls" | "materialId" | "sides" | "opening">,
  materialId: LayoutInput["materialId"]): Pick<LayoutInput, "walls" | "materialId" | "sides" | "opening"> {
  if (!hasWallOptions(input)) return { walls: input.walls, materialId: input.materialId, sides: input.sides, opening: input.opening };
  const walls = !wallFillingEnabled(input) || input.materialId !== materialId;
  const relevant = wallSides(input);
  const restoreSides = walls && !relevant.some(i => input.sides[i]);
  return { materialId, walls, sides: restoreSides ? input.sides.map((side, i) => side || relevant.includes(i)) : input.sides,
    opening: walls ? input.opening : { ...input.opening, enabled: false } };
}
