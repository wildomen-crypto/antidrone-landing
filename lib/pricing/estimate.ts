import type { ModelGraph } from "../geometry/generate";
import { quantities } from "../geometry/generate";
/** Commercial tariffs have not been supplied. Never generate a fictional quote. */
export function estimate(graph: ModelGraph) {
  return { mode: "manual" as const, priceVersion: null, amount: null, vat: "Уточняется в предложении", quantities: quantities(graph), message: "Стоимость рассчитывает инженер по составу работ и условиям объекта." };
}
