import { parseInput } from "./input";
import type { LayoutInput } from "./input";

const key = "topengineer:quote-configuration:v1";

export function readQuoteDraft(): LayoutInput | null {
  try {
    const text = window.localStorage.getItem(key);
    return text ? parseInput(JSON.parse(text)) : null;
  } catch { return null; }
}

export function saveQuoteDraft(input: LayoutInput): boolean {
  try { window.localStorage.setItem(key, JSON.stringify(parseInput(input))); return true; }
  catch { return false; }
}

export function clearQuoteDraft() {
  try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ }
}
