import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { legal } from "../../config/legal";

export type LeadPayload = { name: string; contact: string; phone?: string; email?: string; region: string; comment: string; consentVersion: string; configuration: unknown; summary: unknown };
let database: DatabaseSync | undefined;
function db() {
  if (database) return database;
  const directory = process.env.DATA_DIR || path.join(process.cwd(), ".local", "data");
  mkdirSync(directory, { recursive: true });
  database = new DatabaseSync(path.join(directory, "leads.sqlite"));
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, consent_version TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits (client_hash TEXT PRIMARY KEY, started_at INTEGER NOT NULL, count INTEGER NOT NULL);`);
  const columns = new Set((database.prepare("PRAGMA table_info(outbox)").all() as { name: string }[]).map(c => c.name));
  if (!columns.has("next_attempt_at")) database.exec("ALTER TABLE outbox ADD COLUMN next_attempt_at INTEGER NOT NULL DEFAULT 0");
  if (!columns.has("locked_until")) database.exec("ALTER TABLE outbox ADD COLUMN locked_until INTEGER NOT NULL DEFAULT 0");
  if (!columns.has("last_error")) database.exec("ALTER TABLE outbox ADD COLUMN last_error TEXT");
  return database;
}
export function allowedRate(ip: string) {
  const d = db(), hash = createHash("sha256").update(ip).digest("hex"), now = Date.now();
  const row = d.prepare("SELECT started_at,count FROM rate_limits WHERE client_hash=?").get(hash) as { started_at: number; count: number } | undefined;
  if (!row || now - row.started_at > 600000) { d.prepare("INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)").run(hash, now, 1); return true; }
  if (row.count >= 8) return false;
  d.prepare("UPDATE rate_limits SET count=count+1 WHERE client_hash=?").run(hash); return true;
}
export function saveLead(key: string, payload: LeadPayload) {
  const d = db(), text = JSON.stringify(payload), hash = createHash("sha256").update(text).digest("hex");
  d.exec("BEGIN IMMEDIATE");
  try {
    const existing = d.prepare("SELECT id,payload_hash FROM leads WHERE request_key=?").get(key) as { id: string; payload_hash: string } | undefined;
    if (existing) {
      if (existing.payload_hash !== hash) throw new Error("IDEMPOTENCY_CONFLICT");
      d.exec("COMMIT"); return { id: existing.id, duplicate: true };
    }
    const id = randomUUID(), time = new Date().toISOString();
    d.prepare("INSERT INTO leads VALUES(?,?,?,?,?,?)").run(id, key, hash, text, time, payload.consentVersion);
    d.prepare("INSERT INTO outbox(id,lead_id,status,created_at) VALUES(?,?,?,?)").run(randomUUID(), id, "pending", time);
    d.exec("COMMIT"); return { id, duplicate: false };
  } catch (error) { d.exec("ROLLBACK"); throw error; }
}
export async function deliverNotifications() {
  const endpoint = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!endpoint) return;
  // Notify only ID: recipient's authenticated integration fetches actual data separately.
  const d = db(), now = Date.now();
  d.prepare("UPDATE outbox SET status='pending' WHERE status='sending' AND locked_until<?").run(now);
  const rows = d.prepare("SELECT id,lead_id,attempts FROM outbox WHERE status='pending' AND attempts<5 AND next_attempt_at<=? ORDER BY created_at LIMIT 10").all(now) as { id: string; lead_id: string; attempts: number }[];
  for (const row of rows) {
    const claimed = d.prepare("UPDATE outbox SET status='sending',locked_until=? WHERE id=? AND status='pending'").run(Date.now() + 60000, row.id);
    if (!claimed.changes) continue;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": row.id, ...(process.env.NOTIFICATION_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ leadId: row.lead_id }), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("NOTIFICATION_FAILED");
      d.prepare("UPDATE outbox SET status='sent',attempts=attempts+1,locked_until=0,last_error=NULL WHERE id=?").run(row.id);
    } catch {
      d.prepare("UPDATE outbox SET status=?,attempts=attempts+1,locked_until=0,next_attempt_at=?,last_error='receiver_unavailable' WHERE id=?").run(row.attempts + 1 >= 5 ? "failed" : "pending", Date.now() + Math.min(3600000, 60000 * 2 ** row.attempts), row.id);
    }
  }
}
export function pruneExpired() {
  const d = db(), date = new Date(Date.now() - legal.retentionDays * 86400000).toISOString();
  d.exec("BEGIN IMMEDIATE");
  try {
    d.prepare("DELETE FROM outbox WHERE lead_id IN(SELECT id FROM leads WHERE created_at<?)").run(date);
    d.prepare("DELETE FROM leads WHERE created_at<?").run(date);
    d.prepare("DELETE FROM rate_limits WHERE started_at<?").run(Date.now() - 86400000);
    d.exec("COMMIT");
  } catch (error) { d.exec("ROLLBACK"); throw error; }
}
export function queueStatus() {
  const d = db();
  return { leads: (d.prepare("SELECT count(*) count FROM leads").get() as { count: number }).count, outbox: d.prepare("SELECT status,count(*) count FROM outbox GROUP BY status").all() };
}
export function listLeads(limit = 20) { return db().prepare("SELECT id,created_at,consent_version FROM leads ORDER BY created_at DESC LIMIT ?").all(Math.max(1, Math.min(100, limit))); }
export function readLead(id: string) {
  const row = db().prepare("SELECT id,payload,created_at,consent_version FROM leads WHERE id=?").get(id) as { id: string; payload: string; created_at: string; consent_version: string } | undefined;
  return row ? { ...row, payload: JSON.parse(row.payload) } : null;
}
export function deleteLead(id: string) {
  const d = db(); d.exec("BEGIN IMMEDIATE");
  try { d.prepare("DELETE FROM outbox WHERE lead_id=?").run(id); const deleted = d.prepare("DELETE FROM leads WHERE id=?").run(id); d.exec("COMMIT"); return Number(deleted.changes); }
  catch (error) { d.exec("ROLLBACK"); throw error; }
}
export function retryFailed() { return db().prepare("UPDATE outbox SET status='pending',attempts=0,next_attempt_at=0,locked_until=0,last_error=NULL WHERE status='failed'").run().changes; }
export async function backupLeads(target: string) {
  const resolved = path.resolve(target), relative = path.relative(path.join(process.cwd(), "public"), resolved);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) throw new Error("PRIVATE_PATH_REQUIRED");
  if (existsSync(resolved)) throw new Error("BACKUP_ALREADY_EXISTS");
  await backup(db(), resolved);
}
