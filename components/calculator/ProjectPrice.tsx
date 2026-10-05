import type { ProjectLaborPrice } from "@/lib/pricing/project-labor";
export default function ProjectPrice({ estimate }: { estimate: ProjectLaborPrice | null }) {
  const amount = estimate?.amount ?? null;
  return <div className="project-price" aria-live="polite" aria-atomic="true">
    <span>Цена проекта</span>
    <strong>{amount === null ? "Выберите разделы" : `≈ ${amount.toLocaleString("ru-RU")} ₽`}</strong>
    <small>{amount === null ? "КМ, КМД или КЖ" : `≈ ${estimate!.hours.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч · ${estimate!.hourlyRate.toLocaleString("ru-RU")} ₽/ч`}</small>
    {amount !== null && <small>Черновая оценка</small>}
  </div>;
}
