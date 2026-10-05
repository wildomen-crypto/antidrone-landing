import type { LaborBook } from "../lib/pricing/project-labor";

/** Draft workload model requested by the user on 2026-10-05; editable assumptions. */
// RUB requested on 2026-10-05. CBR: 83.4839 RUB/USD effective 2026-10-03.
// https://www.cbr.ru/scripts/XML_daily.asp?date_req=05/10/2026
// Rounded fixed rates from 15 USD/h and the 10–20 USD/h range; no live FX dependency.
export const projectPricing: LaborBook = {
  version: "draft-labor-2026-10-05-v2-rub",
  currency: "RUB",
  hourlyRate: 1250,
  rateRange: [835, 1670],
  heightThreshold: 4,
  heightFactor: .035,
  shapes: { C1: 1, C2: 1.05, C3: 1.1, C4: 1.15, C5: 1.15, C6: 1.25, C7: 1.3, C8: 1.4 },
  materials: { M1: .9, M2: .95, M3: 1, M4: 1, M5: 1.15, M6: 1.2, M7: 1.05, M8: 1.3 },
  services: {
    km: { base: 8, member: .035, length: .009, area: .025, support: .1, opening: .5, piledFoundationFactor: 1.05 },
    kmd: { base: 10, member: .09, length: .014, area: .016, support: .16, opening: .75, piledFoundationFactor: 1.08 },
    kzh: { base: 6, member: 0, length: .004, area: 0, support: .55, opening: 0, piledFoundationFactor: 1.4 },
  },
};
