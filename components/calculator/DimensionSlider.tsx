"use client";

import { useId } from "react";
import NumberInput from "./NumberInput";

export default function DimensionSlider({ label, value, min, max, onValue }: {
  label: string; value: number; min: number; max: number; onValue: (value: number) => void;
}) {
  const id = useId();
  const rangeValue = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  return <div className="dimension-slider">
    <div className="dimension-slider-head">
      <label id={id} htmlFor={id + "-range"} title={label + ", м"}>{label}, м</label>
      <label className="dimension-exact"><span className="visually-hidden">{label}, м</span>
        <NumberInput value={value} min={min} max={max} onValue={onValue} />
      </label>
    </div>
    <input id={id + "-range"} aria-labelledby={id} type="range" min={min} max={max} step="0.1"
      value={rangeValue} aria-valuetext={rangeValue.toLocaleString("ru-RU") + " м"}
      onChange={event => onValue(Number(event.target.value))} />
  </div>;
}
