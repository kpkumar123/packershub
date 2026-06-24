globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function GET({ url, locals }) {
  try {
    const id = url.searchParams.get("id")?.trim().toUpperCase();
    const phone = url.searchParams.get("phone")?.trim();
    if (!id) return json({ ok: false, error: "Please enter your Tracking ID." });
    if (!phone) return json({ ok: false, error: "Please enter the phone number used at booking." });
    const kv = locals?.runtime?.env?.TRACKING_KV;
    if (!kv) {
      return json({
        ok: false,
        error: "Online tracking isn’t set up yet on this deployment. Please call +91 77310 74075 with your Tracking ID."
      });
    }
    const raw = await kv.get(id);
    if (!raw) {
      return json({ ok: false, error: "No booking found with that Tracking ID. Please check and try again." });
    }
    const record = JSON.parse(raw);
    const last4Stored = (record.phone || "").replace(/\D/g, "").slice(-4);
    const last4Input = phone.replace(/\D/g, "").slice(-4);
    if (!last4Stored || last4Stored !== last4Input) {
      return json({ ok: false, error: "That phone number doesn’t match our records for this Tracking ID." });
    }
    return json({
      ok: true,
      trackingId: record.trackingId,
      status: record.status,
      timeline: record.timeline,
      fromCity: record.fromCity,
      toCity: record.toCity,
      moveDate: record.moveDate,
      moveType: record.moveType,
      createdAt: record.createdAt
    });
  } catch {
    return json({ ok: false, error: "Something went wrong. Please call +91 77310 74075." });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
