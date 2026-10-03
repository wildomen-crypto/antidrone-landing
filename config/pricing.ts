import type { RateBook } from "@/lib/pricing/budget";
/** Approved business tariffs only. The empty book keeps the public UI in manual mode. */
export const pricing: RateBook = { version: null, approved: false, currency: "RUB", vat: null, rates: {} };
