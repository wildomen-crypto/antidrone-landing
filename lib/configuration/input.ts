import { MATERIAL_IDS, SHAPE_IDS, STRUCTURAL_SYSTEM_IDS, WALL_MODULE_IDS, SERVICE_IDS } from "./schema";
import type { MaterialId, ShapeId, StructuralSystemId, WallModuleId, ServiceId } from "./schema";

export type LayoutInput = {
  version: 1; shapeId: ShapeId; length: number; width: number; height: number;
  diameter: number; rise: number; offset: number; projection: number;
  variant: "screen" | "shelter" | "portal" | "arch" | "cable" | "perimeter" | "dome";
  materialId: MaterialId; roofMaterialId: MaterialId; structuralSystem: StructuralSystemId;
  combinedMaterials: MaterialId[];
  sectionType: "round" | "profile"; spatialSupports: boolean;
  foundation: "block" | "pile-cap";
  step: number; layers: number; sides: boolean[]; roof: boolean;
  opening: { enabled: boolean; width: number; height: number; offset: number };
  contours: { enabled: boolean; offset: number; height: number; materialId?: MaterialId; roofMaterialId?: MaterialId; layers?: number; structuralSystem?: StructuralSystemId; foundation?: "block" | "pile-cap" }[];
  wallModule: WallModuleId | "none"; services: ServiceId[];
};

export const defaultInput: LayoutInput = {
  version: 1, shapeId: "C4", length: 10, width: 6, height: 4, diameter: 8,
  rise: 2, offset: 1, projection: 3, variant: "portal",
  materialId: "M5", roofMaterialId: "M5", structuralSystem: "tube-post",
  combinedMaterials: ["M1", "M4"],
  sectionType: "profile", spatialSupports: false, foundation: "block",
  step: 3, layers: 1, sides: [true, true, true, true], roof: true,
  opening: { enabled: false, width: 3, height: 3, offset: 3.5 },
  contours: [
    { enabled: true, offset: 0.8, height: 4.5 },
    { enabled: true, offset: 2, height: 5.5 },
    { enabled: true, offset: 3.5, height: 7 },
  ],
  wallModule: "none", services: ["design", "manufacturing"],
};

export class InputError extends Error {
  constructor(message: string) { super(message); this.name = "InputError"; }
}

