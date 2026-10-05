import { sitePath } from "../site-path";
export type JoomlaHost = { endpoint: string; tokenName: string; moduleId: number; enabled: boolean };
declare global { interface Window { antidroneJoomlaHost?: JoomlaHost } }

export async function submitLead(payload: string, key: string): Promise<{ id: string; sent?: boolean }> {
  const host = window.antidroneJoomlaHost;
  if (host) {
    if (!host.enabled) throw new Error("Приём заявок в модуле ещё не включён. Свяжитесь с компанией по телефону или email.");
    const endpoint = new URL(host.endpoint, location.href);
    if (endpoint.origin !== location.origin || !/^[a-f0-9]{32}$/i.test(host.tokenName)) throw new Error("Проверьте подключение модуля Joomla.");
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
