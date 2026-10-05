import type { ModelGraph, Point } from "@/lib/geometry/generate";
export type CameraView = "perspective" | "top" | "front" | "side";
export function ModelDiagram({ graph, view = "perspective", onlyFrame = false, hiddenGroups = [], className = "", paddingRatio = .16 }: { graph: ModelGraph; view?: CameraView; onlyFrame?: boolean; hiddenGroups?: string[]; className?: string; paddingRatio?: number }) {
  const project = (p: Point): [number, number] => view === "top" ? [p[0], p[2]] : view === "front" ? [p[0], -p[1]] : view === "side" ? [p[2], -p[1]] : [(p[0] - p[2]) * 0.8, (p[0] + p[2]) * 0.3 - p[1]];
  const boxes = graph.solids.filter(s => !hiddenGroups.includes(s.group)).map(s => ({ center: s.center, size: s.size, role: s.role }));
  if (graph.object) boxes.push({ center: [0, graph.object.height / 2, 0], size: [graph.object.length, graph.object.height, graph.object.width], role: "wall" });
  if (graph.wall) boxes.push({ center: [0, graph.wall.height / 2, -0.15], size: [graph.wall.length, graph.wall.height, 0.12], role: "wall" });
  const faces = boxes.flatMap(s => {
    const [x,y,z] = s.center, [l,h,w] = s.size.map(v => v / 2);
    return [
      [[x-l,y+h,z-w],[x+l,y+h,z-w],[x+l,y+h,z+w],[x-l,y+h,z+w]],
      [[x-l,y-h,z-w],[x+l,y-h,z-w],[x+l,y+h,z-w],[x-l,y+h,z-w]],
      [[x+l,y-h,z-w],[x+l,y-h,z+w],[x+l,y+h,z+w],[x+l,y+h,z-w]],
    ] as Point[][];
  });
  const points = graph.members.filter(m => !hiddenGroups.includes(m.group)).flatMap(m => [project(m.a), project(m.b)]).concat(faces.flatMap(f => f.map(project)));
  if (!points.length) return <div className="empty-diagram">Все контуры скрыты. Включите видимость, чтобы показать схему.</div>;
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), w = Math.max(...xs) - minX || 1, h = Math.max(...ys) - minY || 1;
  const padding = Math.max(w,h) * paddingRatio, stroke = Math.max(w,h) / 350;
  const color = (group: string) => group === "contour1" ? "#42747f" : group === "contour2" ? "#6e91b7" : group === "contour3" ? "#2355d6" : "#314b64";
  const prefix = ("diagram-" + graph.members.length + "-" + graph.bounds.length + "-" + graph.bounds.height + "-" + view).replaceAll(".", "_");
  const ids = [...new Set(graph.panels.map(p => p.materialId))], cell = Math.max(w,h) / 45;
  return <svg className={"model-diagram " + className} viewBox={[minX-padding,minY-padding,w+padding*2,h+padding*2].join(" ")} role="img" aria-label={"Схема металлоконструкции, вид " + (view === "top" ? "сверху" : view === "front" ? "спереди" : view === "side" ? "сбоку" : "в перспективе")}>
    <defs>{ids.map(id => <pattern key={id} id={prefix+id} width={cell} height={cell} patternUnits="userSpaceOnUse">
      <rect width={cell} height={cell} fill="#789db6" opacity=".04" />
      {id === "M2" || id === "M3" ? <path d={"M0 0L"+cell+" "+cell+"M0 "+cell+"L"+cell+" 0"} stroke="#607f96" strokeWidth={stroke*.3} opacity=".35" /> : id === "M7" ? <circle cx={cell/2} cy={cell/2} r={cell*.2} fill="#748fa4" opacity=".5" /> : <path d={"M0 0H"+cell+(id !== "M6" ? "M0 0V"+cell : "")} stroke="#607f96" strokeWidth={stroke*.35} opacity=".35" />}
    </pattern>)}</defs>
    {faces.map((face,i) => <polygon key={"solid"+i} points={face.map(p=>project(p).join(",")).join(" ")} fill="#a6b8c7" fillOpacity=".2" stroke="#8da3b5" strokeWidth={stroke*.4} />)}
    {!onlyFrame && graph.panels.filter(p=>!hiddenGroups.includes(p.group)).map(p=><polygon key={p.id} points={p.points.map(p=>project(p).join(",")).join(" ")} fill={"url(#"+prefix+p.materialId+")"} stroke={color(p.group)} strokeWidth={stroke/2} />)}
    {graph.members.filter(m=>!hiddenGroups.includes(m.group)&&(!onlyFrame||m.kind==="frame"||m.kind==="brace")).map(m=>{
      const a=project(m.a),b=project(m.b);
      return <line key={m.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color(m.group)} strokeWidth={m.kind==="frame"?stroke*1.8:stroke*.8} strokeOpacity={m.kind==="cable"?.55:.9} />;
    })}
  </svg>;
}
