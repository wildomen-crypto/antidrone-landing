"use client";

import type { ReactNode } from "react";
import type { LayoutInput } from "@/lib/configuration/input";

function IconButton({ name, option, selected, onClick, children }: {
  name: string; option: string; selected: boolean; onClick: () => void; children: ReactNode;
}) {
  return <button type="button" className="compact-option" data-option={option}
    aria-label={name} title={name} aria-pressed={selected} onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  </button>;
}

const faces = ["2,8 10,11 10,18 2,15", "10,11 18,8 18,15 10,18", "10,5 18,8 18,15 10,12", "2,8 10,5 10,12 2,15"];
const sideNames = ["Передняя", "Правая", "Задняя", "Левая"];
const sideIds = ["front", "right", "back", "left"];

export default function CompactOptions({ input, onSection, onFoundation, onSide }: {
  input: LayoutInput; onSection: (value: LayoutInput["sectionType"]) => void;
  onFoundation: (value: LayoutInput["foundation"]) => void; onSide: (index: number) => void;
}) {
  const hasSides = ["C2", "C4", "C6", "C8"].includes(input.shapeId);
  return <div className="compact-options">
    <div className="compact-options-pair">
      <div className="compact-option-group" data-choice="section" role="group" aria-label="Форма сечения на схеме">
        <span>Сечение</span><div className="compact-option-buttons">
          <IconButton name="Профильная труба" option="profile" selected={input.sectionType === "profile"} onClick={() => onSection("profile")}>
            <rect x="3" y="3" width="14" height="14" rx="1" /><rect x="6" y="6" width="8" height="8" rx=".5" />
          </IconButton>
          <IconButton name="Круглая труба" option="round" selected={input.sectionType === "round"} onClick={() => onSection("round")}>
            <circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="4" />
          </IconButton>
        </div>
      </div>
      <div className="compact-option-group" data-choice="foundation" role="group" aria-label="Условный тип основания">
        <span>Основание</span><div className="compact-option-buttons">
          <IconButton name="Незаглублённый блок" option="block" selected={input.foundation === "block"} onClick={() => onFoundation("block")}>
            <path d="M3 9L11 6L18 9L10 12ZM3 9V14L10 17L18 14V9M10 12V17M9 2V8M12 2V7" /><path d="M1 18H19" strokeDasharray="2 2" />
          </IconButton>
          <IconButton name="Сваи с ростверком" option="pile-cap" selected={input.foundation === "pile-cap"} onClick={() => onFoundation("pile-cap")}>
            <path d="M2 7L10 4L18 7L10 10ZM2 7V10L10 13L18 10V7M10 10V13M4 11V17M8 13V19M14 12V18M9 1V6M12 1V5" /><path d="M1 14H19" strokeDasharray="2 2" />
          </IconButton>
        </div>
      </div>
    </div>
    {hasSides && <div className="compact-option-group" data-choice="sides" role="group" aria-label="Включить стороны в заказ">
      <span>Стороны в заказе</span>
      <div className="compact-option-buttons">{sideNames.map((name, index) =>
        (input.shapeId !== "C6" || [1, 3].includes(index)) &&
        <IconButton key={name} name={name} option={sideIds[index]}
          selected={input.walls && input.sides[index]} onClick={() => onSide(index)}>
          <path d="M2 8L10 5L18 8V15L10 18L2 15ZM10 11L2 8M10 11L18 8M10 11V18" opacity=".35" /><polygon points={faces[index]} fill="currentColor" fillOpacity=".25" />
        </IconButton>)}</div>
    </div>}
  </div>;
}
