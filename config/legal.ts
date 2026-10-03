import { company } from "./company";
/** Source's primary operator is used for local draft documents; public launch is gated. */
export const legal = {
  operator: company.publishedLegalEntity,
  consentVersion: "2026-10-03-draft-1",
  approved: false,
  retentionDays: 180,
  policyPath: "/privacy",
  consentPath: "/consent",
} as const;
