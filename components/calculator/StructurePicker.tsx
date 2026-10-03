"use client";

import { useEffect, useRef } from "react";
import { structuralSystems } from "@/config/catalog";
import type { LayoutInput } from "@/lib/configuration/input";
import { isStructureSelected } from "@/lib/configuration/structure";

function StructureImage({ type }: { type: LayoutInput["structuralSystem"] }) {
  return <svg viewBox="0 0 160 90" aria-hidden="true">
    <ellipse cx="80" cy="82" rx="51" ry="4" fill="#1f4059" opacity=".05" />
    <g fill="none" stroke="#536f85" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {type === "tube-post" && <><path d="M73 15L82 12L88 15L79 19ZM73 15V74L79 78L88 74V15M79 19V78" fill="#e7eff5" /><path d="M65 77L79 82L96 76L83 72Z" fill="#c9d7e2" /></>}
      {type === "spatial-column" && <><path d="M66 14L88 10L99 19L76 23ZM66 14V72L76 81L99 76V19M76 23V81M88 10V69" /><path d="M66 14L76 42L66 50L76 81M76 23L99 45L76 52L99 76M99 19L76 42L99 53L76 81M66 34L76 42L99 37M66 54L76 62L99 57" strokeWidth="1.2" /><path d="M60 74L77 86L106 79L88 68Z" fill="#dce6ee" /></>}
      {type === "frame" && <><path d="M33 77V24L42 20H125V74M33 24H117V80M117 24L125 20M117 80L125 74M42 20V73" strokeWidth="3" /><path d="M29 78L35 82L47 77L41 73ZM113 80L119 84L131 79L125 75Z" fill="#dce6ee" /></>}
      {type === "spatial-truss" && <><path d="M16 38L29 25L144 34L132 47ZM16 38V58L132 67V47M144 34V54L132 67M29 25V45" /><path d="M16 38L39 60L62 42L85 64L108 45L132 67M16 58L39 40L62 62L85 44L108 66L132 47M29 25L52 47L75 29L98 51L121 32L144 54M16 58L29 45L144 54" strokeWidth="1.2" /></>}
      {type === "guyed-mast" && <><path d="M76 13L84 10V77L76 81Z" fill="#e3edf4" /><path d="M80 17L24 77M80 17L138 78M80 17L104 66" stroke="#8b9fad" strokeWidth="1.3" /><path d="M69 80L80 85L93 80L83 75Z" fill="#c9d7e2" /><circle cx="24" cy="77" r="3" fill="#a2b6c4" /><circle cx="138" cy="78" r="3" fill="#a2b6c4" /><circle cx="104" cy="66" r="2.5" fill="#a2b6c4" /></>}
      {type === "wall-bracket" && <><path d="M37 14L52 8V74L37 83Z" fill="#e2e8ee" stroke="#a4b2bf" /><path d="M49 27L124 39L119 43L45 31ZM45 31V68L119 43M49 27V64L124 39" /><path d="M45 48L51 46M45 62L51 60" strokeWidth="3" /></>}
    </g>
  </svg>;
}

export default function StructurePicker({ value, spatialSupports, onChange }: {
  value: LayoutInput["structuralSystem"]; spatialSupports: boolean; onChange: (id: LayoutInput["structuralSystem"]) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const lastPicked = useRef<string>(value);
  const selected = (id: LayoutInput["structuralSystem"]) => isStructureSelected({ structuralSystem: value, spatialSupports }, id);
  useEffect(() => {
    const row = strip.current;
    const cards = [...(row?.querySelectorAll<HTMLElement>('[aria-pressed="true"]') ?? [])];
    const card = cards.find(el => el.dataset.system === lastPicked.current) ?? cards.find(el => el.dataset.system === value) ?? cards[0];
    if (!row || !card) return;
    if (card.offsetLeft < row.scrollLeft || card.offsetLeft + card.offsetWidth > row.scrollLeft + row.clientWidth)
      row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2 });
  }, [value, spatialSupports]);
  return <div className="material-picker structure-picker" role="group" aria-label="Несущие элементы">
    <div className="material-picker-heading"><strong>Несущие элементы</strong><span>Пространственную опору и ферму можно выбрать вместе</span></div>
    <div className="material-choice-strip structure-choice-strip" ref={strip}>{structuralSystems.map(system => <button
      type="button" key={system.id} data-system={system.id} className="material-choice structure-choice" aria-label={system.name}
      aria-pressed={selected(system.id)} title={system.description} onClick={() => { lastPicked.current = system.id; onChange(system.id); }}>
      <span className="material-choice-image"><StructureImage type={system.id} /></span>
      <span className="material-choice-name">{system.name}</span>
      <span className="shape-choice-check" aria-hidden="true">{selected(system.id) ? "✓" : ""}</span>
    </button>)}</div>
  </div>;
}
