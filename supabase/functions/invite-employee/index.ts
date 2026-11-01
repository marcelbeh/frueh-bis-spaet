import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://marcelbeh.github.io", "http://localhost:4173", "http://127.0.0.1:4173"]);
const redirectTo = "https://marcelbeh.github.io/frueh-bis-spaet/";

function response(body: Record<string, unknown>, status: number, origin: string | null): Response {
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
  if (request.method === "OPTIONS") return response({}, 200, origin);
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response({ error: "Authentication required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !adminKey) return response({ error: "Employee invitations are unavailable" }, 503, origin);
  const admin = createClient(supabaseUrl, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Authentication required" }, 401, origin);

  const { data: owner, error: ownerError } = await admin.from("app_owner").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (ownerError) return response({ error: "Could not verify manager access" }, 503, origin);
  if (!owner) return response({ error: "Manager access required" }, 403, origin);

  let input: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    input = parsed as Record<string, unknown>;
  } catch {
    return response({ error: "Invalid request body" }, 400, origin);
  }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 120) {
    return response({ error: "Bitte gib einen gültigen Namen und eine gültige E-Mail-Adresse ein." }, 400, origin);
  }

  const { data: stored, error: stateError } = await admin.from("app_state").select("state").eq("id", 1).maybeSingle();
  if (stateError) return response({ error: "Could not verify employee profile" }, 503, origin);
  const state = stored?.state && typeof stored.state === "object" ? stored.state as Record<string, unknown> : {};
  const employeeExists = Array.isArray(state.names) && state.names.some((person: unknown) =>
    person && typeof person === "object" && (person as Record<string, unknown>).name === name
  );
  if (!employeeExists) return response({ error: "Bitte speichere zuerst das Mitarbeitendenprofil." }, 409, origin);

  const { data: existing, error: accessError } = await admin.from("employee_access").select("user_id").eq("person_name", name).maybeSingle();
  if (accessError) return response({ error: "Could not verify employee access" }, 503, origin);
  if (existing) return response({ error: "Für diese Person besteht bereits ein Zugang." }, 409, origin);

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: name },
  });
  if (inviteError || !invited.user) {
    return response({ error: inviteError?.message || "Die Einladung konnte nicht erstellt werden." }, 400, origin);
  }

  const { error: linkError } = await admin.from("employee_access").insert({ user_id: invited.user.id, person_name: name });
  if (linkError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return response({ error: "Der Zugang konnte nicht mit dem Mitarbeiterprofil verknüpft werden." }, 500, origin);
  }

  return response({ invited: true, email }, 200, origin);
});
