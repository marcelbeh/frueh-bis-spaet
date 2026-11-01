import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://marcelbeh.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function headersFor(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: headersFor(origin) });
}

function berlinMonday(today = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

function addDays(date: string, amount: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

function shiftWorkMinutes(start: string, end: string): number {
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (from === null || to === null || to <= from) return 0;
  const span = to - from;
  if (span <= 360) return span;
  const pauseDuration = span > 570 ? 45 : 30;
  return Math.max(0, span - Math.min(pauseDuration, to - (from + 240)));
}

function eventOccursOnDate(event: Record<string, unknown>, date: string): boolean {
  if (event.date === date) return true;
  if (event.repeatWeekly !== true || typeof event.date !== "string" || date < event.date) return false;
  const repeatDay = Number(event.repeatDay);
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  return Number.isInteger(repeatDay) && weekday === repeatDay;
}
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: headersFor(origin) });
  }
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, origin);
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  let requestBody: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      requestBody = parsed as Record<string, unknown>;
    }
  } catch {
    // Calls without a body show the current calendar week.
  }
  const selectedWeekOffset = requestBody.weekOffset === undefined ? 0 : requestBody.weekOffset;
  if (typeof selectedWeekOffset !== "number" || !Number.isInteger(selectedWeekOffset)
    || Math.abs(selectedWeekOffset) > 260) {
    return jsonResponse({ error: "Invalid calendar week" }, 400, origin);
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: "Authentication required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !adminKey) {
    return jsonResponse({ error: "Employee schedule is unavailable" }, 503, origin);
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Authentication required" }, 401, origin);
  }

  const { data: owner, error: ownerError } = await admin
    .from("app_owner")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (ownerError) return jsonResponse({ error: "Employee schedule is unavailable" }, 503, origin);
  if (owner) return jsonResponse({ error: "Employee access required" }, 403, origin);

  const { data: access, error: accessError } = await admin
    .from("employee_access")
    .select("person_name")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (accessError || !access?.person_name) {
    return jsonResponse({ error: "Employee access required" }, 403, origin);
  }

  const { data: stored, error: stateError } = await admin
    .from("app_state")
    .select("state")
    .eq("id", 1)
    .maybeSingle();
  if (stateError) return jsonResponse({ error: "Employee schedule is unavailable" }, 503, origin);

  const state = stored?.state && typeof stored.state === "object" ? stored.state : {};
  const personName = access.person_name;
  const person = Array.isArray(state.names)
    ? state.names.find((item: unknown) => item && typeof item === "object"
      && (item as Record<string, unknown>).name === personName)
    : null;
  if (!person) return jsonResponse({ error: "Employee profile is unavailable" }, 404, origin);

  const currentMonday = berlinMonday();
  const savedMonday = isDate(state.baseMonday) ? state.baseMonday : currentMonday;
  const elapsedWeeks = Math.round(
    (Date.parse(`${currentMonday}T12:00:00Z`) - Date.parse(`${savedMonday}T12:00:00Z`))
      / 604800000,
  );
  const shifts = Array.isArray(state.shifts) ? state.shifts : [];
  const groupByPerson = new Map<string, string>();
  if (Array.isArray(state.names)) {
    for (const entry of state.names) {
      if (entry && typeof entry === "object") {
        const item = entry as Record<string, unknown>;
        if (typeof item.name === "string" && typeof item.group === "string") {
          groupByPerson.set(item.name, item.group.slice(0, 80));
        }
      }
    }
  }
  const ownShifts = shifts.flatMap((shift: unknown) => {
    if (!shift || typeof shift !== "object") return [];
    const item = shift as Record<string, unknown>;
    const day = Number(item.day);
    const offset = Number.isInteger(item.weekOffset) ? Number(item.weekOffset) : 0;
    const effectiveWeekOffset = offset - elapsedWeeks;
    if (effectiveWeekOffset !== selectedWeekOffset || !Number.isInteger(day) || day < 0 || day > 6
      || typeof item.person !== "string"
      || typeof item.start !== "string" || !/^\d{2}:\d{2}$/.test(item.start)
      || typeof item.end !== "string" || !/^\d{2}:\d{2}$/.test(item.end)) return [];
    const group = typeof item.group === "string" ? item.group : groupByPerson.get(item.person) || "Team";
    return [{
      date: addDays(currentMonday, effectiveWeekOffset * 7 + day),
      start: item.start,
      end: item.end,
      person: item.person.slice(0, 80),
      group: group.slice(0, 80),
      serviceType: typeof item.serviceType === "string" ? item.serviceType.slice(0, 80) : "Dienst",
    }];
  }).sort((a, b) => (a.date + a.start + a.person).localeCompare(b.date + b.start + b.person));
  const rawWeeklyHours = (person as Record<string, unknown>).hours;
  const weeklyHours = rawWeeklyHours !== null && rawWeeklyHours !== undefined && Number.isFinite(Number(rawWeeklyHours))
    ? Math.max(0, Number(rawWeeklyHours))
    : null;
  const scheduleEvents: Array<Record<string, unknown>> = [];
  if (Array.isArray(state.events)) {
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(currentMonday, selectedWeekOffset * 7 + day);
      for (const value of state.events) {
        if (!value || typeof value !== "object") continue;
        const event = value as Record<string, unknown>;
        if (!Array.isArray(event.attendees) || !event.attendees.includes(personName)
          || typeof event.date !== "string" || !eventOccursOnDate(event, date)
          || typeof event.time !== "string") continue;
        const [start, end] = event.time.split(/[–-]/).map((part) => part.trim());
        if (!start || !end || timeToMinutes(start) === null || timeToMinutes(end) === null
          || (timeToMinutes(end) as number) <= (timeToMinutes(start) as number)) continue;
        scheduleEvents.push({
          date,
          start,
          end,
          title: typeof event.title === "string" ? event.title.slice(0, 120) : "Termin",
          type: typeof event.type === "string" ? event.type.slice(0, 80) : "Termin",
        });
      }
    }
  }
  scheduleEvents.sort((a, b) => String(a.date).concat(String(a.start)).localeCompare(String(b.date).concat(String(b.start))));
  const ownShiftMinutes = ownShifts
    .filter((shift) => shift.person === personName)
    .reduce((sum, shift) => sum + shiftWorkMinutes(shift.start, shift.end), 0);
  const eventMinutes = scheduleEvents.reduce((sum, event) => {
    const start = timeToMinutes(String(event.start));
    const end = timeToMinutes(String(event.end));
    return sum + (start !== null && end !== null ? Math.max(0, end - start) : 0);
  }, 0);
  const distributedHours = Number(((ownShiftMinutes + eventMinutes) / 60).toFixed(2));

  const scheduleGroups = Array.isArray(state.groups)
    ? state.groups.filter((group: unknown): group is string => typeof group === "string").map((group: string) => group.slice(0, 80))
    : [];

  return jsonResponse({
    employeeName: personName,
    weekOffset: selectedWeekOffset,
    weeklyHours,
    distributedHours,
    events: scheduleEvents,
    planExists: ownShifts.length > 0,
    groups: scheduleGroups,
    shifts: ownShifts,
  }, 200, origin);
});
