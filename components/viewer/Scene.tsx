"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, Component } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ModelDiagram } from "./ModelDiagram";
import type { CameraView } from "./ModelDiagram";
import type { ModelGraph, Member, Panel, Solid } from "@/lib/geometry/generate";
import { Dimensions } from "./Dimensions";

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Members({ members, scale, sectionType }: { members: Member[]; scale: number; sectionType: ModelGraph["sectionType"] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D(), direction = new THREE.Vector3();
    members.forEach((m, index) => {
      const a = new THREE.Vector3(...m.a), b = new THREE.Vector3(...m.b);
      const thickness = m.kind === "frame" ? scale : m.kind === "brace" ? scale * 0.6 : scale * 0.35;
      dummy.position.copy(a).add(b).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.copy(b).sub(a).normalize());
      dummy.scale.set(thickness, a.distanceTo(b), thickness); dummy.updateMatrix();
      ref.current!.setMatrixAt(index, dummy.matrix);
      ref.current!.setColorAt(index, new THREE.Color(m.group === "contour1" ? "#39797e" : m.group === "contour2" ? "#628eb1" : m.group === "contour3" ? "#2355d6" : m.kind === "infill" ? "#6d8ea5" : "#344e66"));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [members, scale]);
  return <instancedMesh key={sectionType + members.length} ref={ref} args={[undefined, undefined, members.length]} frustumCulled={false}>{sectionType === "round" ? <cylinderGeometry args={[1, 1, 1, 8]} /> : <boxGeometry args={[1.65, 1, 1.65]} />}<meshStandardMaterial metalness={0.35} roughness={0.65} /></instancedMesh>;
}
function SolidInstances({ solids, material }: { solids: Solid[]; material: Solid["material"] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    solids.forEach((s, i) => { dummy.position.set(...s.center); dummy.scale.set(...s.size); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); });
    ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere();
  }, [solids]);
  return <instancedMesh key={material + solids.length} ref={ref} args={[undefined, undefined, solids.length]} frustumCulled={false}><boxGeometry /><meshStandardMaterial color={material === "concrete" ? "#a7b4c2" : material === "gabion" ? "#7c8b91" : "#46607a"} wireframe={material === "gabion"} /></instancedMesh>;
}
function Solids({ solids }: { solids: Solid[] }) {
  const groups = useMemo(() => (["concrete", "steel", "gabion"] as const).map(material => ({ material, solids: solids.filter(s => s.material === material) })), [solids]);
  return <>{groups.filter(g => g.solids.length).map(g => <SolidInstances key={g.material} solids={g.solids} material={g.material} />)}</>;
}
function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => { const lost = (e: Event) => { e.preventDefault(); onLost(); }; gl.domElement.addEventListener("webglcontextlost", lost); return () => gl.domElement.removeEventListener("webglcontextlost", lost); }, [gl, onLost]);
  return null;
}

function Surfaces({ panels }: { panels: Panel[] }) {
  const groups = useMemo(() => [...new Set(panels.map(p => p.materialId))].map(id => ({ id, panels: panels.filter(p => p.materialId === id) })), [panels]);
  return <>{groups.map(g => <MaterialSurface key={g.id} panels={g.panels} materialId={g.id} />)}</>;
}
function MaterialSurface({ panels, materialId }: { panels: Panel[]; materialId: string }) {
  const texture = useMemo(() => {
    const size = 64, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const thin = materialId === "M1" ? 2 : materialId === "M5" ? 4 : 3;
      const square = x < thin || y < thin;
      const diagonal = (x + y) % 32 < 2 || (x - y + 64) % 32 < 2;
      const hex = ((y % 32 < 2 && (x % 32) > 8 && (x % 32) < 24) || Math.abs((x % 32) - Math.abs(16 - y % 32) / 2 - 8) < 1.5 || Math.abs((x % 32) + Math.abs(16 - y % 32) / 2 - 24) < 1.5);
      const perforated = Math.hypot(x % 16 - 8, y % 16 - 8) > 4.5;
      const visible = materialId === "M2" ? diagonal : materialId === "M3" ? hex : materialId === "M7" ? perforated : materialId === "M8" ? square || diagonal : materialId === "M6" ? y < 4 : square;
      const i = (y * size + x) * 4; data[i] = 91; data[i + 1] = 129; data[i + 2] = 156; data[i + 3] = visible ? 255 : 0;
    }
    const t = new THREE.DataTexture(data, size, size); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
  }, [materialId]);
  const geometry = useMemo(() => {
    const positions: number[] = [], uv: number[] = [];
    for (const p of panels) {
      const a = new THREE.Vector3(...p.points[0]), b = new THREE.Vector3(...p.points[1]), c = new THREE.Vector3(...p.points[2]);
      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      const main = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)].indexOf(Math.max(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)));
      for (let layer = 0; layer < p.layers; layer++) for (let i = 1; i < p.points.length - 1; i++) for (const pt of [p.points[0], p.points[i], p.points[i + 1]]) {
        positions.push(pt[0] + normal.x * layer * 0.05, pt[1] + normal.y * layer * 0.05, pt[2] + normal.z * layer * 0.05);
        uv.push((main === 0 ? pt[2] : pt[0]) / 0.6, (main === 1 ? pt[2] : pt[1]) / 0.6);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
  }, [panels]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh geometry={geometry}><meshStandardMaterial map={texture} transparent opacity={materialId === "M7" ? 0.65 : 0.6} alphaTest={0.05} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
}

