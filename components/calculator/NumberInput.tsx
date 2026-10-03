"use client";
import { useEffect, useState } from "react";
/** Preserve temporary editing text; accept both Russian comma and decimal dot. */
export default function NumberInput({ value, onValue, min = 0.1, max = 200 }: { value: number; onValue: (value: number) => void; min?: number; max?: number }) {
  const display = (n: number) => Number.isFinite(n) ? n.toLocaleString("ru-RU", { useGrouping: false, maximumFractionDigits: 8 }) : "";
  const [text, setText] = useState(() => display(value));
  useEffect(() => { if (Number.isFinite(value)) setText(display(value)); }, [value]);
  return <input type="text" inputMode="decimal" value={text} aria-invalid={!Number.isFinite(value) || value < min || value > max} onChange={e => {
    const raw = e.target.value; setText(raw);
    const parsed = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw.trim()) ? Number(raw.trim().replace(",", ".")) : NaN;
    onValue(parsed);
  }} />;
}
