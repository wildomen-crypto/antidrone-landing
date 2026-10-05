"use client";
import type { ShapeId } from "@/lib/configuration/schema";
export default function ChooseShape({ shapeId, label }: { shapeId: ShapeId; label: string }) {
  return <a className="solution-description" href="#calculator" onClick={event => { event.preventDefault(); window.dispatchEvent(new CustomEvent("choose-shape", { detail: shapeId })); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }}>{label}</a>;
}
