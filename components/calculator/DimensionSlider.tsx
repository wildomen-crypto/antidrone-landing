"use client";

import { useId } from "react";
import NumberInput from "./NumberInput";

export default function DimensionSlider({ label, value, min, max, onValue, unit = "м", step = 0.1, editable = true }: {
  label: string; value: number; min: number; max: number; onValue: (value: number) => void;
  unit?: string; step?: number; editable?: boolean;
}) {
  const id = useId();
  const name = unit ? `${label}, ${unit}` : label;
  const rangeValue = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  return <div className="dimension-slider">
    <div className="dimension-slider-head">
      <label id={id} htmlFor={id + "-range"} title={name}>{name}</label>
      {editable ? <label className="dimension-exact"><span className="visually-hidden">{name}</span>
        <NumberInput value={value} min={min} max={max} onValue={onValue} />
      </label> : <output className="dimension-exact dimension-value" htmlFor={id + "-range"}>{value}</output>}
    </div>
    <input id={id + "-range"} aria-labelledby={id} type="range" min={min} max={max} step={step}
      value={rangeValue} aria-valuetext={[rangeValue.toLocaleString("ru-RU"), unit].filter(Boolean).join(" ")}
      onChange={event => onValue(Number(event.target.value))} />
  </div>;
}
