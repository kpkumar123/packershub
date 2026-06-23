// src/pages/api/track.ts
//
// Public lookup for the /track/ page. Requires BOTH the Tracking ID and the
// last 4 digits of the phone number used at booking — this is a deliberate
// privacy check so a leaked/guessed Tracking ID alone can't reveal a
// customer's move details.
//
// Honesty note: this is a milestone tracker (status updated by the
// PackersHub team at each stage), not live GPS. If you want literal live
// GPS tracking later, that's a separate, bigger feature — this gives
// customers real visibility today without claiming something we don't have.
export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET({ url, locals }: { url: URL; locals: App.Locals }) {
  try {
    const id = url.searchParams.get('id')?.trim().toUpperCase();
    const phone = url.searchParams.get('phone')?.trim();

    if (!id) return json({ ok: false, error: 'Please enter your Tracking ID.' });
    if (!phone) return json({ ok: false, error: 'Please enter the phone number used at booking.' });

    const kv = locals?.runtime?.env?.TRACKING_KV;
    if (!kv) {
      return json({
        ok: false,
        error: 'Online tracking isn\u2019t set up yet on this deployment. Please call +91 77310 74075 with your Tracking ID.',
      });
    }

    const raw = await kv.get(id);
    if (!raw) {
      return json({ ok: false, error: 'No booking found with that Tracking ID. Please check and try again.' });
    }

    const record = JSON.parse(raw);
    const last4Stored = (record.phone || '').replace(/\D/g, '').slice(-4);
    const last4Input = phone.replace(/\D/g, '').slice(-4);

    if (!last4Stored || last4Stored !== last4Input) {
      return json({ ok: false, error: 'That phone number doesn\u2019t match our records for this Tracking ID.' });
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
      createdAt: record.createdAt,
    });
  } catch {
    return json({ ok: false, error: 'Something went wrong. Please call +91 77310 74075.' });
  }
}
