import { NextResponse, after } from "next/server";
import { parseInput, InputError } from "@/lib/configuration/input";
import { generateModel } from "@/lib/geometry/generate";
import { estimate } from "@/lib/pricing/estimate";
import { allowedRate, saveLead, deliverNotifications, pruneExpired } from "@/lib/leads/store";
import { legal } from "@/config/legal";
import { parseLeadContacts } from "@/lib/leads/contact";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (process.env.SITE_PUBLIC === "true" && !legal.approved) return NextResponse.json({ error: "Публичная форма ещё не активирована. Свяжитесь с компанией по телефону или email." }, { status: 503 });
    const origin = request.headers.get("origin");
    // Next's internal request URL may use localhost even when the browser uses
    // 127.0.0.1. Public deployments use an explicit canonical origin.
    const configured = process.env.SITE_ORIGIN;
    const requestOrigin = configured ? new URL(configured).origin : new URL("http://" + request.headers.get("host")).origin;
    if (!configured && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(requestOrigin).hostname)) return NextResponse.json({ error: "Адрес сайта ещё не настроен." }, { status: 503 });
    if (process.env.SITE_PUBLIC === "true" && !configured) return NextResponse.json({ error: "Адрес сайта ещё не настроен." }, { status: 503 });
    if (origin !== requestOrigin) return NextResponse.json({ error: "Запрос должен быть отправлен с сайта." }, { status: 403 });
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Неверный формат запроса." }, { status: 415 });
    if (Number(request.headers.get("content-length")) > 20000) return NextResponse.json({ error: "Слишком большой запрос." }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) throw new InputError("Заявка не содержит данных.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 20000) { await reader.cancel(); return NextResponse.json({ error: "Слишком большой запрос." }, { status: 413 }); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("Проверьте заявку.");
    if (typeof body.website !== "string" || body.website !== "") throw new InputError("Не удалось принять заявку.");
    if (body.consent !== true || body.consentVersion !== legal.consentVersion) throw new InputError("Нужно отдельное согласие на обработку данных.");
    const clean = (value: unknown, max: number) => typeof value === "string" && value.trim().length <= max ? value.trim() : null;
    const name = clean(body.name, 100), region = body.region === undefined ? "" : clean(body.region, 100), comment = clean(body.comment, 2000);
    if (name === null || region === null || comment === null) throw new InputError("Проверьте поля заявки.");
    let contacts;
    try { contacts = parseLeadContacts(body); }
    catch (error) { throw new InputError(error instanceof Error ? error.message : "Проверьте телефон и email."); }
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[\da-f-]{36}$/i.test(key)) throw new InputError("Не удалось идентифицировать заявку. Обновите страницу.");
    const configuration = body.configuration === null ? null : parseInput(body.configuration);
    const summary = configuration ? estimate(generateModel(configuration), configuration) : null;
    const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local" : "direct";
    if (!allowedRate(ip)) return NextResponse.json({ error: "Слишком много запросов. Повторите через 10 минут." }, { status: 429 });
    const result = saveLead(key, { name, ...contacts, region, comment, consentVersion: legal.consentVersion, configuration, summary });
    after(async () => { try { pruneExpired(); await deliverNotifications(); } catch { /* Lead is already durable. */ } });
    return NextResponse.json({ id: result.id, saved: true, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    if (error instanceof InputError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Error && error.message === "IDEMPOTENCY_CONFLICT") return NextResponse.json({ error: "Этот номер запроса уже использован с другими данными." }, { status: 409 });
    return NextResponse.json({ error: "Не удалось сохранить заявку. Повторите позже или свяжитесь с компанией напрямую." }, { status: 503 });
  }
}
