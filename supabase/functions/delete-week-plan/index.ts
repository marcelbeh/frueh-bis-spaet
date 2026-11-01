import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://marcelbeh.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function responseHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date: string, amount: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: responseHeaders(origin) });
  }
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, origin);
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: "Authentication required" }, 401, origin);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Invalid request" }, 400, origin);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400, origin);
  }

  const { weekMonday, expectedUpdatedAt } = body;
  if (!isDate(weekMonday) || new Date(`${weekMonday}T12:00:00Z`).getUTCDay() !== 1
    || typeof expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
    return jsonResponse({ error: "Bitte prüfe die ausgewählte Kalenderwoche und lade die Seite neu." }, 400, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !adminKey) {
    return jsonResponse({ error: "Die Löschfunktion ist derzeit nicht verfügbar." }, 503, origin);
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Bitte melde dich erneut an." }, 401, origin);
  }

  const { data: owner, error: ownerError } = await admin
    .from("app_owner")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (ownerError) return jsonResponse({ error: "Die Leitungsberechtigung konnte nicht geprüft werden." }, 503, origin);
  if (!owner) return jsonResponse({ error: "Nur die Leitung darf einen Wochenplan löschen." }, 403, origin);

  const { data: stored, error: stateError } = await admin
    .from("app_state")
    .select("state,updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (stateError) return jsonResponse({ error: "Der gespeicherte Dienstplan konnte nicht geladen werden." }, 503, origin);
  if (!stored?.state || typeof stored.state !== "object" || Array.isArray(stored.state)) {
    return jsonResponse({ error: "Der gespeicherte Dienstplan ist nicht verfügbar." }, 404, origin);
  }
  if (stored.updated_at !== expectedUpdatedAt) {
    return jsonResponse({ error: "Der Datenstand wurde zwischenzeitlich geändert. Bitte lade die Seite neu und versuche es erneut." }, 409, origin);
  }

  const state = stored.state as Record<string, unknown>;
  const baseMonday = isDate(state.baseMonday) ? state.baseMonday : null;
  const offset = state.weekOffset;
  if (!baseMonday || !Number.isInteger(offset) || Math.abs(Number(offset)) > 520
    || addDays(baseMonday, Number(offset) * 7) !== weekMonday) {
    return jsonResponse({ error: "Die ausgewählte Woche stimmt nicht mehr mit dem gespeicherten Plan überein. Bitte lade die Seite neu." }, 409, origin);
  }

  const previousShifts = Array.isArray(state.shifts) ? state.shifts : [];
  const remainingShifts = previousShifts.filter((shift: unknown) => {
    if (!shift || typeof shift !== "object" || Array.isArray(shift)) return true;
    const item = shift as Record<string, unknown>;
    const itemOffset = Number.isInteger(item.weekOffset) ? Number(item.weekOffset) : 0;
    return itemOffset !== Number(offset);
  });
  const deletedCount = previousShifts.length - remainingShifts.length;
  const nextState = { ...state, shifts: remainingShifts };
  const updatedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("app_state")
    .update({ state: nextState, updated_at: updatedAt })
    .eq("id", 1)
    .eq("updated_at", expectedUpdatedAt)
    .select("updated_at")
    .maybeSingle();
  if (updateError) return jsonResponse({ error: "Der Wochenplan konnte nicht gelöscht werden. Es wurde nichts geändert." }, 503, origin);
  if (!updated) return jsonResponse({ error: "Der Datenstand wurde zwischenzeitlich geändert. Es wurde nichts gelöscht. Bitte lade die Seite neu." }, 409, origin);

  return jsonResponse({ deletedCount, updatedAt: updated.updated_at }, 200, origin);
});
