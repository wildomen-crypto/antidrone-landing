"use client";

import { useEffect, useMemo, useRef } from "react";
import { shapes } from "@/config/catalog";
import { defaultInput } from "@/lib/configuration/input";
import type { LayoutInput } from "@/lib/configuration/input";
import { generateModel } from "@/lib/geometry/generate";
import { ModelDiagram } from "@/components/viewer/ModelDiagram";

export default function ShapePicker({ value, onChange }: {
  value: LayoutInput["shapeId"];
  onChange: (value: LayoutInput["shapeId"]) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const previews = useMemo(() => shapes.map(shape => ({ shape, graph: generateModel({
    ...structuredClone(defaultInput), shapeId: shape.id,
    length: 5, width: 3, height: 2.8, diameter: 4, rise: 1,
    materialId: "M4", roofMaterialId: "M6",
    variant: shape.id === "C5" ? "screen" : shape.id === "C7" ? "dome" : "portal",
    contours: [{ enabled: true, offset: .5, height: 3.3 }, { enabled: true, offset: 1.2, height: 4 }, { enabled: false, offset: 2, height: 5 }],
  }) })), []);

  useEffect(() => {
    const row = strip.current, card = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !card) return;
    // Scroll only the thumbnail strip; do not move the page during selection or import.
    if (card.offsetLeft < row.scrollLeft || card.offsetLeft + card.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2 });
    }
  }, [value]);

  return <div className="shape-picker" aria-label="Выбор типа конструкции" role="group" ref={strip}>
    {previews.map(({ shape, graph }, i) => <button type="button" key={shape.id}
      className="shape-choice" aria-pressed={value === shape.id} aria-label={shape.name}
      onClick={() => onChange(shape.id)}>
      <span className="shape-choice-number" aria-hidden="true">0{i + 1}</span>
      <span className="shape-choice-image" aria-hidden="true"><ModelDiagram graph={graph} /></span>
      <span className="shape-choice-name">{shape.name}</span>
      <span className="shape-choice-check" aria-hidden="true">{value === shape.id ? "✓" : ""}</span>
    </button>)}
  </div>;
}
