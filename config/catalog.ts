import type { MaterialId, ShapeId, ShapeIdentity, StructuralSystemId, WallModuleId } from "../lib/configuration/schema";

export type ShapeDefinition = ShapeIdentity & Readonly<{
  name: string;
  description: string;
  release: "initial" | "extension";
  calculatorStatus: "preview" | "preview" | "available";
  parameters: readonly string[];
  variants: readonly Readonly<{ id: string; name: string }>[];
}>;
export type MaterialDefinition = Readonly<{
  id: MaterialId;
  name: string;
  description: string;
  appearance: "thread-net" | "diamond-net" | "hexagonal-net" | "framed-grid"
    | "cable-grid" | "tube-grid" | "perforated-panel" | "layered-panel";
  reviewStatus: "engineer-review-required";
  information: readonly string[];
}>;
export type WallModuleDefinition = Readonly<{
  id: WallModuleId;
  name: string;
  description: string;
  supplyStatus: "confirmation-required";
}>;
export type StructuralSystemDefinition = Readonly<{
  id: StructuralSystemId;
  name: string;
  description: string;
}>;
export type ApprovedCombination = Readonly<{
  shapeId: ShapeId;
  materialId: MaterialId;
  structuralSystemId: StructuralSystemId;
  templateId: string;
  approvedBy: string;
  approvedAt: string;
}>;

export const shapes = [
  { id: "C1", key: "screen", name: "Линейный экран", description: "Ряд стоек и рам с выбранным заполнением.", release: "initial", calculatorStatus: "preview", parameters: ["Длина", "Высота"], variants: [] },
  { id: "C2", key: "perimeter", name: "Ограждение по периметру", description: "Прямоугольный контур с независимыми сторонами и проёмами.", release: "initial", calculatorStatus: "preview", parameters: ["Длина", "Ширина", "Высота"], variants: [] },
  { id: "C3", key: "canopy", name: "Навес", description: "Опоры и покрытие с открытыми боковыми сторонами.", release: "initial", calculatorStatus: "preview", parameters: ["Длина", "Ширина", "Высота"], variants: [] },
  { id: "C4", key: "enclosure", name: "Объёмное укрытие", description: "Покрытие и выбранные боковые поверхности с доступом к объекту.", release: "initial", calculatorStatus: "preview", parameters: ["Длина", "Ширина", "Высота"], variants: [] },
  { id: "C5", key: "facade", name: "Пристенный экран / козырёк", description: "Выносные кронштейны и рамы вдоль существующей стены.", release: "initial", calculatorStatus: "preview", parameters: ["Длина", "Высота", "Вынос или вылет"], variants: [{ id: "screen", name: "Пристенный экран" }, { id: "shelter", name: "Козырёк" }] },
  { id: "C6", key: "passage", name: "Галерея / проезд", description: "Повторяемые пролёты над проездом или проходом.", release: "extension", calculatorStatus: "preview", parameters: ["Длина", "Ширина", "Высота свободного габарита", "Подъём для выбранной формы"], variants: [{ id: "portal", name: "П-образная" }, { id: "arch", name: "Арочная" }, { id: "cable", name: "Канатная" }] },
  { id: "C7", key: "round", name: "Круглый контур / купол", description: "Кольцевые опоры; выбор материала кровли добавляет радиальное покрытие.", release: "extension", calculatorStatus: "preview", parameters: ["Диаметр", "Высота", "Подъём купола"], variants: [] },
  { id: "C8", key: "complex", name: "Комплексное укрытие", description: "До трёх вложенных контуров с независимыми высотами, опорами и заполнениями.", release: "initial", calculatorStatus: "preview", parameters: ["Габариты объекта", "Контуры", "Отступы", "Высоты"], variants: [] },
] as const satisfies readonly ShapeDefinition[];

export const materials = [
  { id: "M1", name: "Полимерная сеть", description: "Сетчатое полотно с заменяемым заполнением.", appearance: "thread-net", reviewStatus: "engineer-review-required", information: ["Паспорт материала", "Обслуживание", "Заменяемость"] },
  { id: "M2", name: "Плетёная стальная сетка", description: "Сетка с ромбической структурой в картах или рулонах.", appearance: "diamond-net", reviewStatus: "engineer-review-required", information: ["Покрытие", "Форма поставки", "Масса по паспорту"] },
  { id: "M3", name: "Крученая сетка", description: "Полотно с шестиугольной структурой ячеек.", appearance: "hexagonal-net", reviewStatus: "engineer-review-required", information: ["Материал проволоки", "Покрытие", "Комплектность"] },
  { id: "M4", name: "Сварная сетка в раме", description: "Карты с ортогональными ячейками и обрамлением.", appearance: "framed-grid", reviewStatus: "engineer-review-required", information: ["Размер карты", "Масса", "Крепление"] },
  { id: "M5", name: "Стальная тросовая сеть", description: "Канатное полотно с отдельными несущими тросами и узлами.", appearance: "cable-grid", reviewStatus: "engineer-review-required", information: ["Полотно и несущие тросы", "Комплект узлов", "Обслуживание"] },
  { id: "M6", name: "Трубчатая решётка / покрытие", description: "Параллельные круглые или профильные трубы, при необходимости с поперечинами.", appearance: "tube-grid", reviewStatus: "engineer-review-required", information: ["Профиль", "Погонная длина", "Масса по сортаменту"] },
  { id: "M7", name: "ПВЛ / перфорированное заполнение", description: "Просечно-вытяжные или перфорированные карты.", appearance: "perforated-panel", reviewStatus: "engineer-review-required", information: ["Марка изделия", "Масса", "Область применения"] },
  { id: "M8", name: "Комбинированная панель", description: "Несколько отдельных слоёв заполнения с раздельным учётом объёмов.", appearance: "layered-panel", reviewStatus: "engineer-review-required", information: ["Состав слоёв", "Документы", "Объём каждого слоя"] },
] as const satisfies readonly MaterialDefinition[];

export const wallModules = [
  { id: "W1", name: "Блоки ФБС", description: "Дополнительный стеновой контур из блоков.", supplyStatus: "confirmation-required" },
  { id: "W2", name: "Железобетонные панели", description: "Стеновой модуль из панелей в составе комплексного решения.", supplyStatus: "confirmation-required" },
  { id: "W3", name: "Габионы", description: "Дополнительные стеновые модули с заданным наполнителем.", supplyStatus: "confirmation-required" },
] as const satisfies readonly WallModuleDefinition[];

export const structuralSystems = [
  { id: "tube-post", name: "Трубчатая стойка", description: "Простая опора из круглой или профильной трубы." },
  { id: "spatial-column", name: "Пространственная опора", description: "Разнесённые пояса и раскосы на нескольких гранях." },
  { id: "frame", name: "Рама", description: "Стойки и соединяющие их элементы рамы." },
  { id: "spatial-truss", name: "Пространственная ферма", description: "Несколько поясов, решётка и связи между гранями." },
  { id: "guyed-mast", name: "Мачта с оттяжками", description: "Мачта и отдельные элементы её закрепления." },
  { id: "wall-bracket", name: "Пристенный кронштейн", description: "Выносной элемент для пристенного экрана или козырька." },
] as const satisfies readonly StructuralSystemDefinition[];

/** An empty approved list means manual review, never implicit permission. */
export const compatibility = {
  status: "awaiting-engineer-review",
  approved: [] as readonly ApprovedCombination[],
} as const;

export const catalog = {
  version: 1,
  shapes,
  materials,
  wallModules,
  structuralSystems,
  compatibility,
} as const;
