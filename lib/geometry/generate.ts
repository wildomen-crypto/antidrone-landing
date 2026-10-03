import { parseInput } from "../configuration/input";
import type { LayoutInput } from "../configuration/input";
import type { MaterialId, SurfaceRole } from "../configuration/schema";

export type Point = readonly [number, number, number];
export type Member = { id: string; a: Point; b: Point; kind: "frame" | "brace" | "infill" | "cable"; group: string };
export type Panel = { id: string; points: Point[]; materialId: MaterialId; layers: number; role: SurfaceRole; group: string; baseSurface: boolean };
export type Solid = { id: string; center: Point; size: Point; group: string; role: "foundation" | "wall"; material: "concrete" | "steel" | "gabion" };
export type ModelGraph = { members: Member[]; panels: Panel[]; solids: Solid[]; sectionType: "round" | "profile"; supports: { point: Point; group: string; foundation: LayoutInput["foundation"] }[]; sections: number; bounds: { length: number; width: number; height: number }; object?: { length: number; width: number; height: number }; wall?: { length: number; height: number }; wallModule?: string };

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export function polygonArea(points: readonly Point[]): number {
  let area = 0;
  const p = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i].map((v, j) => v - p[j]), b = points[i + 1].map((v, j) => v - p[j]);
    area += Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]) / 2;
  }
  return area;
}

