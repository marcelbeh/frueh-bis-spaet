import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://marcelbeh.github.io", "http://localhost:4173", "http://127.0.0.1:4173"]);
function respond(body: Record<string, unknown>, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin",
    },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return respond({}, 200, origin);
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond({ error: "Authentifizierung erforderlich." }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !secret) return respond({ error: "Die Rollenverwaltung ist derzeit nicht verfügbar." }, 503, origin);

  const admin = createClient(supabaseUrl, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return respond({ error: "Authentifizierung erforderlich." }, 401, origin);
  const actorId = auth.user.id;

  const { data: owner, error: ownerError } = await admin.from("app_owner").select("user_id").eq("user_id", actorId).maybeSingle();
  if (ownerError) return respond({ error: "Leitungsberechtigung konnte nicht geprüft werden." }, 503, origin);
  if (!owner) return respond({ error: "Nur Leitungen dürfen Zugriffsrechte verwalten." }, 403, origin);

  let input: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    input = parsed as Record<string, unknown>;
  } catch {
    return respond({ error: "Ungültige Anfrage." }, 400, origin);
  }

  if (input.action === "list") {
    const [{ data: stored, error: stateError }, { data: employeeRows, error: employeeError }, { data: owners, error: leadersError }] =
      await Promise.all([
        admin.from("app_state").select("state").eq("id", 1).maybeSingle(),
        admin.from("employee_access").select("user_id,person_name,enabled"),
        admin.from("app_owner").select("user_id"),
      ]);
    if (stateError || employeeError || leadersError) return respond({ error: "Zugriffsrechte konnten nicht geladen werden." }, 503, origin);

    const state = stored?.state && typeof stored.state === "object" ? stored.state as Record<string, unknown> : {};
    const people = Array.isArray(state.names) ? state.names.filter((person): person is Record<string, unknown> =>
      Boolean(person && typeof person === "object" && typeof (person as Record<string, unknown>).name === "string")
    ) : [];
    const employeeByName = new Map((employeeRows || []).map(row => [row.person_name, row.user_id]));
    const employeeById = new Map((employeeRows || []).map(row => [row.user_id, row.person_name]));
    const leaderIds = new Set((owners || []).map(row => row.user_id));
    const leaders = await Promise.all((owners || []).map(async row => {
      const personName = employeeById.get(row.user_id);
      if (personName) return { label: personName, linkedToEmployee: true };
      const { data } = await admin.auth.admin.getUserById(row.user_id);
      return { label: data.user?.email || "Leitungskonto", linkedToEmployee: false };
    }));
    return respond({
      people: people.map(person => {
        const name = String(person.name);
        const userId = employeeByName.get(name);
        return {
          name,
          hasEmployeeAccount: Boolean(userId),
          employeeAccess: Boolean(userId && employeeRows?.find(row => row.user_id === userId)?.enabled),
          leadershipAccess: Boolean(userId && leaderIds.has(userId)),
        };
      }),
      leaders,
    }, 200, origin);
  }

  if (input.action !== "set-role") return respond({ error: "Unbekannte Aktion." }, 400, origin);
  const personName = typeof input.personName === "string" ? input.personName.trim() : "";
  const role = input.role;
  const enabled = input.enabled;
  if (!personName || personName.length > 120 || (role !== "employee" && role !== "leader") || typeof enabled !== "boolean") {
    return respond({ error: "Ungültige Angaben zur Berechtigungsänderung." }, 400, origin);
  }

  const { data, error } = await admin.rpc("manage_access_role", {
    p_actor_user_id: actorId,
    p_person_name: personName,
    p_role_key: role,
    p_enabled: enabled,
  });
  if (error) {
    const message = error.message || "Die Berechtigung konnte nicht geändert werden.";
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 409 : error.code === "23514" ? 409 : 400;
    return respond({ error: message }, status, origin);
  }
  return respond({ ok: true, ...data }, 200, origin);
});
