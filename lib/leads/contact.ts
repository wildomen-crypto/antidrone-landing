// Both forms and the API use the same rules. Older clients can still send contact.
export function parseLeadContacts(body: { phone?: unknown; email?: unknown; contact?: unknown }) {
  const clean = (value: unknown) => typeof value === "string" && value.trim().length <= 120 ? value.trim() : null;
  const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validPhone = (value: string) => /^\+?[\d\s()\-]+$/.test(value) && value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15;
  if (body.phone === undefined && body.email === undefined) {
    const contact = clean(body.contact);
    if (!contact || (!validEmail(contact) && !validPhone(contact))) throw new Error("Введите корректный телефон или email.");
    return { contact, phone: validPhone(contact) ? contact : "", email: validEmail(contact) ? contact : "" };
  }
  const phone = body.phone === undefined ? "" : clean(body.phone);
  const email = body.email === undefined ? "" : clean(body.email);
  if (phone === null || email === null) throw new Error("Проверьте телефон и email.");
  if (!phone && !email) throw new Error("Укажите телефон или email для связи.");
  if (phone && !validPhone(phone)) throw new Error("Введите корректный телефон: от 10 до 15 цифр.");
  if (email && !validEmail(email)) throw new Error("Введите корректный email.");
  return { phone, email, contact: [phone, email].filter(Boolean).join(" · ") };
}
