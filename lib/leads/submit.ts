import { sitePath } from "../site-path";
import { siteFormFields } from "./site-form";
export type JoomlaHost = { transport?: "site-form"; endpoint: string; tokenName?: string; moduleId: number; enabled: boolean; requiresAllContacts?: boolean };
declare global { interface Window { antidroneJoomlaHost?: JoomlaHost } }

function submitThroughParent(fields: Record<string, string>, key: string): Promise<{ sent: true }> {
  if (window.parent === window) throw new Error("Откройте форму через страницу Joomla.");
  return new Promise((resolve, reject) => {
    const finish = () => { clearTimeout(timer); window.removeEventListener("message", receive); };
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== "antidrone:result" || event.data.requestId !== key) return;
      finish();
      if (event.data.success === true) resolve({ sent: true });
      else reject(new Error(typeof event.data.message === "string" ? event.data.message : "Не удалось отправить заявку."));
    };
    const timer = setTimeout(() => { finish(); reject(new Error("Не удалось подтвердить отправку. Свяжитесь с компанией по телефону или email.")); }, 40000);
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "antidrone:submit", requestId: key, fields }, location.origin);
  });
}

export async function submitLead(payload: string, key: string): Promise<{ id?: string; sent?: boolean }> {
  const host = window.antidroneJoomlaHost;
  if (host) {
    if (!host.enabled) throw new Error("Приём заявок в модуле ещё не включён. Свяжитесь с компанией по телефону или email.");
    const endpoint = new URL(host.endpoint, location.href);
    if (endpoint.origin !== location.origin) throw new Error("Проверьте подключение модуля Joomla.");
    if (host.transport === "site-form") return submitThroughParent(siteFormFields(payload), key);
    // Compatibility with the previously delivered module, which uses com_ajax.
    if (!host.tokenName || !/^[a-f0-9]{32}$/i.test(host.tokenName)) throw new Error("Проверьте подключение модуля Joomla.");
    const body = new URLSearchParams({ payload, request_id: key, module_id: String(host.moduleId) });
    body.set(host.tokenName, "1");
    const response = await fetch(endpoint.href, { method: "POST", credentials: "same-origin", body });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error(result.message || "Joomla не приняла заявку. Попробуйте ещё раз.");
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!data?.id || data.sent !== true) throw new Error("Отправка заявки не подтверждена.");
    return data;
  }
  if (process.env.NEXT_PUBLIC_JOOMLA_EMBED === "true") throw new Error("Откройте эту страницу через установленный модуль Joomla.");
  const response = await fetch(sitePath("/api/leads"), { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: payload });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Не удалось сохранить заявку. Попробуйте ещё раз.");
  return result;
}
