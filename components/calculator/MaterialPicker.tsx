"use client";

import { useEffect, useId, useRef } from "react";
import { materials } from "@/config/catalog";
import type { LayoutInput } from "@/lib/configuration/input";

function MaterialImage({ id }: { id: LayoutInput["materialId"] }) {
  const pattern = useId().replaceAll(":", "");
  const color = id === "M1" ? "#72988b" : id === "M6" ? "#49637b" : "#70899e";
  return <svg viewBox="0 0 160 90" aria-hidden="true">
    <defs>
      <pattern id={pattern} patternUnits="userSpaceOnUse" width={id === "M3" ? 18 : 12} height={id === "M3" ? 16 : 12}>
        <rect width="18" height="16" fill={id === "M7" ? "#8194a6" : "#edf3f7"} />
        {id === "M1" && <path d="M0 0H12M0 0V12" stroke={color} strokeWidth=".8" />}
        {id === "M2" && <path d="M-6 0L6 12L18 0M-6 12L6 0L18 12" stroke={color} strokeWidth="1" fill="none" />}
        {id === "M3" && <path d="M0 4L4 0H13L18 4V12L13 16H4L0 12Z" stroke={color} strokeWidth="1" fill="none" />}
        {(id === "M4" || id === "M8") && <path d="M0 0H12M0 0V12" stroke={color} strokeWidth="1.6" />}
        {id === "M5" && <><path d="M0 0H12M0 0V12" stroke={color} strokeWidth="2" /><circle cx="1" cy="1" r="2.2" fill="#526f84" /></>}
        {id === "M6" && <><path d="M4 0V12" stroke={color} strokeWidth="4" /><path d="M3 0V12" stroke="#9cafbe" strokeWidth="1" /></>}
        {id === "M7" && <circle cx="6" cy="6" r="3.2" fill="#edf3f7" />}
      </pattern>
      <pattern id={pattern + "-back"} patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#e0e9ed" /><path d="M0 0L12 12M0 12L12 0" stroke="#92aa9e" strokeWidth="1.2" /></pattern>
    </defs>
    <ellipse cx="78" cy="81" rx="55" ry="4" fill="#1f4059" opacity=".05" />
    <g transform="matrix(1 .12 -.25 .85 28 6)">
      {id === "M8" && <rect x="8" y="-5" width="112" height="70" fill={"url(#" + pattern + "-back)"} stroke="#819a90" strokeWidth="2" />}
      <rect width="112" height="70" fill={"url(#" + pattern + ")"} stroke={color} strokeWidth={id === "M4" || id === "M8" ? 4 : 1.6} />
      {(id === "M4" || id === "M6") && <path d="M0 0H112" stroke="#38556c" strokeWidth="4" />}
    </g>
  </svg>;
}

export default function MaterialPicker({ value, onChange, noWalls = false, target = "walls", note, enabled = true }: {
  value: LayoutInput["materialId"]; onChange: (id: LayoutInput["materialId"]) => void; noWalls?: boolean;
  target?: "walls" | "roof"; note?: string; enabled?: boolean;
}) {
  const title = target === "roof" ? "Материал кровли" : "Заполнение стен / экрана";
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = strip.current, card = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !card) return;
    if (card.offsetLeft < row.scrollLeft || card.offsetLeft + card.offsetWidth > row.scrollLeft + row.clientWidth)
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2 });
  }, [value, enabled]);
  return <div className="material-picker" data-target={target} data-enabled={enabled} role="group" aria-label={title}>
    <div className="material-picker-heading"><strong>{title}</strong><span>{note ?? (noWalls ? "У этой формы нет стен. Материал кровли выбирается ниже." : "Выберите материал — рисунок на модели обновится")}</span></div>
    <div className="material-choice-strip" ref={strip}>{materials.map(material => <button type="button" key={material.id}
      className="material-choice" aria-label={material.name} aria-pressed={enabled && value === material.id} onClick={() => onChange(material.id)}>
      <span className="material-choice-image"><MaterialImage id={material.id} /></span>
      <span className="material-choice-name">{material.name}</span>
      <span className="shape-choice-check" aria-hidden="true">{enabled && value === material.id ? "✓" : ""}</span>
    </button>)}</div>
  </div>;
}
