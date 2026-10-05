import { parseInput } from "./input";
import type { LayoutInput } from "./input";
import { hasLegacyServices } from "./services";

const key = "topengineer:quote-configuration:v1";

export function readQuoteDraft(): { configuration: LayoutInput; servicesUpdated: boolean } | null {
  try {
    const text = window.localStorage.getItem(key);
    if (!text) return null;
    const raw = JSON.parse(text);
    return { configuration: parseInput(raw), servicesUpdated: hasLegacyServices(raw.services) };
  } catch { return null; }
}

export function saveQuoteDraft(input: LayoutInput): boolean {
  try { window.localStorage.setItem(key, JSON.stringify(parseInput(input))); return true; }
  catch { return false; }
}

export function clearQuoteDraft() {
  try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ }
}
