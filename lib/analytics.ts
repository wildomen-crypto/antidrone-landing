import { analytics } from "../config/analytics";
export type SiteEvent = "open_calculator" | "request_quote" | "export_configuration" | "import_configuration" | "lead_saved" | "call_click" | "email_click";
export function track(event: SiteEvent, shapeId?: string) {
  if (!analytics.enabled || typeof window === "undefined") return;
  // The adapter receives categorical events only: no contacts, IDs or object dimensions.
  window.dispatchEvent(new CustomEvent("topengineer-analytics", { detail: { event, ...(shapeId && /^C[1-8]$/.test(shapeId) ? { shapeId } : {}) } }));
}
