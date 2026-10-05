"use client";
import { useRef, useState } from "react";
import { legal } from "@/config/legal";
import type { LayoutInput } from "@/lib/configuration/input";
import { track } from "@/lib/analytics";
import { clearQuoteDraft } from "@/lib/configuration/quote-draft";
import { parseLeadContacts } from "@/lib/leads/contact";

export default function LeadForm({ variant = "inline", configurationValid = true, prepareConfiguration, onSaved, persistConfiguration = false }: { variant?: "inline" | "contact"; configurationValid?: boolean; prepareConfiguration?: () => LayoutInput; onSaved?: (configuration: LayoutInput) => void; persistConfiguration?: boolean }) {
  const contactForm = variant === "contact";
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const key = useRef<string | null>(null);
  const previousPayload = useRef("");
  const [phone, setPhone] = useState(""), [email, setEmail] = useState("");
  const nameField = <label className="field"><input name="name" aria-label="ФИО" autoComplete="name" maxLength={100} placeholder="ФИО (необязательно)" disabled={busy} /></label>;
  const phoneField = <label className="field"><input name="phone" aria-label="Телефон" type="tel" autoComplete="tel" maxLength={120} required={!email.trim()} placeholder="Телефон" value={phone} onChange={event => setPhone(event.target.value)} disabled={busy} /></label>;
  const emailField = <label className="field"><input name="email" aria-label="Email" type="email" autoComplete="email" maxLength={120} required={!phone.trim()} placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>;
  return <form id={contactForm ? undefined : "quote-request"} className={"lead-form " + (contactForm ? "contact-form" : "quote-form")} aria-label={contactForm ? "Обсудим ваш проект" : "Запрос расчёта проекта"} onSubmit={async event => {
    event.preventDefault(); if (busy || !consent || !configurationValid) return;
    const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      const contacts = parseLeadContacts({ phone: data.get("phone"), email: data.get("email") });
      const configuration = prepareConfiguration?.() ?? null;
      const payload = JSON.stringify({ name: data.get("name"), ...contacts, region: "", comment: data.get("comment"), website: data.get("website"), consent, consentVersion: legal.consentVersion, configuration });
      if (payload !== previousPayload.current) key.current = null;
      previousPayload.current = payload;
      key.current ??= crypto.randomUUID();
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key.current }, body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить заявку. Попробуйте ещё раз.");
      setMessage(`Заявка сохранена. Номер: ${result.id}.`); track("lead_saved"); form.reset(); setPhone(""); setEmail(""); setConsent(false); key.current = null;
      if (persistConfiguration) clearQuoteDraft();
      if (configuration) onSaved?.(configuration);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Нет соединения. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }}>
    {contactForm && <><h3>Обсудим ваш проект</h3><p>Оставьте контакт и краткое описание. Укажите нужные разделы КМ, КМД и КЖ и наличие исходных чертежей.</p></>}
    <div className={contactForm ? "contact-fields" : "quote-fields"}>
      {phoneField}{emailField}{nameField}
      <label className="field field-task"><textarea name="comment" aria-label="Описание задачи" maxLength={2000} rows={contactForm ? 3 : 2} placeholder="Описание задачи: объект, размеры, нужные работы" disabled={busy} /></label>
    </div>
    <label className="honeypot" aria-hidden="true">Сайт<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <div className={contactForm ? "contact-form-footer" : "quote-form-footer"}>
      <label className="check-field consent-field"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required disabled={busy} /><span>Даю <a href={legal.consentPath} target="_blank" rel="noopener">согласие на обработку данных</a> для ответа на заявку и ознакомлен с <a href={legal.policyPath} target="_blank" rel="noopener">политикой обработки</a>.</span></label>
      <button className="button button-primary" type="submit" disabled={busy || !consent || !configurationValid}>{busy ? "Сохраняем…" : contactForm ? "Отправить заявку" : "Получить проект"}<span aria-hidden="true">↗</span></button>
    </div>
    {contactForm && <p className="field-hint">Без рекламной рассылки. Не указывайте в форме конфиденциальные сведения об объекте.</p>}
    {!configurationValid && <p className="form-message" role="status">Проверьте размеры конструкции перед отправкой заявки.</p>}
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
