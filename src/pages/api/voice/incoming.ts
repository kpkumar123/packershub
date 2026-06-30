// src/pages/api/voice/incoming.ts
//
// Set THIS endpoint as the "A CALL COMES IN" webhook on your Twilio phone
// number (Twilio Console → Phone Numbers → your number → Voice Configuration
// → A call comes in → Webhook → POST → https://packershub.in/api/voice/incoming).
//
// Every inbound call to the PackersHub number hits this first. It plays a
// short bilingual welcome, then a DTMF (keypad) language menu — DTMF is used
// here, not speech, because the caller hasn't told us their language yet and
// keypad selection is 100% reliable across all six languages.
import { env as cfEnv } from 'cloudflare:workers';
import {
  twimlResponse,
  parseTwilioForm,
  verifyTwilioSignature,
  VOICE_LANGUAGES,
  DEFAULT_LANG,
  sayTag,
} from '../../../lib/voiceAgent';

export const prerender = false;

const MAX_MENU_ATTEMPTS = 2; // silent/no-input retries before defaulting to English

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

  const url = new URL(request.url);
  const attempt = parseInt(url.searchParams.get('attempt') || '0', 10);

  // Caller didn't press anything after enough tries — don't loop forever,
  // just proceed in English so the call still gets handled.
  if (attempt >= MAX_MENU_ATTEMPTS) {
    const inner = `
      <Say language="en-IN" voice="Google.en-IN-Standard-A">No problem, continuing in English.</Say>
      ${sayTag(DEFAULT_LANG.greeting, DEFAULT_LANG)}
      <Gather input="speech" language="${DEFAULT_LANG.code}" speechTimeout="auto" timeout="6" action="/api/voice/respond" method="POST"/>
      <Redirect method="POST">/api/voice/respond?empty=1</Redirect>
    `;
    return twimlResponse(inner);
  }

  // Bilingual (English + Telugu) welcome, since most callers will be from
  // Andhra Pradesh / Telangana. Then list all six language options.
  const menuLines = VOICE_LANGUAGES.map((l) => l.nativeMenuLine).join(' ');

  const inner = `
    <Say language="en-IN" voice="Google.en-IN-Standard-A">Welcome to PackersHub, packers and movers.</Say>
    <Say language="te-IN" voice="Google.te-IN-Standard-A">PackersHub కు స్వాగతం.</Say>
    <Gather input="dtmf" numDigits="1" timeout="8" action="/api/voice/language" method="POST">
      <Say language="en-IN" voice="Google.en-IN-Standard-A">Please choose your language. ${menuLines}</Say>
    </Gather>
    <Redirect method="POST">/api/voice/incoming?attempt=${attempt + 1}</Redirect>
  `;

  return twimlResponse(inner);
}