/** Strict public JSON contract. Never trust a TypeScript cast at the API boundary. */
export function parseInput(value: unknown): LayoutInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Конфигурация должна быть объектом.");
  const raw = value as Record<string, unknown>;
  const keys = Object.keys(defaultInput);
  if (Object.keys(raw).some(key => !keys.includes(key))) throw new InputError("В конфигурации есть неизвестные поля.");
  if (raw.version !== 1) throw new InputError("Эта версия конфигурации не поддерживается.");
  if (raw.foundation === "pile") throw new InputError("Сваи без ростверка больше недоступны. Выберите блок или сваи с ростверком.");
  const pick = <T extends string>(field: string, allowed: readonly T[]): T => {
    if (typeof raw[field] !== "string" || !allowed.includes(raw[field] as T)) throw new InputError(`Неверное значение: ${field}.`);
    return raw[field] as T;
  };
  const number = (field: string, min: number, max: number) => {
    const n = raw[field];
    const labels: Record<string,string> = { length: "Длина", width: "Ширина", height: "Высота", diameter: "Диаметр", rise: "Подъём", step: "Шаг секций", layers: "Количество слоёв", offset: "Вынос", projection: "Вылет" };
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) throw new InputError(`${labels[field] ?? field}: допустимо от ${min} до ${max}${field === "layers" ? "" : " м"}.`);
    return n;
  };
  const boolean = (field: string) => { if (typeof raw[field] !== "boolean") throw new InputError(`Неверное поле ${field}.`); return raw[field] as boolean; };
  const shapeId = pick("shapeId", SHAPE_IDS);
  const height = number("height", 0.5, shapeId === "C8" ? 80 : 30);
  const length = number("length", 1, 200), width = number("width", 1, 100);
  const diameter = number("diameter", 1, 100), rise = number("rise", 0.2, 30);
  const step = number("step", 1, 10), layers = number("layers", 1, 3);
  if (!Number.isInteger(layers)) throw new InputError("Количество слоёв должно быть целым.");
  const variant = pick("variant", ["screen", "shelter", "portal", "arch", "cable", "perimeter", "dome"] as const);
  if (shapeId === "C5" && !["screen", "shelter"].includes(variant)) throw new InputError("Выберите экран или козырёк.");
  if (shapeId === "C6" && !["portal", "arch", "cable"].includes(variant)) throw new InputError("Выберите вариант галереи.");
  if (shapeId === "C7" && !["perimeter", "dome"].includes(variant)) throw new InputError("Выберите круглый контур или купол.");
  if (!Array.isArray(raw.sides) || raw.sides.length !== 4 || raw.sides.some(v => typeof v !== "boolean")) throw new InputError("Укажите четыре стороны.");
  const o = raw.opening as Record<string, unknown>;
  if (!o || typeof o !== "object" || Array.isArray(o) || Object.keys(o).some(k => !["enabled", "width", "height", "offset"].includes(k))) throw new InputError("Неверный проём.");
  if (typeof o.enabled !== "boolean" || typeof o.width !== "number" || typeof o.height !== "number" || typeof o.offset !== "number" || ![o.width, o.height, o.offset].every(Number.isFinite)) throw new InputError("Размеры проёма должны быть числами.");
  if (o.width <= 0 || o.height <= 0 || o.offset < 0) throw new InputError("Проверьте положительные размеры проёма.");
  if (o.enabled) {
    if (!["C1", "C2", "C4", "C5"].includes(shapeId) || (shapeId === "C5" && variant !== "screen")) throw new InputError("Проём доступен для экрана, периметра, укрытия и пристенного экрана.");
    if (o.offset + o.width > length + 1e-8 || o.height > height || (["C2","C4"].includes(shapeId) && !raw.sides[0])) throw new InputError("Проём должен помещаться в передней стороне.");
  }
  if (!Array.isArray(raw.contours) || raw.contours.length < 1 || raw.contours.length > 3) throw new InputError("Допустимо от одного до трёх контуров.");
  const contours = raw.contours.map(c => {
    if (!c || typeof c !== "object" || Array.isArray(c)) throw new InputError("Неверный контур.");
    const t = c as Record<string, unknown>;
    if (Object.keys(t).some(k => !["enabled", "offset", "height", "materialId", "roofMaterialId", "layers", "structuralSystem", "foundation"].includes(k)) || typeof t.enabled !== "boolean" || typeof t.offset !== "number" || typeof t.height !== "number" || !Number.isFinite(t.offset) || !Number.isFinite(t.height) || t.offset < 0.1 || t.offset > 20 || t.height < 0.5 || t.height > 80) throw new InputError("Контур: отступ 0,1–20 м, высота 0,5–80 м.");
    const overrides: Partial<LayoutInput["contours"][number]> = {};
    for (const field of ["materialId", "roofMaterialId"] as const) if (t[field] !== undefined) {
      if (!MATERIAL_IDS.includes(t[field] as MaterialId)) throw new InputError("Неверный материал контура.");
      overrides[field] = t[field] as MaterialId;
    }
    if (t.layers !== undefined) { if (typeof t.layers !== "number" || !Number.isInteger(t.layers) || t.layers < 1 || t.layers > 3) throw new InputError("Контур: число слоёв от 1 до 3."); overrides.layers = t.layers; }
    if (t.structuralSystem !== undefined) { if (!STRUCTURAL_SYSTEM_IDS.includes(t.structuralSystem as StructuralSystemId)) throw new InputError("Неверная система контура."); overrides.structuralSystem = t.structuralSystem as StructuralSystemId; }
    if (t.foundation === "pile") throw new InputError("Сваи без ростверка больше недоступны в контурах. Выберите блок или сваи с ростверком.");
    if (t.foundation !== undefined) { if (!["block","pile-cap"].includes(t.foundation as string)) throw new InputError("Неверное основание контура."); overrides.foundation = t.foundation as LayoutInput["foundation"]; }
    return { enabled: t.enabled, offset: t.offset, height: t.height, ...overrides };
  });
  if (shapeId === "C8" && !contours.some(c => c.enabled)) throw new InputError("Включите хотя бы один контур.");
  if (shapeId === "C8") {
    const active = contours.filter(c => c.enabled);
    if (active.some(c => c.height < height)) throw new InputError("Высота каждого контура должна быть не меньше высоты объекта.");
    if (active.some((c, i) => i > 0 && c.offset <= active[i - 1].offset)) throw new InputError("Отступы включённых контуров должны возрастать от внутреннего к внешнему.");
  }
  if (shapeId === "C3" && raw.roof !== true) throw new InputError("Для навеса необходимо включить покрытие.");
  if (["C2", "C4", "C8"].includes(shapeId) && !raw.sides.some(Boolean) && (shapeId === "C2" || !raw.roof)) throw new InputError("Включите хотя бы одну сторону или покрытие.");
  if (!Array.isArray(raw.services) || raw.services.some(v => !SERVICE_IDS.includes(v as ServiceId)) || new Set(raw.services).size !== raw.services.length) throw new InputError("Проверьте перечень услуг.");
  if (!Array.isArray(raw.combinedMaterials) || raw.combinedMaterials.length < 2 || raw.combinedMaterials.length > 3 || raw.combinedMaterials.some(v => v === "M8" || !MATERIAL_IDS.includes(v as MaterialId)) || new Set(raw.combinedMaterials).size !== raw.combinedMaterials.length) throw new InputError("Для комбинированной панели выберите 2–3 разных материала без вложенной комбинации.");
  const roof = boolean("roof");
  // Legacy perimeter ignored the roof flag; preserve its open ring on import.
  const normalizedRoof = shapeId === "C7" && variant === "perimeter" ? false : roof || (shapeId === "C5" && variant === "shelter");
  return {
    version: 1, shapeId, length, width, height, diameter, rise,
    offset: number("offset", 0.1, 20), projection: number("projection", 0.5, 30), variant: shapeId === "C7" ? "dome" : variant,
    materialId: pick("materialId", MATERIAL_IDS), roofMaterialId: pick("roofMaterialId", MATERIAL_IDS),
    combinedMaterials: [...raw.combinedMaterials] as MaterialId[],
    sectionType: pick("sectionType", ["round", "profile"]), spatialSupports: boolean("spatialSupports"),
    foundation: pick("foundation", ["block", "pile-cap"]),
    structuralSystem: pick("structuralSystem", STRUCTURAL_SYSTEM_IDS), step, layers,
    sides: [...raw.sides] as boolean[], roof: normalizedRoof,
    opening: { enabled: o.enabled, width: o.width, height: o.height, offset: o.offset },
    contours, wallModule: pick("wallModule", ["none", ...WALL_MODULE_IDS]), services: [...raw.services] as ServiceId[],
  };
}