export function generateModel(value: LayoutInput): ModelGraph {
  const c = parseInput(value);
  const graph: ModelGraph = { members: [], panels: [], solids: [], sectionType: c.sectionType, supports: [], sections: 0, bounds: { length: c.length, width: c.width, height: c.height } };
  const solid = (center: Point, size: Point, group: string, role: Solid["role"], material: Solid["material"]) => graph.solids.push({ id: "s" + graph.solids.length, center, size, group, role, material });
  const keys = new Set<string>(), supportKeys = new Set<string>();
  const key = (p: Point) => p.map(v => v.toFixed(6)).join(",");
  const member = (a: Point, b: Point, kind: Member["kind"], group: string) => {
    if (distance(a, b) < 1e-7) return;
    const k = [key(a), key(b)].sort().join("|") + ":" + group + ":" + kind;
    if (keys.has(k)) return;
    if (graph.members.length >= 12000) throw new Error("Слишком подробная модель. Увеличьте шаг секций или уменьшите размеры.");
    keys.add(k); graph.members.push({ id: `m${graph.members.length}`, a, b, kind, group });
  };
  const panel = (points: Point[], materialId: MaterialId, role: SurfaceRole, group: string, baseSurface = true) => {
    if (polygonArea(points) < 1e-8) return;
    const a = points[1].map((v, i) => v - points[0][i]), b = points[2].map((v, i) => v - points[0][i]);
    const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = Math.hypot(...cross);
    const normal = cross.map(v => v / norm);
    const shifted = (p: Point, amount: number): Point => [p[0] + normal[0] * amount, p[1] + normal[1] * amount, p[2] + normal[2] * amount];
    if (materialId === "M8") { c.combinedMaterials.forEach((id, i) => panel(points.map(p => shifted(p, i * 0.18)), id, role, group, i === 0)); return; }
    graph.panels.push({ id: `p${graph.panels.length}`, points, materialId, layers: c.layers, role, group, baseSurface });
    const fillMember = (a: Point, b: Point, kind: Member["kind"]) => {
      for (let layer = 0; layer < c.layers; layer++) member(shifted(a, layer * 0.05), shifted(b, layer * 0.05), kind, group);
    };
    // Explicit coarse tubes/cables are geometry, not a dense wire for every mesh cell.
    if (materialId === "M6" || materialId === "M5") {
      const n = Math.min(80, Math.max(1, Math.ceil(distance(points[0], points[1]) / (materialId === "M6" ? 0.8 : 1.2))));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const mix = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        fillMember(mix(points[0], points[1]), points.length === 4 ? mix(points[3], points[2]) : mix(points[0], points[2]), materialId === "M6" ? "infill" : "cable");
      }
      if (materialId === "M5" && points.length === 4) {
        const k = Math.min(80, Math.max(1, Math.ceil(distance(points[0], points[3]) / 1.2)));
        for (let i = 1; i < k; i++) {
          const t = i / k, mix = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          fillMember(mix(points[0], points[3]), mix(points[1], points[2]), "cable");
        }
      }
    }
  };
  const beam = (a: Point, b: Point, group: string) => {
    if (c.structuralSystem !== "spatial-truss") { member(a, b, "frame", group); return; }
    const depth = 0.45, spread = 0.2;
    const tracks = [-spread, spread].flatMap(z => [0, -depth].map(y => ({ y, z })));
    const n = Math.max(1, Math.ceil(distance(a, b) / 2));
    const horizontal = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
    const p = (i: number, t: { y: number; z: number }): Point => [a[0] + (b[0] - a[0]) * i / n + (b[2] - a[2]) / horizontal * t.z, a[1] + (b[1] - a[1]) * i / n + t.y, a[2] + (b[2] - a[2]) * i / n - (b[0] - a[0]) / horizontal * t.z];
    for (const track of tracks) for (let i = 0; i < n; i++) member(p(i, track), p(i + 1, track), "frame", group);
    for (let i = 0; i < n; i++) for (const [x, y] of [[0, 1], [0, 2], [1, 3], [2, 3]]) {
      member(p(i, tracks[x]), p(i + 1, tracks[y]), "brace", group);
      member(p(i, tracks[x]), p(i, tracks[y]), "brace", group);
    }
  };
  const post = (x: number, z: number, height: number, group: string, openingBottom = 0) => {
    const bottom: Point = [x, openingBottom, z], top: Point = [x, height, z];
    const spatial = c.structuralSystem === "spatial-column" || c.spatialSupports;
    if (!spatial || openingBottom !== 0) member(bottom, top, "frame", group);
    if (openingBottom === 0) {
      const k = `${key(bottom)}:${group}`;
      if (!supportKeys.has(k)) { supportKeys.add(k); graph.supports.push({ point: bottom, group, foundation: c.foundation }); }
    }
    if (spatial && openingBottom === 0) {
      const d = 0.18, n = Math.max(1, Math.ceil(height / 2));
      const corners = [[-d, -d], [d, -d], [d, d], [-d, d]];
      for (let side = 0; side < 4; side++) {
        const a = corners[side], b = corners[(side + 1) % 4];
        for (let i = 0; i < n; i++) {
          const y = i * height / n, next = (i + 1) * height / n;
          member([x + a[0], y, z + a[1]], [x + a[0], next, z + a[1]], "frame", group);
          member([x + a[0], y, z + a[1]], [x + b[0], next, z + b[1]], "brace", group);
          member([x + a[0], y, z + a[1]], [x + b[0], y, z + b[1]], "brace", group);
          if (i === n - 1) member([x + a[0], next, z + a[1]], [x + b[0], next, z + b[1]], "brace", group);
        }
      }
    }
    if (c.structuralSystem === "guyed-mast" && openingBottom === 0) {
      const signX = x < 0 ? -1 : 1, signZ = z < 0 ? -1 : 1;
      member(top, [x + signX * 2, 0, z + signZ * 2], "cable", group);
    }
  };
  const side = (a: Point, b: Point, height: number, material: MaterialId, role: SurfaceRole, group: string, hole: boolean, fill = true) => {
    const size = distance(a, b), n = Math.ceil(size / c.step);
    graph.sections += n;
    const at = (s: number, y: number): Point => [a[0] + (b[0] - a[0]) * s / size, y, a[2] + (b[2] - a[2]) * s / size];
    for (let i = 0; i <= n; i++) {
      const s = i * size / n;
      const bottom = hole && s > c.opening.offset && s < c.opening.offset + c.opening.width ? c.opening.height : 0;
      post(at(s, 0)[0], at(s, 0)[2], height, group, bottom);
      if (i < n) beam(at(s, height), at((i + 1) * size / n, height), group);
    }
    const rectangle = (start: number, end: number, lower: number, upper: number) => {
      if (fill && end > start && upper > lower) panel([at(start, lower), at(end, lower), at(end, upper), at(start, upper)], material, role, group);
    };
    if (hole) {
      const left = c.opening.offset, right = left + c.opening.width;
      rectangle(0, left, 0, height); rectangle(right, size, 0, height); rectangle(left, right, c.opening.height, height);
      post(at(left, 0)[0], at(left, 0)[2], c.opening.height, group);
      post(at(right, 0)[0], at(right, 0)[2], c.opening.height, group);
      member(at(left, c.opening.height), at(right, c.opening.height), "frame", group);
    } else rectangle(0, size, 0, height);
  };
  const box = (length: number, width: number, height: number, group: string, roof: boolean, sides: boolean[], hole: boolean, fillSides = true) => {
    const corners: Point[] = [[-length / 2, 0, -width / 2], [length / 2, 0, -width / 2], [length / 2, 0, width / 2], [-length / 2, 0, width / 2]];
    const roles: SurfaceRole[] = ["front", "right", "back", "left"];
    for (let i = 0; i < 4; i++) if (sides[i]) side(corners[i], corners[(i + 1) % 4], height, c.materialId, roles[i], group, hole && i === 0, fillSides);
    if (roof) {
      const n = Math.ceil(length / c.step);
      for (let i = 0; i <= n; i++) {
        const x = -length / 2 + length * i / n;
        const alongFront = length * i / n;
        const bottom = hole && alongFront > c.opening.offset && alongFront < c.opening.offset + c.opening.width ? c.opening.height : 0;
        post(x, -width / 2, height, group, bottom); post(x, width / 2, height, group);
        beam([x, height, -width / 2], [x, height, width / 2], group);
        if (i < n) {
          const next = -length / 2 + length * (i + 1) / n;
          member([x, height, -width / 2], [next, height, -width / 2], "frame", group);
          member([x, height, width / 2], [next, height, width / 2], "frame", group);
          panel([[x, height, -width / 2], [next, height, -width / 2], [next, height, width / 2], [x, height, width / 2]], c.roofMaterialId, "roof", group);
        }
      }
    }
  };

  if (c.shapeId === "C1") {
    graph.bounds.width = 0.6;
    side([-c.length / 2, 0, 0], [c.length / 2, 0, 0], c.height, c.materialId, "front", "main", c.opening.enabled);
  } else if (["C2", "C3", "C4"].includes(c.shapeId)) {
    const roof = c.shapeId !== "C2" && c.roof;
    box(c.length, c.width, c.height, "main", roof, c.shapeId === "C3" ? [false, false, false, false] : c.sides, c.opening.enabled);
  } else if (c.shapeId === "C5") {
    graph.wall = { length: c.length + 2, height: c.height + 1 };
    const d = c.variant === "screen" ? c.offset : c.projection;
    graph.bounds.width = d;
    const n = Math.ceil(c.length / c.step);
    if (c.variant === "screen") side([-c.length / 2, 0, d], [c.length / 2, 0, d], c.height, c.materialId, "front", "main", c.opening.enabled);
    else {
      panel([[-c.length / 2, c.height, 0], [c.length / 2, c.height, 0], [c.length / 2, c.height, d], [-c.length / 2, c.height, d]], c.roofMaterialId, "roof", "main");
      beam([-c.length / 2, c.height, d], [c.length / 2, c.height, d], "main");
    }
    for (let i = 0; i <= n; i++) {
      const x = -c.length / 2 + c.length * i / n;
      member([x, c.height, 0], [x, c.height, d], "frame", "main");
      member([x, Math.max(0, c.height - 0.6), 0], [x, c.height, d], "brace", "main");
    }
  } else if (c.shapeId === "C6") {
    const n = Math.ceil(c.length / c.step), segments = c.variant === "portal" ? 1 : 16;
    const headroom = c.structuralSystem === "spatial-truss" && c.variant !== "cable" ? 0.51 : 0.06;
    const profile = (x: number, j: number): Point => {
      const t = j / segments;
      const rise = c.variant === "portal" ? 0 : c.variant === "arch" ? 4 * c.rise * t * (1 - t) : c.rise * (2 * t - 1) ** 2;
      return [x, c.height + headroom + rise, -c.width / 2 + c.width * t];
    };
    graph.bounds.height = c.height + headroom + (c.variant === "portal" ? 0 : c.rise);
    for (let i = 0; i <= n; i++) {
      const x = -c.length / 2 + c.length * i / n;
      const edgeH = c.height + headroom + (c.variant === "cable" ? c.rise : 0);
      post(x, -c.width / 2, edgeH, "main"); post(x, c.width / 2, edgeH, "main");
      for (let j = 0; j < segments; j++) {
        const a = profile(x, j), b = profile(x, j + 1);
        if (c.variant === "cable") member(a, b, "cable", "main"); else beam(a, b, "main");
        if (i < n && c.roof) {
          const next = -c.length / 2 + c.length * (i + 1) / n;
          panel([a, profile(next, j), profile(next, j + 1), b], c.roofMaterialId, "roof", "main");
          member(a, profile(next, j), "frame", "main");
        }
      }
    }
    graph.sections = n;
    if (c.sides[3]) panel([[-c.length / 2, 0, -c.width / 2], [c.length / 2, 0, -c.width / 2], [c.length / 2, c.height, -c.width / 2], [-c.length / 2, c.height, -c.width / 2]], c.materialId, "left", "main");
    if (c.sides[1]) panel([[-c.length / 2, 0, c.width / 2], [c.length / 2, 0, c.width / 2], [c.length / 2, c.height, c.width / 2], [-c.length / 2, c.height, c.width / 2]], c.materialId, "right", "main");
    // Ends remain open: this is a passage, with the free-height datum at H.
  } else if (c.shapeId === "C7") {
    const r = c.diameter / 2, n = Math.max(12, Math.ceil(Math.PI * c.diameter / c.step));
    graph.bounds = { length: c.diameter, width: c.diameter, height: c.height + (c.variant === "dome" && c.roof ? c.rise : 0) };
    for (let i = 0; i < n; i++) {
      const t = i * 2 * Math.PI / n, s = (i + 1) * 2 * Math.PI / n;
      const a: Point = [r * Math.cos(t), c.height, r * Math.sin(t)], b: Point = [r * Math.cos(s), c.height, r * Math.sin(s)];
      post(a[0], a[2], c.height, "main"); member(a, b, "frame", "main");
      if (c.sides[0]) panel([[a[0], 0, a[2]], [b[0], 0, b[2]], b, a], c.materialId, "circumference", "main");
      if (c.variant === "dome" && c.roof) {
        const apex: Point = [0, c.height + c.rise, 0];
        beam(a, apex, "main"); panel([a, b, apex], c.roofMaterialId, "roof", "main");
      }
    }
    graph.sections = n;
  } else if (c.shapeId === "C8") {
    graph.object = { length: c.length, width: c.width, height: c.height };
    const inherited = { materialId: c.materialId, roofMaterialId: c.roofMaterialId, layers: c.layers, structuralSystem: c.structuralSystem, spatialSupports: c.spatialSupports, foundation: c.foundation };
    for (let i = 0; i < c.contours.length; i++) {
      const t = c.contours[i]; if (!t.enabled) continue;
      Object.assign(c, { materialId: t.materialId ?? inherited.materialId, roofMaterialId: t.roofMaterialId ?? inherited.roofMaterialId, layers: t.layers ?? inherited.layers, structuralSystem: t.structuralSystem ?? inherited.structuralSystem, spatialSupports: t.structuralSystem ? false : inherited.spatialSupports, foundation: t.foundation ?? inherited.foundation });
      const L = c.length + 2 * t.offset, W = c.width + 2 * t.offset;
      box(L, W, t.height, `contour${i + 1}`, c.roof, c.sides, false);
      graph.bounds.length = Math.max(graph.bounds.length, L); graph.bounds.width = Math.max(graph.bounds.width, W); graph.bounds.height = Math.max(graph.bounds.height, t.height);
    }
    Object.assign(c, inherited);
    if (c.wallModule !== "none") {
      graph.wallModule = c.wallModule;
      const L = c.length + 0.6, W = c.width + 0.6, h = Math.min(c.height, 2.4);
      const depth = c.wallModule === "W3" ? 0.5 : c.wallModule === "W1" ? 0.4 : 0.15;
      const size = c.wallModule === "W1" ? 2.4 : c.wallModule === "W3" ? 2 : 3;
      for (let edge = 0; edge < 4; edge++) {
        const long = edge % 2 === 0, span = long ? L : W, n = Math.ceil(span / size);
        const rows = c.wallModule === "W1" ? Math.ceil(h / 0.6) : 1;
        for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
          const along = -span / 2 + (i + 0.5) * span / n;
          const pos: Point = long ? [along, (j + 0.5) * h / rows, edge === 0 ? -W / 2 : W / 2] : [edge === 1 ? L / 2 : -L / 2, (j + 0.5) * h / rows, along];
          solid(pos, long ? [span / n - 0.02, h / rows - 0.01, depth] : [depth, h / rows - 0.01, span / n - 0.02], "wall-module", "wall", c.wallModule === "W3" ? "gabion" : "concrete");
        }
      }
    }
  }
  for (const support of graph.supports) {
    const [x, , z] = support.point;
    if (support.foundation === "block") solid([x, -0.18, z], [0.8, 0.36, 0.8], support.group, "foundation", "concrete");
    else {
      for (const dx of [-0.24, 0.24]) for (const dz of [-0.24, 0.24]) solid([x + dx, -0.55, z + dz], [0.08, 1.1, 0.08], support.group, "foundation", "steel");
      solid([x, -0.08, z], [0.85, 0.16, 0.85], support.group, "foundation", "steel");
    }
  }
  // Deduplicated graph is the only source for viewer, plan and quantities.
  return graph;
}

