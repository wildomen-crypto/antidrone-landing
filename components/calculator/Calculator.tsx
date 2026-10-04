"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultInput, parseInput } from "@/lib/configuration/input";
import type { LayoutInput } from "@/lib/configuration/input";
import { generateModel } from "@/lib/geometry/generate";
import { estimate } from "@/lib/pricing/estimate";
import { materials, shapes, structuralSystems, wallModules } from "@/config/catalog";
import { company } from "@/config/company";
import { ModelDiagram } from "@/components/viewer/ModelDiagram";
import type { CameraView } from "@/components/viewer/ModelDiagram";
import DetailViews from "@/components/viewer/DetailViews";
import NumberInput from "./NumberInput";
import ContourFields from "./ContourFields";
import ShapePicker from "./ShapePicker";
import MaterialPicker from "./MaterialPicker";
import StructurePicker from "./StructurePicker";
import DimensionSlider from "./DimensionSlider";
import CompactOptions from "./CompactOptions";
import { toggleStructure } from "@/lib/configuration/structure";
import { roofRequired, selectRoof } from "@/lib/configuration/roof";
import { track } from "@/lib/analytics";

const Scene = dynamic(() => import("@/components/viewer/Scene"), { ssr: false, loading: () => <div className="viewer-loading">Подготавливаем 3D-схему…</div> });
const format = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

