"use client";
import type { ShapeId } from "@/lib/configuration/schema";
export default function ChooseShape({ shapeId }: { shapeId: ShapeId }) {
  return <button className="card-link" onClick={() => { window.dispatchEvent(new CustomEvent("choose-shape", { detail: shapeId })); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }}>Настроить схему <span aria-hidden="true">↗</span></button>;
}
