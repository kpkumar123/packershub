// src/pages/api/voice/language.ts
//
// Receives the keypad digit from the language menu in incoming.ts. Creates
// the call's conversation state in KV, speaks the greeting in the chosen
// language, then opens the first <Gather input="speech"> turn — handled
// from here on by respond.ts.
import { env as cfEnv } from 'cloudflare:workers';
import {
  twimlResponse,
  sayTag,
  parseTwilioForm,
  verifyTwilioSignature,
  langByDigit,
  DEFAULT_LANG,
  saveCallState,
  type CallState,
} from '../../../lib/voiceAgent';

export const prerender = false;

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
  if (!valid) {
    return twimlResponse('<Say>This request could not be verified.</Say><Hangup/>');
  }

  const callSid = params.CallSid || '';
  const from = params.From || '';
  const digit = params.Digits || '';

  const lang = langByDigit(digit) || DEFAULT_LANG;

  const state: CallState = {
    callSid,
    from,
    langCode: lang.code,
    turns: [{ role: 'assistant', text: lang.greeting }],
    turnCount: 0,
    lead: { phone: from },
    leadSaved: false,
    startedAt: new Date().toISOString(),
  };
  await saveCallState(state);

  const inner = `
    ${sayTag(lang.greeting, lang)}
    <Gather input="speech" language="${lang.code}" speechTimeout="auto" timeout="6" action="/api/voice/respond" method="POST"/>
    <Redirect method="POST">/api/voice/respond?empty=1</Redirect>
  `;

  return twimlResponse(inner);
}
