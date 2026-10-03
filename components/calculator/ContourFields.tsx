"use client";
import type { LayoutInput } from "@/lib/configuration/input";
import { materials, structuralSystems } from "@/config/catalog";
type Contour = LayoutInput["contours"][number];
export default function ContourFields({ value, onValue }: { value: Contour; onValue: (value: Contour) => void }) {
  return <details className="contour-options"><summary>Материалы и конструкция контура</summary>
    {(["materialId","roofMaterialId"] as const).map(key => <label className="field" key={key}><span>{key === "materialId" ? "Заполнение контура" : "Покрытие контура"}</span><select value={value[key] ?? ""} onChange={e => onValue({ ...value, [key]: e.target.value || undefined })}><option value="">Как в общих настройках</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>)}
    <label className="field"><span>Слои контура</span><select value={value.layers ?? ""} onChange={e=>onValue({...value,layers:e.target.value?Number(e.target.value):undefined})}><option value="">Как в общих настройках</option>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
    <label className="field"><span>Несущая система контура</span><select value={value.structuralSystem ?? ""} onChange={e=>onValue({...value,structuralSystem:e.target.value as Contour["structuralSystem"]||undefined})}><option value="">Как в общих настройках</option>{structuralSystems.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label className="field"><span>Основание контура</span><select value={value.foundation ?? ""} onChange={e=>onValue({...value,foundation:e.target.value as Contour["foundation"]||undefined})}><option value="">Как в общих настройках</option><option value="block">Незаглублённый блок</option><option value="pile">Сваи без ростверка</option><option value="pile-cap">Сваи с ростверком</option></select></label>
  </details>;
}
