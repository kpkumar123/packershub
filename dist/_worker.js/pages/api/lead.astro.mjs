globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
function generateTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "PH-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
const TRACKING_ID_RE = /^PH-[A-Z2-9]{6}$/;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function POST({ request, locals }) {
  try {
    const body = await request.json();
    const phone = (body.phone || "").toString().trim();
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      return json({ ok: false, error: "A valid phone number is required." }, 400);
    }
    const clientId = (body.trackingId || "").toString().trim().toUpperCase();
    const trackingId = TRACKING_ID_RE.test(clientId) ? clientId : generateTrackingId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      trackingId,
      type: body.type || "general",
      name: (body.name || "").toString().trim(),
      phone,
      email: (body.email || "").toString().trim(),
      message: (body.message || "").toString().trim(),
      fromCity: (body.fromCity || "").toString().trim(),
      toCity: (body.toCity || "").toString().trim(),
      moveDate: (body.moveDate || "").toString().trim(),
      moveType: (body.moveType || "").toString().trim(),
      estimate: typeof body.estimate === "number" ? body.estimate : null,
      source: (body.source || "").toString().trim(),
      status: "Booking Received",
      timeline: [
        { status: "Booking Received", at: now, note: "Lead submitted via website" }
      ],
      createdAt: now,
      updatedAt: now
    };
    const env = locals?.runtime?.env;
    let kvStored = false;
    try {
      const kv = env?.TRACKING_KV;
      if (kv) {
        await kv.put(trackingId, JSON.stringify(record));
        kvStored = true;
      }
    } catch {
    }
    try {
      const resendKey = env?.RESEND_API_KEY ?? undefined                              ;
      const notifyTo = env?.LEAD_NOTIFY_EMAIL ?? undefined                                 ;
      if (resendKey && notifyTo) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "PackersHub Leads <leads@packershub.in>",
            to: [notifyTo],
            subject: `New ${record.type} lead — ${record.name || "Unknown"} (${trackingId})`,
            text: [
              `Tracking ID: ${trackingId}`,
              `Type: ${record.type}`,
              `Name: ${record.name || "-"}`,
              `Phone: ${record.phone}`,
              `Email: ${record.email || "-"}`,
              record.fromCity || record.toCity ? `Route: ${record.fromCity || "-"} -> ${record.toCity || "-"}` : "",
              record.moveDate ? `Move date: ${record.moveDate}` : "",
              record.moveType ? `Move type: ${record.moveType}` : "",
              record.estimate ? `Estimate shown: ₹${record.estimate}` : "",
              record.message ? `Message: ${record.message}` : "",
              `Submitted: ${now}`,
              `Saved to tracking system: ${kvStored ? "yes" : "no (KV not configured)"}`
            ].filter(Boolean).join("\n")
          })
        });
      }
    } catch {
    }
    return json({ ok: true, trackingId: kvStored ? trackingId : null });
  } catch {
    return json({ ok: false }, 200);
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
