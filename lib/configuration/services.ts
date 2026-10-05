import type { ServiceId } from "./schema";

export const serviceLabels: Record<ServiceId, string> = {
  km: "Разработка КМ",
  kmd: "Разработка КМД",
  kzh: "Разработка КЖ",
};

// These identifiers are accepted only to restore geometry from earlier files.
// An old scope of work does not specify which drawing sections were ordered.
export const LEGACY_SERVICE_IDS = ["design", "manufacturing", "supply", "delivery", "installation"] as const;
export function hasLegacyServices(services: unknown): boolean {
  return Array.isArray(services) && services.some(id => LEGACY_SERVICE_IDS.includes(id));
}
export const servicesUpdatedNotice = "Перечень работ обновлён. Прежние услуги убраны; выберите нужные разделы КМ, КМД и КЖ. Размеры и материалы схемы сохранены.";
export function formatServices(services: readonly ServiceId[]): string {
  return services.map(id => serviceLabels[id]).join(", ") || "Уточняются";
}
