import type { ModelGraph } from "../geometry/generate";
import { quantities } from "../geometry/generate";
import type { LayoutInput } from "../configuration/input";
import { projectPricing } from "../../config/project-pricing";
import { projectLaborPrice } from "./project-labor";
export function estimate(graph: ModelGraph, input?: LayoutInput) {
  const q = quantities(graph);
  const projectPrice = input ? projectLaborPrice({
    frameMembers: graph.members.filter(member => member.kind === "frame" || member.kind === "brace").length,
    frameLength: q.memberLength,
    weightedArea: Object.entries(q.byMaterial).reduce((sum, [id, area]) => sum + (area ?? 0) * (projectPricing.materials[id] ?? 1), 0),
    supports: q.supports, height: graph.bounds.height, opening: input.opening.enabled,
    piledFoundation: graph.supports.some(support => support.foundation === "pile-cap"), shapeId: input.shapeId,
  }, input.services, projectPricing) : null;
  return { mode: projectPrice?.mode ?? "manual" as const, priceVersion: projectPrice?.version ?? null, amount: projectPrice?.amount ?? null, currency: projectPrice?.currency ?? null, projectPrice, vat: "Уточняется в предложении", quantities: q, message: "Черновая оценка трудоёмкости. Окончательная стоимость определяется по исходным данным и согласованному составу проекта." };
}
