// src/pages/api/voice/status.ts
//
// Set this as the "Call Status Changes" webhook on your Twilio number
// (same place as the "A call comes in" webhook) so it fires on every
// completed / no-answer / busy / failed call. It is the safety net: if the
// AI agent never reached enough detail to save a lead (caller hung up early,
// STT struggled, etc.) this still logs SOMETHING — the caller's number and
// call outcome — so no enquiry is silently lost.
import { env as cfEnv } from 'cloudflare:workers';
import {
  parseTwilioForm,
  verifyTwilioSignature,
  getCallState,
  deleteCallState,
  langByCode,
} from '../../../lib/voiceAgent';

export const prerender = false;

const SITE_URL = 'https://packershub.in'; // update if domain changes

export async function POST({ request }: { request: Request }) {
  const env = cfEnv;
  const params = await parseTwilioForm(request);

  const signature = request.headers.get('X-Twilio-Signature');
  const valid = await verifyTwilioSignature(
    request.url,
    params,
    signature,
    env?.TWILIO_AUTH_TOKEN ?? import.meta.env.TWILIO_AUTH_TOKEN,
  );
  if (!valid) return new Response('forbidden', { status: 403 });

  const callSid = params.CallSid || '';
  const from = params.From || '';
  const callStatus = params.CallStatus || ''; // completed, no-answer, busy, failed, canceled
  const callDuration = params.CallDuration || '0';

  const state = await getCallState(callSid);

  // A lead was already saved mid-call by respond.ts — nothing more to do,
  // just tidy up the KV entry.
  if (state?.leadSaved) {
    await deleteCallState(callSid);
    return new Response('ok', { status: 200 });
  }

  // Missed call, hang-up before the language menu, or AI never got enough
  // detail — log it anyway so the team can call back. Fire-and-forget,
  // same pattern as every other backup write in this codebase.
  const lang = state ? langByCode(state.langCode) : undefined;
  const transcript = state?.turns?.length
    ? state.turns.map((t) => `${t.role === 'user' ? 'Caller' : 'Agent'}: ${t.text}`).join('\n')
    : '(no conversation captured)';

  fetch(`${SITE_URL}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'phone-call',
      phone: state?.lead?.phone || from,
      name: state?.lead?.name || '',
      fromCity: state?.lead?.fromCity || '',
      toCity: state?.lead?.toCity || '',
      message: `Inbound call ${callStatus} (${callDuration}s)${lang ? `, language: ${lang.label}` : ''}. ${transcript}`,
      source: 'ai-phone-agent-missed',
    }),
  }).catch(() => {
    /* best-effort */
  });

  await deleteCallState(callSid);
  return new Response('ok', { status: 200 });
}
