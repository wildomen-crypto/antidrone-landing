import { parseInput } from "../configuration/input";
import { generateModel } from "../geometry/generate";
import { estimate } from "../pricing/estimate";
import { formatServices } from "../configuration/services";
import { shapes, materials, structuralSystems } from "../../config/catalog";
import { parseLeadContacts } from "./contact";

/** The field contract observed in the host's custom.js; no second mail system. */
export function siteFormFields(payload: string): Record<string, string> {
  const lead = JSON.parse(payload);
  if (!lead || lead.consent !== true || lead.website) throw new Error("Подтвердите согласие на обработку данных.");
  const contacts = parseLeadContacts(lead);
  if (typeof lead.name !== "string" || lead.name.length > 100 || typeof lead.comment !== "string" || lead.comment.length > 2000) throw new Error("Проверьте поля заявки.");
  const lines = [lead.comment.trim(), "Заявка на проект антидроновой защиты."];
  if (lead.configuration) {
    const input = parseInput(lead.configuration);
    const price = estimate(generateModel(input), input);
    lines.push(
      "Конструкция: " + shapes.find(shape => shape.id === input.shapeId)?.name,
      "Работы: " + formatServices(input.services),
      "Опоры: " + structuralSystems.find(system => system.id === input.structuralSystem)?.name,
      "Заполнение: " + materials.find(material => material.id === input.materialId)?.name,
      "Предварительная стоимость: " + (price.amount === null ? "уточняется" : "≈ " + price.amount.toLocaleString("ru-RU") + " ₽") + ".",
      // Preserve all dimensions, opening, layers, roof, and independent contours.
      "Параметры 3D (JSON): " + JSON.stringify(input),
    );
  }
  lines.push("Согласие на обработку данных: принято.");
  return { "DATA[NAME]": lead.name.trim(), "DATA[PHONE_WORK]": contacts.phone,
    "DATA[EMAIL_WORK]": contacts.email, "DATA[COMMENTS]": lines.filter(Boolean).join("\n") };
}
