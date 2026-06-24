globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const STAGES = [
  "Booking Received",
  "Survey Scheduled",
  "Packing Crew Assigned",
  "In Transit",
  "Delivered",
  "Cancelled"
];
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function checkAuth(request, locals) {
  const expected = locals?.runtime?.env?.ADMIN_TOKEN ?? undefined                           ;
  if (!expected) return false;
  const provided = request.headers.get("x-admin-token");
  return !!provided && provided === expected;
}
async function GET({ request, url, locals }) {
  if (!checkAuth(request, locals)) return json({ ok: false, error: "Unauthorized" }, 401);
  const id = url.searchParams.get("id")?.trim().toUpperCase();
  if (!id) return json({ ok: false, error: "id is required" }, 400);
  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json({ ok: false, error: "TRACKING_KV is not bound on this environment" }, 500);
  const raw = await kv.get(id);
  if (!raw) return json({ ok: false, error: "Not found" }, 404);
  return json({ ok: true, record: JSON.parse(raw), stages: STAGES });
}
async function POST({ request, locals }) {
  if (!checkAuth(request, locals)) return json({ ok: false, error: "Unauthorized" }, 401);
  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json({ ok: false, error: "TRACKING_KV is not bound on this environment" }, 500);
  try {
    const { id, status, note } = await request.json();
    const cleanId = (id || "").trim().toUpperCase();
    if (!cleanId) return json({ ok: false, error: "id is required" }, 400);
    if (!status || !STAGES.includes(status)) {
      return json({ ok: false, error: `status must be one of: ${STAGES.join(", ")}` }, 400);
    }
    const raw = await kv.get(cleanId);
    if (!raw) return json({ ok: false, error: "Not found" }, 404);
    const record = JSON.parse(raw);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    record.status = status;
    record.updatedAt = now;
    record.timeline = record.timeline || [];
    record.timeline.push({ status, at: now, note: (note || "").trim() });
    await kv.put(cleanId, JSON.stringify(record));
    return json({ ok: true, record });
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  STAGES,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