export function quantities(graph: ModelGraph) {
  const byMaterial: Partial<Record<MaterialId, number>> = {};
  let roof = 0, walls = 0;
  for (const panel of graph.panels) {
    const area = polygonArea(panel.points);
    if (panel.baseSurface) { if (panel.role === "roof") roof += area; else walls += area; }
    byMaterial[panel.materialId] = (byMaterial[panel.materialId] ?? 0) + area * panel.layers;
  }
  const memberLength = graph.members.filter(m => m.kind !== "infill" && m.kind !== "cable").reduce((sum, m) => sum + distance(m.a, m.b), 0);
  const infillLength = graph.members.filter(m => m.kind === "infill").reduce((sum, m) => sum + distance(m.a, m.b), 0);
  const cableLength = graph.members.filter(m => m.kind === "cable").reduce((sum, m) => sum + distance(m.a, m.b), 0);
  const wallSolids = graph.solids.filter(s => s.role === "wall");
  return { roof, walls, total: Object.values(byMaterial).reduce((a, b) => a + (b ?? 0), 0), byMaterial, supports: graph.supports.length, sections: graph.sections, memberLength, infillLength, cableLength, wallModules: wallSolids.length, wallVolume: wallSolids.reduce((sum, s) => sum + s.size[0] * s.size[1] * s.size[2], 0) };
}
