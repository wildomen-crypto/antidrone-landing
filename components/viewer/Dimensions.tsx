"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ModelGraph, Point } from "@/lib/geometry/generate";
function Label({ text, point, scale }: { text: string; point: Point; scale: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 112;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fillRect(0,0,512,112); ctx.fillStyle = "#2355d6"; ctx.font = "600 72px Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text,256,56);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={[...point]} scale={[scale * 3, scale * .66, 1]} renderOrder={1000}><spriteMaterial map={texture} depthTest={false} depthWrite={false} /></sprite>;
}
export function Dimensions({ graph }: { graph: ModelGraph }) {
  const lines = useMemo(() => {
    const {length:l,width:w,height:h} = graph.bounds, pad = Math.max(l,w,h) * .08, z0 = graph.wall ? 0 : -w/2, z1 = graph.wall ? w : w/2;
    const data: {a:Point;b:Point;label:Point;text:string}[] = [
      {a:[-l/2,0,z0-pad],b:[l/2,0,z0-pad],label:[0,0,z0-pad*1.3],text:"L "+l.toLocaleString("ru-RU")+" м"},
      {a:[l/2+pad,0,z0],b:[l/2+pad,0,z1],label:[l/2+pad*1.3,0,(z0+z1)/2],text:"W "+w.toLocaleString("ru-RU")+" м"},
      {a:[-l/2-pad,0,z0],b:[-l/2-pad,h,z0],label:[-l/2-pad*1.3,h/2,z0],text:"H "+h.toLocaleString("ru-RU")+" м"},
    ];return data;
  }, [graph.bounds,graph.wall]);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(lines.flatMap(d=>[...d.a,...d.b]),3)); return g;
  }, [lines]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const scale = Math.max(graph.bounds.length,graph.bounds.width,graph.bounds.height,3) * .09;
  return <><lineSegments geometry={geometry}><lineBasicMaterial color="#6687c5" transparent opacity={.65} /></lineSegments>{lines.map(d=><Label key={d.text} text={d.text} point={d.label} scale={scale} />)}</>;
}
