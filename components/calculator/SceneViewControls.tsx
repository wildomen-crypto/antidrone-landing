"use client";
import type { CameraView } from "@/components/viewer/ModelDiagram";

const views = [["perspective", "3D"], ["top", "Сверху"], ["front", "Спереди"], ["side", "Сбоку"]] as const;
function ViewIcon({ view, frame = false }: { view: CameraView; frame?: boolean }) {
  const face = view === "top" ? "2,7 10,3 18,7 10,11"
    : view === "front" ? "2,7 10,11 10,18 2,14" : "10,11 18,7 18,14 10,18";
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    {!frame && view !== "perspective" && <polygon points={face} fill="currentColor" fillOpacity=".25" />}
    <path d="M2 7L10 3L18 7V14L10 18L2 14ZM2 7L10 11L18 7M10 11V18" />
    {frame && <path d="M10 3V10M2 14L10 10L18 14" strokeDasharray="2 2" />}
  </svg>;
}

export default function SceneViewControls({ view, onView, onlyFrame, onFrame, lightFrame, onFrameTone }: {
  view: CameraView; onView: (view: CameraView) => void;
  onlyFrame: boolean; onFrame: (value: boolean) => void;
  lightFrame: boolean; onFrameTone: (light: boolean) => void;
}) {
  return <div className="scene-view-controls" role="group" aria-label="Вид схемы">
    {views.map(([key, label]) => <button type="button" key={key} title={label}
      aria-label={label} aria-pressed={view === key} onClick={() => onView(key)}>
      <ViewIcon view={key} />
    </button>)}
    <button type="button" className="scene-frame-toggle" title="Только каркас" aria-label="Только каркас"
      aria-pressed={onlyFrame} onClick={() => onFrame(!onlyFrame)}><ViewIcon view="perspective" frame /></button>
    <button type="button" className="scene-colour-toggle" aria-label="Светлый каркас"
      title={lightFrame ? "Светлый каркас на тёмном фоне — переключить на белый фон" : "Обычные цвета на белом фоне — переключить на светлый каркас"}
      aria-pressed={lightFrame} onClick={() => onFrameTone(!lightFrame)}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7" fill="#344e66" />
        <path d="M10 3A7 7 0 0 0 10 17Z" fill="#edf3f8" />
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  </div>;
}
