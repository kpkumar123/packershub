// src/pages/api/voice/respond.ts
//
// This is the loop the call lives in after the language is chosen. Twilio
// posts here once per caller utterance (SpeechResult). On every turn:
//   1. load conversation state from KV (or start fresh if missing/expired)
//   2. send the transcript so far to Claude (claude-sonnet-4-6)
//   3. speak the reply in the caller's chosen language
//   4. either open another <Gather> (keep talking), <Dial> the team
//      (TRANSFER), or say goodbye and <Hangup> (END) — saving a lead via
//      the existing /api/lead endpoint whenever enough details were
//      collected, or on transfer/end if anything useful was captured.
import { env as cfEnv } from 'cloudflare:workers';
import {
  twimlResponse,
  sayTag,
  parseTwilioForm,
  verifyTwilioSignature,
  langByCode,
  DEFAULT_LANG,
  getCallState,
  saveCallState,
  deleteCallState,
  callVoiceAgent,
  fireLeadCapture,
  type CallState,
} from '../../../lib/voiceAgent';

export const prerender = false;

const MAX_TURNS = 8; // wrap up and hand off rather than loop forever
const MAX_REPROMPTS = 2; // consecutive silent/empty turns before transferring

const SITE_URL = 'https://packershub.in'; // update if domain changes

function teamPhone(env: any): string {
  return env?.TEAM_PHONE ?? import.meta.env.TEAM_PHONE ?? '+917731074075';
}

function hasMinimumLead(lead: CallState['lead']): boolean {
  return Boolean(lead.name && lead.phone && lead.fromCity && lead.toCity);
}

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
  const speechResult = (params.SpeechResult || '').trim();
  const url = new URL(request.url);
  const isEmptyRedirect = url.searchParams.get('empty') === '1';

  let state = await getCallState(callSid);
  if (!state) {
    // KV miss (expired, or the caller landed here without going through the
    // language menu) — start a sensible default rather than failing the call.
    state = {
      callSid,
      from,
      langCode: DEFAULT_LANG.code,
      turns: [{ role: 'assistant', text: DEFAULT_LANG.greeting }],
      turnCount: 0,
      lead: { phone: from },
      leadSaved: false,
      startedAt: new Date().toISOString(),
    };
  }

  const lang = langByCode(state.langCode);

  // No speech captured (silence / Twilio gave up listening).
  if (!speechResult && !isEmptyRedirect) {
    state.turnCount += 1;
    if (state.turnCount > MAX_REPROMPTS) {
      const inner = `
        ${sayTag(
          lang.code === 'en-IN'
            ? "I'm having trouble hearing you — let me connect you to our team."
            : lang.greeting,
          lang,
        )}
        <Dial>${teamPhone(env)}</Dial>
      `;
      if (state.lead.phone || state.from) fireLeadCapture(state, SITE_URL);
      await deleteCallState(callSid);
      return twimlResponse(inner);
    }
    await saveCallState(state);
    const inner = `
      ${sayTag(
        lang.code === 'en-IN' ? 'Sorry, I did not catch that. Please go ahead.' : lang.greeting,
        lang,
      )}
      <Gather input="speech" language="${lang.code}" speechTimeout="auto" timeout="6" action="/api/voice/respond" method="POST"/>
      <Redirect method="POST">/api/voice/respond?empty=1</Redirect>
    `;
    return twimlResponse(inner);
  }

  if (speechResult) {
    state.turns.push({ role: 'user', text: speechResult });
  }
  state.turnCount += 1;

  const result = await callVoiceAgent(lang, state.turns);
  state.turns.push({ role: 'assistant', text: result.spokenText });

  if (result.leadUpdate) {
    state.lead = { ...state.lead, ...result.leadUpdate, phone: state.lead.phone || state.from };
  }

  // Save a lead the moment we have enough to act on, even mid-conversation —
  // never wait for the call to end to make sure the enquiry isn't lost.
  if (!state.leadSaved && hasMinimumLead(state.lead)) {
    fireLeadCapture(state, SITE_URL);
    state.leadSaved = true;
  }

  // Hard cap on turns — wrap up instead of letting a confused loop run on.
  const forceWrapUp = state.turnCount >= MAX_TURNS && result.control === 'CONTINUE';

  if (result.control === 'TRANSFER') {
    if (!state.leadSaved && (state.lead.name || state.lead.fromCity)) fireLeadCapture(state, SITE_URL);
    await deleteCallState(callSid);
    const inner = `
      ${sayTag(result.spokenText, lang)}
      <Dial>${teamPhone(env)}</Dial>
    `;
    return twimlResponse(inner);
  }

  if (result.control === 'END' || forceWrapUp) {
    if (!state.leadSaved && (state.lead.name || state.lead.fromCity)) fireLeadCapture(state, SITE_URL);
    await deleteCallState(callSid);
    const closing = forceWrapUp
      ? lang.code === 'en-IN'
        ? "Thank you. Our team will call you back shortly with the details."
        : lang.greeting
      : result.spokenText;
    const inner = `${sayTag(closing, lang)}<Hangup/>`;
    return twimlResponse(inner);
  }

  await saveCallState(state);
  const inner = `
    ${sayTag(result.spokenText, lang)}
    <Gather input="speech" language="${lang.code}" speechTimeout="auto" timeout="6" action="/api/voice/respond" method="POST"/>
    <Redirect method="POST">/api/voice/respond?empty=1</Redirect>
  `;
  return twimlResponse(inner);
}