function variantFor(shapeId: string) { return shapeId === "C5" ? "screen" : shapeId === "C7" ? "dome" : "portal"; }
export default function Calculator({ variant = "standard" }: { variant?: "standard" | "wide" }) {
  const wide = variant === "wide";
  const [rightInset, setRightInset] = useState(0);
  const [topInset, setTopInset] = useState(0);
  const [leftInset, setLeftInset] = useState(0);
  const parameterPanel = useRef<HTMLDivElement>(null);
  const dimensionPanel = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<LayoutInput>(structuredClone(defaultInput));
  const [view, setView] = useState<CameraView>("perspective");
  const [onlyFrame, setOnlyFrame] = useState(false), [hiddenGroups, setHiddenGroups] = useState<string[]>([]);
  const [three, setThree] = useState(false), [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const [calculatedAt, setCalculatedAt] = useState("");
  useEffect(() => { setCalculatedAt(new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })); }, [input]);
  const file = useRef<HTMLInputElement>(null), viewer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scene = viewer.current, panel = parameterPanel.current, dimensions = dimensionPanel.current;
    if (!wide || !scene || !panel || !dimensions) return;
    const fit = () => {
      const sceneRect = scene.getBoundingClientRect();
      const dimensionRect = dimensions.getBoundingClientRect();
      const right = Math.max(0, sceneRect.right - panel.getBoundingClientRect().left + 12);
      const left = Math.max(0, dimensionRect.right - sceneRect.left + 12);
      const top = Math.max(0, dimensionRect.bottom - sceneRect.top + 10);
      const height = Math.max(sceneRect.height, 1);
      const betweenPanels = Math.min((sceneRect.width - right - left) / height, 1);
      const belowDimensions = Math.min((sceneRect.width - right) / height, (sceneRect.height - top) / height);
      const useSides = betweenPanels >= belowDimensions;
      setRightInset(right); setTopInset(useSides ? 0 : top); setLeftInset(useSides ? left : 0);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(scene); observer.observe(panel); observer.observe(dimensions); fit();
    return () => observer.disconnect();
  }, [wide]);
  const shape = shapes.find(s => s.id === input.shapeId)!;
  const hasRoofOptions = ["C3", "C4", "C6", "C8"].includes(input.shapeId)
    || (input.shapeId === "C7" && input.variant === "dome")
    || (input.shapeId === "C5" && input.variant === "shelter");
  const requiredRoof = roofRequired(input);
  useEffect(() => {
    const node = viewer.current; if (!node) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setThree(true); observer.disconnect(); } }, { rootMargin: "100px" });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const choose = (event: Event) => {
      const shapeId = (event as CustomEvent<string>).detail;
      if (!shapes.some(s => s.id === shapeId)) return;
      setInput(c => ({ ...c, shapeId: shapeId as LayoutInput["shapeId"], variant: variantFor(shapeId), roof: shapeId === "C3" || c.roof, opening: { ...c.opening, enabled: false } }));
      setHiddenGroups([]); setMessage("");
    };
    window.addEventListener("choose-shape", choose); return () => window.removeEventListener("choose-shape", choose);
  }, []);
  const result = useMemo(() => {
    try { const graph = generateModel(input); return { graph, estimate: estimate(graph), error: "" }; }
    catch (error) { return { graph: null, estimate: null, error: error instanceof Error ? error.message : "Проверьте параметры." }; }
  }, [input]);
  const update = <K extends keyof LayoutInput>(key: K, value: LayoutInput[K]) => { setInput(c => ({ ...c, [key]: value })); setMessage(""); };
  const chooseStructure = (id: LayoutInput["structuralSystem"]) => { setInput(c => ({ ...c, ...toggleStructure(c, id) })); setMessage(""); };
  const chooseRoof = (id: LayoutInput["roofMaterialId"]) => { setInput(c => ({ ...c, ...selectRoof(c, id) })); setMessage(""); };
  const toggleSide = (index: number) => {
    setInput(c => ({ ...c, sides: c.sides.map((enabled, i) => i === index ? !enabled : enabled),
      opening: index === 0 && c.sides[0] ? { ...c.opening, enabled: false } : c.opening }));
    setMessage("");
  };
  const number = (key: "length" | "width" | "height" | "diameter" | "rise" | "offset" | "projection" | "step", label: string, max = 200) => {
    const min = key === "height" || key === "projection" ? 0.5 : key === "rise" ? 0.2 : key === "offset" ? 0.1 : 1;
    return wide ? <DimensionSlider key={key} label={label} value={input[key]} min={min} max={max} onValue={v => update(key, v)} />
      : <label className="field" key={key}><span>{label}, м</span><NumberInput value={input[key]} min={min} max={max} onValue={v => update(key, v)} /></label>;
  };
  const choose = (shapeId: LayoutInput["shapeId"]) => { setInput(c => ({ ...c, shapeId, variant: variantFor(shapeId), roof: shapeId === "C3" || c.roof, opening: { ...c.opening, enabled: false } })); setHiddenGroups([]); setMessage(""); };
  function download() {
    try {
      const value = parseInput(input), blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = `topengineer-${input.shapeId}.json`; a.click(); URL.revokeObjectURL(url);
      setMessage("Конфигурация сохранена без контактных данных.");
      track("export_configuration", input.shapeId);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Проверьте размеры."); }
  }
  async function importFile(selected?: File) {
    if (!selected) return;
    try { if (selected.size > 150000) throw new Error("Файл конфигурации должен быть меньше 150 КБ."); setInput(parseInput(JSON.parse(await selected.text()))); setHiddenGroups([]); setMessage("Конфигурация восстановлена."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Не удалось прочитать файл."); }
    if (file.current) file.current.value = "";
    track("import_configuration");
  }
  function request() {
    if (!result.graph) return;
    track("request_quote", input.shapeId);
    window.dispatchEvent(new CustomEvent("attach-configuration", { detail: structuredClone(input) }));
    document.getElementById("contacts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const q = result.estimate?.quantities;
  const dimensions = (
      <div className={wide ? "dimension-sliders" : "field-grid"}>
        {input.shapeId !== "C7" && number("length", input.shapeId === "C8" ? "Длина объекта" : "Длина")}
        {["C2", "C3", "C4", "C6", "C8"].includes(input.shapeId) && number("width", input.shapeId === "C8" ? "Ширина объекта" : "Ширина", 100)}
        {input.shapeId === "C7" && number("diameter", "Диаметр", 100)}
        {number("height", input.shapeId === "C6" ? "Свободная высота" : input.shapeId === "C8" ? "Высота объекта" : "Высота", input.shapeId === "C8" ? 80 : 30)}
        {((input.shapeId === "C6" && input.variant !== "portal") || (input.shapeId === "C7" && input.variant === "dome")) && number("rise", "Подъём покрытия", 30)}
        {input.shapeId === "C5" && (input.variant === "screen" ? number("offset", "Вынос от стены", 20) : number("projection", "Вылет козырька", 30))}
        {wide && <>
          {number("step", "Максимальный шаг секций", 10)}
          <DimensionSlider label="Слои заполнения" value={input.layers} min={1} max={3} step={1} unit="" editable={false} onValue={v => update("layers", v)} />
        </>}
      </div>
  );
  const settings = (
    <div className="calculator-inputs">
      <div className="step-title"><span>01</span> Конструкция и размеры</div>
      {result.error && <p className="input-error" role="alert">{result.error}</p>}
      {!wide && <label className="field"><span>Тип конструкции</span><select value={input.shapeId} onChange={e => choose(e.target.value as LayoutInput["shapeId"])}>{shapes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      {shape.variants.length > 0 && <label className="field"><span>Вариант</span><select value={input.variant} onChange={e => { const variant = e.target.value as LayoutInput["variant"]; setInput(c => ({ ...c, variant, roof: roofRequired({ ...c, variant }) || c.roof, opening: { ...c.opening, enabled: false } })); setMessage(""); }}>{shape.variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>}
      {!wide && dimensions}
      {!wide && <label className="field"><span>Заполнение стен / экрана</span><select value={input.materialId} onChange={e => update("materialId", e.target.value as LayoutInput["materialId"])}>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>}
      {!wide && hasRoofOptions ? <label className="field"><span>Материал покрытия</span><select value={input.roof ? input.roofMaterialId : "none"}
        onChange={e => { const id = e.target.value; if (id === "none") update("roof", false); else { setInput(c => ({ ...c, roof: true, roofMaterialId: id as LayoutInput["roofMaterialId"] })); setMessage(""); } }}>
        {!requiredRoof && <option value="none">Без кровли</option>}{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select></label> : null}
      {!wide && <button className="advanced-toggle" aria-expanded={showAdvanced} onClick={() => setShowAdvanced(v => !v)}>{showAdvanced ? "−" : "+"} Дополнительные настройки</button>}
      {(input.materialId === "M8" || input.roofMaterialId === "M8" || input.contours.some(c => c.materialId === "M8" || c.roofMaterialId === "M8")) && <fieldset><legend>Состав комбинированной панели</legend>{input.combinedMaterials.map((id, i) => <label className="field" key={i}><span>Материал слоя {i + 1}</span><select value={id} onChange={e => update("combinedMaterials", input.combinedMaterials.map((v, j) => j === i ? e.target.value as LayoutInput["materialId"] : v))}>{materials.filter(m => m.id !== "M8").map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>)}<p className="field-hint">Каждый материал учитывается отдельно. Количество повторений комбинации задаётся в дополнительных настройках.</p></fieldset>}
      {(wide || showAdvanced) && <div className="advanced-fields">
        {!wide && <>
          <label className="field"><span>Несущие элементы</span><select value={input.structuralSystem === "spatial-truss" && input.spatialSupports ? "spatial-combined" : input.structuralSystem}
            onChange={e => { const combined = e.target.value === "spatial-combined"; setInput(c => ({ ...c, structuralSystem: combined ? "spatial-truss" : e.target.value as LayoutInput["structuralSystem"], spatialSupports: combined })); setMessage(""); }}>
            {structuralSystems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}<option value="spatial-combined">Пространственная опора + ферма</option>
          </select></label>
          <label className="field"><span>Форма сечения на схеме</span><select value={input.sectionType} onChange={e => update("sectionType", e.target.value as LayoutInput["sectionType"])}><option value="profile">Профильная труба</option><option value="round">Круглая труба</option></select></label>
          <label className="field"><span>Условный тип основания</span><select value={input.foundation} onChange={e => update("foundation", e.target.value as LayoutInput["foundation"])}><option value="block">Незаглублённый блок</option><option value="pile-cap">Сваи с ростверком</option></select></label>
          <p className="field-hint">Основание показано условно. Выбор требует инженерной проверки грунтов, нагрузок и площадки.</p>
        </>}
        {!wide && <div className="field-grid">{number("step", "Максимальный шаг секций", 10)}<label className="field"><span>Слои заполнения</span><select value={input.layers} onChange={e => update("layers", Number(e.target.value))}><option>1</option><option>2</option><option>3</option></select></label></div>}
        {!wide && ["C2", "C4", "C6", "C7", "C8"].includes(input.shapeId) && <fieldset><legend>Включить стороны в заказ</legend><div className="check-grid">{["Передняя", "Правая", "Задняя", "Левая"].map((label, i) => (input.shapeId !== "C6" || [1, 3].includes(i)) && (input.shapeId !== "C7" || i === 0) && <label key={label} className="check-field"><input type="checkbox" checked={input.sides[i]} onChange={() => toggleSide(i)} />{input.shapeId === "C7" ? "Боковое заполнение" : label}</label>)}</div></fieldset>}
        {["C1", "C2", "C4"].includes(input.shapeId) || (input.shapeId === "C5" && input.variant === "screen") ? <>
          <label className="check-field"><input type="checkbox" checked={input.opening.enabled} onChange={e => update("opening", { ...input.opening, enabled: e.target.checked })} />Проём в передней стороне</label>
          {input.opening.enabled && (wide ? <div className="opening-sliders" role="group" aria-label="Размеры проёма">
            <DimensionSlider label="Ширина проёма" value={input.opening.width} min={0.1}
              max={Number.isFinite(input.length - input.opening.offset) ? Math.max(0.1, input.length - input.opening.offset) : 200}
              onValue={v => update("opening", { ...input.opening, width: v })} />
            <DimensionSlider label="Высота проёма" value={input.opening.height} min={0.1} max={Number.isFinite(input.height) ? Math.max(0.1, input.height) : 30}
              onValue={v => update("opening", { ...input.opening, height: v })} />
            <DimensionSlider label="Отступ от левого края" value={input.opening.offset} min={0}
              max={Number.isFinite(input.length - input.opening.width) ? Math.max(0, input.length - input.opening.width) : 200}
              onValue={v => update("opening", { ...input.opening, offset: v })} />
          </div> : <div className="field-grid">{(["width", "height", "offset"] as const).map((key, i) => <label className="field" key={key}><span>{["Ширина", "Высота", "Отступ от левого края"][i]}, м</span><NumberInput value={input.opening[key]} min={key === "offset" ? 0 : 0.1} onValue={v => update("opening", { ...input.opening, [key]: v })} /></label>)}</div>)}
        </> : null}
      </div>}
      {input.shapeId === "C8" && <div className="contour-inputs"><p className="field-hint">Отступ каждого контура измеряется от габарита объекта, а не от соседнего контура.</p>{input.contours.map((contour, i) => <fieldset key={i}><legend><label className="check-field"><input type="checkbox" checked={contour.enabled} onChange={e => update("contours", input.contours.map((v, j) => j === i ? { ...v, enabled: e.target.checked } : v))} />Контур {i + 1}</label></legend><div className="field-grid">{(["offset", "height"] as const).map(key => <label className="field" key={key}><span>{key === "offset" ? "Отступ" : "Высота"}, м</span><NumberInput value={contour[key]} min={key === "height" ? 0.5 : 0.1} max={key === "height" ? 80 : 20} onValue={amount => update("contours", input.contours.map((v, j) => j === i ? { ...v, [key]: amount } : v))} /></label>)}</div><ContourFields value={contour} onValue={next => update("contours", input.contours.map((v, j) => j === i ? next : v))} /></fieldset>)}<label className="field"><span>Внутренний стеновой модуль</span><select value={input.wallModule} onChange={e => update("wallModule", e.target.value as LayoutInput["wallModule"])}><option value="none">Без стенового модуля</option>{wallModules.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label></div>}
      <fieldset><legend>Нужные работы</legend><div className="check-grid">{([["design", "Проектирование"], ["manufacturing", "Изготовление"], ["delivery", "Доставка"], ["installation", "Монтаж"]] as const).map(([id, label]) => <label key={id} className="check-field"><input type="checkbox" checked={input.services.includes(id)} onChange={e => update("services", e.target.checked ? [...input.services, id] : input.services.filter(s => s !== id))} />{label}</label>)}</div></fieldset>
      <p className="field-hint">Размеры и шаг задают предварительную компоновку. Сечения, основания и допустимые пролёты проверяет проектировщик.</p>
    </div>
  );
  return <div className={wide ? "calculator calculator-wide" : "calculator"} data-shape={input.shapeId}>
    {wide && <ShapePicker value={input.shapeId} onChange={choose} />}
    {!wide && settings}
    <div className="calculator-output">
      {!wide && <div className="viewer-toolbar"><span className="step-title"><span>02</span> Предварительная схема</span><span className="viewer-badge">{three ? "3D / 2D" : "Аксонометрия"}</span></div>}
      <div className="viewer-stage">
        <div className="viewer" ref={viewer}>{result.graph ? three ? <Scene graph={result.graph} view={view} onlyFrame={onlyFrame} hiddenGroups={hiddenGroups} rightInset={rightInset} topInset={topInset} leftInset={leftInset} /> : <div className="scene-fallback" style={{ paddingRight: rightInset, paddingTop: topInset, paddingLeft: leftInset }}><ModelDiagram graph={result.graph} /></div> : <div className="viewer-error" role="alert">{result.error}</div>}</div>
        {wide && <div className="dimension-panel" ref={dimensionPanel} role="region" aria-label="Размеры конструкции"><strong>Размеры конструкции</strong>{dimensions}
          <CompactOptions input={input} onSection={v => update("sectionType", v)} onFoundation={v => update("foundation", v)} onSide={toggleSide} />
        </div>}
        {wide && <div id="configuration-parameters" className="parameter-panel" role="region" aria-label="Настройки конструкции" ref={parameterPanel}>
          <div className="parameter-panel-heading"><strong>Параметры конструкции</strong></div>
          {settings}
        </div>}
      </div>
      {wide && <MaterialPicker value={input.materialId} onChange={id => update("materialId", id)} noWalls={input.shapeId === "C3" || (input.shapeId === "C5" && input.variant === "shelter")} />}
      {wide && hasRoofOptions && <MaterialPicker target="roof" value={input.roofMaterialId} enabled={input.roof} onChange={chooseRoof}
        note={requiredRoof ? "Покрытие обязательно для этой конструкции" : input.roof ? "Нажмите выбранный материал, чтобы убрать кровлю" : "Без кровли — выберите материал, чтобы включить"} />}
      {wide && <StructurePicker value={input.structuralSystem} spatialSupports={input.spatialSupports} onChange={chooseStructure} />}
      <p className="viewer-help">Вращение: перетащите схему. Масштаб: колесо мыши или жест двумя пальцами. Без WebGL доступна 2D-схема.</p>
      <div className="viewer-controls"><div className="view-buttons">{([["perspective", "3D"], ["top", "Сверху"], ["front", "Спереди"], ["side", "Сбоку"]] as const).map(([key, label]) => <button key={key} className={view === key ? "selected" : ""} aria-pressed={view === key} onClick={() => setView(key)}>{label}</button>)}</div><label className="check-field"><input type="checkbox" checked={onlyFrame} onChange={e => setOnlyFrame(e.target.checked)} />Только каркас</label></div>
      {input.shapeId === "C8" && <div className="viewer-layers"><span>Видимость (состав заказа не меняется):</span>{input.contours.map((c, i) => c.enabled && <label key={i} className="check-field"><input type="checkbox" checked={!hiddenGroups.includes(`contour${i + 1}`)} onChange={e => setHiddenGroups(old => e.target.checked ? old.filter(g => g !== `contour${i + 1}`) : [...old, `contour${i + 1}`])} />Контур {i + 1}</label>)}</div>}
      {result.graph && <div className="dimension-strip"><span>L {format(result.graph.bounds.length)} м</span><span>W {format(result.graph.bounds.width)} м</span><span>H {format(result.graph.bounds.height)} м</span><span>Профили показаны условно</span></div>}
      {input.shapeId === "C7" && input.variant === "dome" && <p className="field-hint viewer-caption">Форма покрытия: секторное шатровое покрытие. Площадь рассчитана по граням схемы.</p>}
      <DetailViews foundation={input.foundation} sectionType={input.sectionType} />
      {q && <div className="estimate-result" aria-live="polite"><div className="step-title"><span>03</span> Объёмы и следующий шаг</div><div className="quantity-grid"><div><strong>{format(q.total)}<small> м²</small></strong><span>Заполнение, с учётом слоёв</span></div><div><strong>{q.supports}</strong><span>Опор в предварительной схеме</span></div><div><strong>{format(q.memberLength)}<small> м</small></strong><span>Элементов каркаса</span></div></div><details><summary>Посмотреть ведомость</summary><div className="table-scroll"><table><tbody><tr><td>Покрытие, без повторения слоёв</td><td>{format(q.roof)} м²</td></tr><tr><td>Стены, без повторения слоёв</td><td>{format(q.walls)} м²</td></tr>{Object.entries(q.byMaterial).map(([id, area]) => <tr key={id}><td>{materials.find(m => m.id === id)?.name}</td><td>{format(area!)} м²</td></tr>)}<tr><td>Трубы заполнения</td><td>{format(q.infillLength)} м</td></tr><tr><td>Стеновых модулей (условно)</td><td>{q.wallModules} шт.</td></tr><tr><td>Объём стеновых модулей (условно)</td><td>{format(q.wallVolume)} м³</td></tr><tr><td>Канаты схемы</td><td>{format(q.cableLength)} м</td></tr></tbody></table></div><p className="field-hint">Масса, крепления, фундамент и расход на раскрой определяются после подбора профилей и технологии. Трубчатый рисунок и провис условны.</p></details><div className="quote-row"><div><strong>Стоимость — по запросу</strong><p>Инженер проверит схему и подготовит предложение.</p></div><button className="button button-primary" onClick={request}>Получить расчёт <span aria-hidden="true">↗</span></button></div></div>}
      <div className="export-actions"><button onClick={download} disabled={!result.graph}>Сохранить JSON</button><button onClick={() => file.current?.click()}>Открыть JSON</button><button onClick={() => window.print()} disabled={!result.graph}>Печатная карточка</button><input className="visually-hidden" type="file" ref={file} accept=".json,application/json" onChange={e => void importFile(e.target.files?.[0])} /></div>
      {message && <p className="form-message" role="status">{message}</p>}
      {q && <div className="print-card"><h2>Предварительная компоновка — {shape.name}</h2><p>{company.name} · {company.contacts.general.phone.display} · {company.contacts.general.email.address}</p><p>{company.officeAddress}</p><p>Схема обновлена: {calculatedAt} (московское время).</p><p>Источник контактов: {company.sourceUrl}</p><p>Нужные работы: {input.services.map(id => ({ design: "Проектирование", manufacturing: "Изготовление", supply: "Комплектация", delivery: "Доставка", installation: "Монтаж" })[id]).join(", ") || "Уточняются"}.</p><p>Версия конфигурации 1. Тарифы не заданы. Стоимость определяется инженером; карточка не является КМ/КМД.</p><p>Длина {format(result.graph!.bounds.length)} м · Ширина {format(result.graph!.bounds.width)} м · Высота {format(result.graph!.bounds.height)} м</p><ModelDiagram graph={result.graph!} /><table><tbody>{Object.entries(q.byMaterial).map(([id, area]) => <tr key={id}><td>{materials.find(m => m.id === id)?.name}</td><td>{format(area!)} м²</td></tr>)}<tr><td>Опор</td><td>{q.supports}</td></tr><tr><td>Элементов каркаса</td><td>{format(q.memberLength)} м</td></tr></tbody></table></div>}
    </div>
  </div>;
}






