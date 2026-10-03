export type RateUnit = "m2" | "m" | "piece" | "order";
export type BudgetLine = { id: string; label: string; quantity: number; unit: RateUnit; required: boolean };
export type Rate = { unit: RateUnit; value: number; includes?: readonly string[] };
export type RateBook = { version: string | null; approved: boolean; currency: "RUB"; vat: "included" | "excluded" | "not-applicable" | null; rates: Readonly<Record<string, Rate>> };
const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
/** Pure engine; unapproved or incomplete tariffs can never produce a full quote. */
export function computeBudget(lines: readonly BudgetLine[], book: RateBook) {
  if (new Set(lines.map(l => l.id)).size !== lines.length || lines.some(l => !Number.isFinite(l.quantity) || l.quantity < 0)) throw new Error("INVALID_BUDGET_LINES");
  if (!book.approved || !book.version || !book.vat) return { mode: "manual" as const, amount: null, version: book.version, missing: lines.filter(l => l.required).map(l => l.id), items: [] };
  for (const rate of Object.values(book.rates)) if (!Number.isFinite(rate.value) || rate.value < 0) throw new Error("INVALID_RATE");
  // Included work is suppressed only when its parent rate is used and has matching units.
  const included = new Set(lines.flatMap(l => {
    const rate = book.rates[l.id]; return rate && rate.unit === l.unit && l.quantity > 0 ? rate.includes ?? [] : [];
  }));
  const items = lines.filter(l => !included.has(l.id) && l.quantity > 0).map(l => {
    const rate = book.rates[l.id], valid = rate && rate.unit === l.unit;
    return { ...l, rate: valid ? rate.value : null, amount: valid ? money(l.quantity * rate.value) : null };
  });
  const missing = items.filter(l => l.required && l.amount === null).map(l => l.id);
  return { mode: missing.length ? "manual" as const : "preliminary" as const, amount: missing.length ? null : money(items.reduce((sum, l) => sum + (l.amount ?? 0), 0)), version: book.version, vat: book.vat, currency: book.currency, missing, items };
}
