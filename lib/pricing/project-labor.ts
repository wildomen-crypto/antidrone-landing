import type { ServiceId, ShapeId } from "../configuration/schema";

export type LaborFeatures = { frameMembers: number; frameLength: number; weightedArea: number; supports: number; height: number; opening: boolean; piledFoundation: boolean; shapeId: ShapeId };
export type LaborRate = { base: number; member: number; length: number; area: number; support: number; opening: number; piledFoundationFactor: number };
export type LaborBook = { version: string; currency: "RUB"; hourlyRate: number; rateRange: readonly [number, number]; heightThreshold: number; heightFactor: number; shapes: Readonly<Record<ShapeId, number>>; materials: Readonly<Record<string, number>>; services: Readonly<Record<ServiceId, LaborRate>> };
export type ProjectLaborPrice = { mode: "draft" | "not-selected"; version: string; currency: "RUB"; amount: number | null; low: number | null; high: number | null; hours: number; hourlyRate: number; items: { service: ServiceId; hours: number; amount: number }[] };

/** Editable workload assumptions, not a normative or calibrated engineering method. */
export function projectLaborPrice(features: LaborFeatures, services: readonly ServiceId[], book: LaborBook): ProjectLaborPrice {
  const numbers = [features.frameMembers, features.frameLength, features.weightedArea, features.supports, features.height, book.hourlyRate, ...book.rateRange, book.heightThreshold, book.heightFactor, ...Object.values(book.shapes), ...Object.values(book.materials), ...Object.values(book.services).flatMap(rate => Object.values(rate))];
  if (numbers.some(value => !Number.isFinite(value) || value < 0) || book.hourlyRate <= 0 || book.rateRange[0] > book.hourlyRate || book.rateRange[1] < book.hourlyRate || !book.version) throw new Error("INVALID_LABOR_PRICING");
  if (new Set(services).size !== services.length || services.some(id => !book.services[id])) throw new Error("INVALID_DESIGN_SERVICES");
  const factor = book.shapes[features.shapeId] * (1 + Math.max(0, features.height - book.heightThreshold) * book.heightFactor);
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("INVALID_LABOR_COMPLEXITY");
  const items = services.map(service => {
    const rate = book.services[service];
    const hours = (rate.base + features.frameMembers * rate.member + features.frameLength * rate.length + features.weightedArea * rate.area + features.supports * rate.support + (features.opening ? rate.opening : 0)) * factor * (features.piledFoundation ? rate.piledFoundationFactor : 1);
    return { service, hours, amount: Math.round(hours * book.hourlyRate) };
  });
  const hours = items.reduce((sum, item) => sum + item.hours, 0);
  if (!Number.isFinite(hours)) throw new Error("INVALID_LABOR_TOTAL");
  return { mode: services.length ? "draft" : "not-selected", version: book.version, currency: book.currency, amount: services.length ? Math.round(hours * book.hourlyRate) : null, low: services.length ? Math.round(hours * book.rateRange[0]) : null, high: services.length ? Math.round(hours * book.rateRange[1]) : null, hours, hourlyRate: book.hourlyRate, items };
}
