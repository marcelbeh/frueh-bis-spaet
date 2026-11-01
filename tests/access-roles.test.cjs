const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const roleEdge = fs.readFileSync(path.join(root, "supabase/functions/manage-access-roles/index.ts"), "utf8");
const employeeEdge = fs.readFileSync(path.join(root, "supabase/functions/employee-schedule/index.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20261101000100_multi_leadership_roles.sql"), "utf8");

test("role migration keeps employee mapping while toggling employee access", () => {
  assert.match(migration, /add column if not exists enabled boolean not null default true/i);
  assert.match(migration, /update public\.employee_access set enabled = false/i);
  assert.doesNotMatch(migration, /delete from public\.employee_access/i);
});

test("leadership role mutation is server-only, serialized, audited, and protects the last leader", () => {
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /v_leader_count <= 1/);
  assert.match(migration, /insert into public\.access_role_audit/i);
  assert.match(migration, /revoke all on function public\.manage_access_role\([^;]+from public, anon, authenticated/i);
});

test("role endpoint verifies a real user and active leadership before listing or mutation", () => {
  const userCheck = roleEdge.indexOf("admin.auth.getUser(token)");
  const leadershipCheck = roleEdge.indexOf('from("app_owner")');
  const actionCheck = roleEdge.indexOf('input.action === "list"');
  assert.ok(userCheck >= 0 && leadershipCheck > userCheck && actionCheck > leadershipCheck);
  assert.match(roleEdge, /admin\.rpc\("manage_access_role"/);
});

test("dual-role employees can use their schedule; disabled employee access is denied", () => {
  assert.match(employeeEdge, /\.select\("person_name,enabled"\)/);
  assert.match(employeeEdge, /!access\.enabled/);
  assert.doesNotMatch(employeeEdge, /if \(owner\) return jsonResponse\(\{ error: "Employee access required"/);
});

test("client offers role controls and same-session area switching without signing out", () => {
  assert.match(app, /Zugriffsrechte/);
  assert.match(app, /data-access-role="employee"/);
  assert.match(app, /data-access-role="leader"/);
  assert.match(app, /Mein Mitarbeiterbereich/);
  assert.match(app, /Zum Leitungsbereich wechseln/);
  const switchStart = app.indexOf('<button type="button" class="employee-nav-item" data-employee-to-leader');
  const switchEnd = app.indexOf("</button>", switchStart);
  assert.ok(switchStart >= 0 && switchEnd > switchStart);
  assert.doesNotMatch(app.slice(switchStart, switchEnd), /signOut/);
  assert.ok(app.includes("setInterval(check,15000)"));
  assert.doesNotThrow(() => new vm.Script(app));
});