function Camera({ graph, view, rightInset, topInset, leftInset }: { graph: ModelGraph; view: CameraView; rightInset: number; topInset: number; leftInset: number }) {
  const { camera, gl, invalidate, size: viewport } = useThree();
  useEffect(() => {
    const control = new OrbitControls(camera, gl.domElement);
    control.enableDamping = false; control.maxPolarAngle = Math.PI * 0.52;
    const box = new THREE.Box3();
    for (const m of graph.members) { box.expandByPoint(new THREE.Vector3(...m.a)); box.expandByPoint(new THREE.Vector3(...m.b)); }
    for (const s of graph.solids) { const center = new THREE.Vector3(...s.center), size = new THREE.Vector3(...s.size).multiplyScalar(0.5); box.expandByPoint(center.clone().add(size)); box.expandByPoint(center.clone().sub(size)); }
    if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    const target = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), extent = Math.max(size.x, size.y, size.z, 1);
    const reserved = Math.min(rightInset, viewport.width * .65);
    const reservedTop = Math.min(topInset, viewport.height * .7);
    const reservedLeft = Math.min(leftInset, Math.max(0, viewport.width - reserved - 20));
    const fitRatio = Math.min((viewport.width - reserved - reservedLeft) / Math.max(viewport.height, 1), (viewport.height - reservedTop) / Math.max(viewport.height, 1));
    const distance = size.length() * 0.5 / Math.sin(Math.atan(Math.tan(20 * Math.PI / 180) * fitRatio)) * 1.08;
    const direction = new THREE.Vector3(...(view === "top" ? [0.001, 1, 0] : view === "front" ? [0, 0, -1] : view === "side" ? [1, 0, 0] : [1.25, 0.8, 1.4]) as [number, number, number]).normalize();
    camera.position.copy(target).addScaledVector(direction, distance); camera.near = 0.01; camera.far = extent * 60;
    if (camera instanceof THREE.PerspectiveCamera) {
      if (reserved > 0 || reservedTop > 0 || reservedLeft > 0) camera.setViewOffset(viewport.width, viewport.height, (reserved - reservedLeft) / 2, -reservedTop / 2, viewport.width, viewport.height);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    const change = () => invalidate();
    control.target.copy(target); control.update(); control.addEventListener("change", change); invalidate();
    return () => { control.removeEventListener("change", change); control.dispose(); };
  }, [camera, gl, graph.members, graph.solids, view, invalidate, viewport.width, viewport.height, rightInset, topInset, leftInset]);
  return null;
}

export default function Scene({ graph, view, onlyFrame, hiddenGroups, showDimensions = true, rightInset = 0, topInset = 0, leftInset = 0 }: { graph: ModelGraph; view: CameraView; onlyFrame: boolean; hiddenGroups: string[]; showDimensions?: boolean; rightInset?: number; topInset?: number; leftInset?: number }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    try { const context = canvas.getContext("webgl2"); setSupported(!!context); context?.getExtension("WEBGL_lose_context")?.loseContext(); } catch { setSupported(false); }
  }, []);
  const members = useMemo(() => graph.members.filter(m => !hiddenGroups.includes(m.group) && (!onlyFrame || ["frame", "brace"].includes(m.kind))), [graph.members, hiddenGroups, onlyFrame]);
  const panels = useMemo(() => graph.panels.filter(p => !hiddenGroups.includes(p.group)), [graph.panels, hiddenGroups]);
  const solids = useMemo(() => graph.solids.filter(s => !hiddenGroups.includes(s.group)), [graph.solids, hiddenGroups]);
  const fallback = <div className="scene-fallback" style={{ paddingRight: rightInset, paddingTop: topInset, paddingLeft: leftInset }}><ModelDiagram graph={graph} view={view} onlyFrame={onlyFrame} hiddenGroups={hiddenGroups} /></div>;
  if (!supported) return fallback;
  const extent = Math.max(graph.bounds.length, graph.bounds.width, graph.bounds.height, 3);
  return <WebGLBoundary fallback={fallback}><Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 40, position: [20, 14, 20] }} fallback={fallback} gl={{ antialias: true }}>
    <color attach="background" args={["#f0f4f8"]} /><ambientLight intensity={1.8} /><directionalLight position={[20, 35, 20]} intensity={2.3} />
    <ContextGuard onLost={() => setSupported(false)} /><Camera graph={graph} view={view} rightInset={rightInset} topInset={topInset} leftInset={leftInset} /><Members members={members} scale={Math.min(0.055, Math.max(0.025, extent / 450))} sectionType={graph.sectionType} />
    {!onlyFrame && <Surfaces panels={panels} />}
    {graph.object && <mesh position={[0, graph.object.height / 2, 0]}><boxGeometry args={[graph.object.length, graph.object.height, graph.object.width]} /><meshStandardMaterial color="#bdc8d1" transparent opacity={0.25} /></mesh>}
    {graph.wall && <mesh position={[0, graph.wall.height / 2, -0.15]}><boxGeometry args={[graph.wall.length, graph.wall.height, 0.12]} /><meshStandardMaterial color="#c8d0d8" transparent opacity={0.45} /></mesh>}
    <Solids solids={solids} />
    {showDimensions && <Dimensions graph={graph} />}
    <gridHelper args={[extent * 2.2, 24, "#cad5df", "#dde4eb"]} position={[0, -0.03, 0]} />
  </Canvas></WebGLBoundary>;
}
