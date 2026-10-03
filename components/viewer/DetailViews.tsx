"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { LayoutInput } from "@/lib/configuration/input";
import { defaultInput } from "@/lib/configuration/input";
import { generateModel } from "@/lib/geometry/generate";
import { ModelDiagram } from "./ModelDiagram";
const Scene = dynamic(() => import("./Scene"), { ssr: false });
export default function DetailViews({ foundation, sectionType }: Pick<LayoutInput, "foundation" | "sectionType">) {
  const [open, setOpen] = useState(false), [kind, setKind] = useState("column");
  const graph = useMemo(() => {
    const g = generateModel({ ...structuredClone(defaultInput), shapeId: "C3", length: 4, width: 4, height: 4, materialId: "M4", roofMaterialId: "M4", step: 4, spatialSupports: true, structuralSystem: "spatial-truss", foundation, sectionType });
    g.panels = [];
    if (kind === "truss") {
      g.members = g.members.filter(m => m.a[1] >= 3.5 && m.b[1] >= 3.5 && m.a[0] < -1.5 && m.b[0] < -1.5);
      g.solids = []; g.supports = [];
    } else {
      g.members = g.members.filter(m => m.a[0] < -1.5 && m.b[0] < -1.5 && m.a[2] < -1.5 && m.b[2] < -1.5 && m.a[1] <= (kind === "foundation" ? 1.35 : 4) && m.b[1] <= (kind === "foundation" ? 2 : 4));
      g.solids = g.solids.filter(s => s.center[0] < -1.5 && s.center[2] < -1.5);
      g.supports = [];
    }
    // Recenter this isolated educational detail; it never changes the order.
    const pts = g.members.flatMap(m => [m.a, m.b]).concat(g.solids.map(s => s.center));
    const center = [0, 1, 2].map(i => (Math.min(...pts.map(p => p[i])) + Math.max(...pts.map(p => p[i]))) / 2);
    g.members = g.members.map(m => ({ ...m, a: m.a.map((v, i) => v - center[i]) as [number, number, number], b: m.b.map((v, i) => v - center[i]) as [number, number, number] }));
    g.solids = g.solids.map(s => ({ ...s, center: s.center.map((v, i) => v - center[i]) as [number, number, number] }));
    g.bounds = { length: 4, width: 4, height: 4 };
    return g;
  }, [kind, foundation, sectionType]);
  return <details className="node-details" onToggle={e => setOpen(e.currentTarget.open)}><summary>Крупный вид опоры, фермы и основания</summary>{open && <><div className="view-buttons">{[["column", "Опора"], ["truss", "Ферма"], ["foundation", "Основание"]].map(([id, label]) => <button key={id} aria-pressed={kind === id} className={kind === id ? "selected" : ""} onClick={() => setKind(id)}>{label}</button>)}</div><div className="detail-viewer"><Scene graph={graph} view="perspective" onlyFrame={false} hiddenGroups={[]} showDimensions={false} /></div><p className="field-hint">Типовые схемы пространственных элементов по принципам из предоставленных альбомов. Размеры, профили и соединения условны; это не рабочий чертёж и не узел текущего заказа.</p><div className="detail-print"><ModelDiagram graph={graph} /></div></>}</details>;
}
