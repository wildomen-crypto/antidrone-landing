"use client";
import { useEffect, useRef, useState } from "react";
import { shapes } from "@/config/catalog";
import { legal } from "@/config/legal";
import type { LayoutInput } from "@/lib/configuration/input";
import { track } from "@/lib/analytics";

export default function LeadForm() {
  const [configuration, setConfiguration] = useState<LayoutInput | null>(null);
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const key = useRef<string | null>(null);
  useEffect(() => {
    const attach = (event: Event) => { setConfiguration((event as CustomEvent<LayoutInput>).detail); setMessage(""); key.current = null; };
    window.addEventListener("attach-configuration", attach); return () => window.removeEventListener("attach-configuration", attach);
  }, []);
  return <form className="lead-form" onChange={() => { if (!busy) key.current = null; }} onSubmit={async event => {
    event.preventDefault(); if (busy || !consent) return;
    const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setMessage("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key.current }, body: JSON.stringify({ name: data.get("name"), contact: data.get("contact"), region: data.get("region"), comment: data.get("comment"), website: data.get("website"), consent, consentVersion: legal.consentVersion, configuration }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить заявку. Попробуйте ещё раз.");
      setMessage(`Заявка сохранена. Номер: ${result.id}.`); track("lead_saved"); form.reset(); setConsent(false); setConfiguration(null); key.current = null;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Нет соединения. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }}>
    <h3>Обсудим ваш объект</h3><p>Оставьте контакт и краткое описание. Для проекта по чертежам укажите это в комментарии.</p>
    {configuration && <div className="attached-config">Прикреплена схема: {shapes.find(s => s.id === configuration.shapeId)?.name}<button type="button" aria-label="Убрать схему из заявки" onClick={() => { setConfiguration(null); key.current = null; }}>×</button></div>}
    <div className="field-grid"><label className="field"><span>Как к вам обращаться</span><input name="name" autoComplete="name" maxLength={100} placeholder="Имя (необязательно)" disabled={busy} /></label><label className="field"><span>Телефон или email</span><input name="contact" autoComplete="email" maxLength={120} required placeholder="+7 … или email" disabled={busy} /></label></div>
    <label className="field"><span>Регион объекта</span><input name="region" maxLength={100} placeholder="Город / область" disabled={busy} /></label>
    <label className="field"><span>Задача</span><textarea name="comment" maxLength={2000} rows={3} placeholder="Размеры объекта, нужные работы, наличие проекта" disabled={busy} /></label>
    <label className="honeypot" aria-hidden="true">Сайт<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <label className="check-field consent-field"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required disabled={busy} /><span>Даю <a href={legal.consentPath} target="_blank" rel="noopener">согласие на обработку персональных данных</a> для ответа на заявку и ознакомлен с <a href={legal.policyPath} target="_blank" rel="noopener">политикой обработки</a>.</span></label>
    <button className="button button-primary" type="submit" disabled={busy || !consent}>{busy ? "Сохраняем…" : "Отправить заявку"}<span aria-hidden="true">↗</span></button>
    <p className="field-hint">Без рекламной рассылки. Не указывайте в форме конфиденциальные сведения об объекте.</p>
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}
