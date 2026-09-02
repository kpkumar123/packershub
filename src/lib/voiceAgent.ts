// src/lib/voiceAgent.ts
//
// Shared engine for the PackersHub AI Phone Agent (24/7 inbound voice calls).
// Used by every file under src/pages/api/voice/. Kept in one place so the
// business facts, supported languages, and conversation rules only need to
// be edited in ONE file.
//
// Astro 7.0.3 / Cloudflare Pages adapter v13 compatible:
// - env bindings come from `cloudflare:workers`, not Astro.locals.runtime.env
// - no npm packages added (Twilio signature check is done with the native
//   Web Crypto API, not the `twilio` SDK)

import { env as cfEnv } from 'cloudflare:workers';

// ---------------------------------------------------------------------------
// 1. Supported languages
// ---------------------------------------------------------------------------
// Caller picks one of these with a keypad digit (DTMF) right at the start of
// the call. DTMF is used for the language menu — and ONLY the language menu —
// because speech recognition cannot reliably guess a language it hasn't been
// told to expect yet. Every turn AFTER that uses <Gather input="speech">
// locked to the chosen language/voice.
//
// Voice IDs below use Google Standard voices (cheapest tier, available for
// all six locales). To upgrade quality later, swap to a Wavenet / Neural2 /
// Chirp3-HD voice id for the same language code — open Twilio Console →
// Develop → Voice → Settings → Text-to-Speech to see the current voice list
// for your account, since Twilio adds/renames voices periodically.
export interface VoiceLang {
  digit: string;
  code: string; // BCP-47 locale used for both TTS (<Say language>) and STT (<Gather language>)
  voice: string; // Twilio <Say voice="...">
  label: string; // English name, for logs/transcripts
  nativeMenuLine: string; // what the caller hears in the language picker
  greeting: string; // first thing the agent says once this language is chosen
}

export const VOICE_LANGUAGES: VoiceLang[] = [
  {
    digit: '1',
    code: 'en-IN',
    voice: 'Google.en-IN-Standard-A',
    label: 'English',
    nativeMenuLine: 'For English, press 1.',
    greeting:
      "Thank you. I'm the PackersHub assistant. I can help with home shifting, office relocation, or a price estimate. How can I help you today?",
  },
  {
    digit: '2',
    code: 'te-IN',
    voice: 'Google.te-IN-Standard-A',
    label: 'Telugu',
    nativeMenuLine: 'తెలుగు కోసం 2 నొక్కండి.',
    greeting:
      'ధన్యవాదాలు. నేను PackersHub అసిస్టెంట్‌ని. ఇంటి షిఫ్టింగ్, ఆఫీస్ రీలొకేషన్ లేదా ధర అంచనా గురించి సహాయం చేయగలను. మీకు ఎలా సహాయం చేయగలను?',
  },
  {
    digit: '3',
    code: 'hi-IN',
    voice: 'Google.hi-IN-Standard-A',
    label: 'Hindi',
    nativeMenuLine: 'हिंदी के लिए 3 दबाएं।',
    greeting:
      'धन्यवाद। मैं PackersHub असिस्टेंट हूं। घर शिफ्टिंग, ऑफिस रीलोकेशन या कीमत अनुमान में मदद कर सकता हूं। मैं आपकी कैसे मदद कर सकता हूं?',
  },
  {
    digit: '4',
    code: 'ta-IN',
    voice: 'Google.ta-IN-Standard-A',
    label: 'Tamil',
    nativeMenuLine: 'தமிழுக்கு 4 ஐ அழுத்தவும்.',
    greeting:
      'நன்றி. நான் PackersHub உதவியாளர். வீடு இடமாற்றம், அலுவலக இடமாற்றம் அல்லது மதிப்பீடு பற்றி உதவ முடியும். நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  },
  {
    digit: '5',
    code: 'kn-IN',
    voice: 'Google.kn-IN-Standard-A',
    label: 'Kannada',
    nativeMenuLine: 'ಕನ್ನಡಕ್ಕಾಗಿ 5 ಒತ್ತಿರಿ.',
    greeting:
      'ಧನ್ಯವಾದಗಳು. ನಾನು PackersHub ಸಹಾಯಕ. ಮನೆ ಶಿಫ್ಟಿಂಗ್, ಆಫೀಸ್ ಸ್ಥಳಾಂತರ ಅಥವಾ ಬೆಲೆ ಅಂದಾಜು ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  },
  {
    digit: '6',
    code: 'ml-IN',
    voice: 'Google.ml-IN-Standard-A',
    label: 'Malayalam',
    nativeMenuLine: 'മലയാളത്തിന് 6 അമർത്തുക.',
    greeting:
      'നന്ദി. ഞാൻ PackersHub അസിസ്റ്റന്റ് ആണ്. വീട് മാറ്റം, ഓഫീസ് മാറ്റം അല്ലെങ്കിൽ വില അനുമാനം എന്നിവയിൽ സഹായിക്കാം. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
  },
];

export const DEFAULT_LANG = VOICE_LANGUAGES[0]; // English fallback

export function langByDigit(digit: string): VoiceLang | undefined {
  return VOICE_LANGUAGES.find((l) => l.digit === digit);
}

export function langByCode(code: string): VoiceLang {
  return VOICE_LANGUAGES.find((l) => l.code === code) ?? DEFAULT_LANG;
}

// ---------------------------------------------------------------------------
// 2. TwiML helpers
// ---------------------------------------------------------------------------
export function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function twimlResponse(inner: string): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export function sayTag(text: string, lang: VoiceLang): string {
  return `<Say language="${lang.code}" voice="${lang.voice}">${xmlEscape(text)}</Say>`;
}

// ---------------------------------------------------------------------------
// 3. Call state (Cloudflare KV) — keeps the conversation across each
//    request/response webhook round-trip, since Pages Functions are
//    stateless between calls. Reuses the TRACKING_KV namespace that already
//    powers /track/ — no new KV namespace needs to be created.
// ---------------------------------------------------------------------------
export interface CallTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface CallState {
  callSid: string;
  from: string;
  langCode: string;
  turns: CallTurn[];
  turnCount: number;
  lead: {
    name?: string;
    phone?: string;
    fromCity?: string;
    toCity?: string;
    moveDate?: string;
    moveType?: string;
  };
  leadSaved: boolean;
  startedAt: string;
}

const CALL_TTL_SECONDS = 60 * 30; // 30 min — well beyond any realistic call length

function callKey(callSid: string): string {
  return `call:${callSid}`;
}

export function getCfEnv() {
  return cfEnv;
}

export async function getCallState(callSid: string): Promise<CallState | null> {
  try {
    const kv = cfEnv?.TRACKING_KV;
    if (!kv) return null;
    const raw = await kv.get(callKey(callSid));
    return raw ? (JSON.parse(raw) as CallState) : null;
  } catch {
    return null;
  }
}

export async function saveCallState(state: CallState): Promise<void> {
  try {
    const kv = cfEnv?.TRACKING_KV;
    if (!kv) return;
    await kv.put(callKey(state.callSid), JSON.stringify(state), {
      expirationTtl: CALL_TTL_SECONDS,
    });
  } catch {
    // Best-effort. Worst case the agent re-asks something it already knew.
  }
}

export async function deleteCallState(callSid: string): Promise<void> {
  try {
    const kv = cfEnv?.TRACKING_KV;
    if (kv) await kv.delete(callKey(callSid));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// 4. Twilio request signature verification
// ---------------------------------------------------------------------------
// Twilio signs every webhook with X-Twilio-Signature:
//   base64( HMAC-SHA1( authToken, fullUrl + sortedParam1Key + sortedParam1Value + ... ) )
// Verification is skipped (not blocked) if TWILIO_AUTH_TOKEN isn't set yet,
// so the agent works during initial setup before secrets are configured —
// same "degrade, don't break" pattern as lead.ts. Add the secret as soon as
// you go live: wrangler secret put TWILIO_AUTH_TOKEN
export async function verifyTwilioSignature(
  fullUrl: string,
  params: Record<string, string>,
  signatureHeader: string | null,
  authToken: string | undefined,
): Promise<boolean> {
  if (!authToken) return true; // not configured yet — allow through
  if (!signatureHeader) return false;

  const sortedKeys = Object.keys(params).sort();
  let data = fullUrl;
  for (const key of sortedKeys) data += key + params[key];

  try {
    const keyData = new TextEncoder().encode(authToken);
    const msgData = new TextEncoder().encode(data);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
    return computed === signatureHeader;
  } catch {
    return false; // fail closed on a crypto error
  }
}

export async function parseTwilioForm(request: Request): Promise<Record<string, string>> {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

// ---------------------------------------------------------------------------
// 5. Claude conversation engine
// ---------------------------------------------------------------------------
// Control tag the model must put on its OWN final line, never spoken aloud:
//   [CONTINUE]                          → keep listening, normal turn
//   [TRANSFER]                          → connect to a human (TEAM_PHONE)
//   [END]                                → say goodbye and hang up
//   [LEAD]{"name":"...","phone":"...", "fromCity":"...","toCity":"...",
//          "moveDate":"...","moveType":"..."}
//                                        → enough details collected to save
//                                          a lead; merges into call state
const CONTROL_TAG_RE = /\n?\[(CONTINUE|TRANSFER|END|LEAD)\]\s*(\{.*\})?\s*$/s;

export interface AgentTurnResult {
  spokenText: string;
  control: 'CONTINUE' | 'TRANSFER' | 'END';
  leadUpdate?: Record<string, string>;
}

function buildSystemPrompt(lang: VoiceLang): string {
  return `You are the 24/7 AI phone receptionist for PackersHub, a packers-and-movers company headquartered in BV Nagar, Nellore, Andhra Pradesh, India. PackersHub serves 100 cities across five South Indian states: Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, and Kerala. Services: home relocation, office relocation, packing, loading/unloading, transport, vehicle (car/bike) transport, and warehousing/storage. Business phone: +91 77310 74075.

You are speaking on a live PHONE CALL, not chat. Hard rules:
- Reply ONLY in ${lang.label} (${lang.code}). Never switch language unless the caller clearly switches first.
- Keep every reply to 1–3 short sentences. No bullet points, no markdown, nothing that isn't natural speech — it will be read aloud by text-to-speech.
- Be warm, direct, and efficient. Do not repeat the caller's question back at length.
- NEVER claim live/real-time GPS truck tracking — PackersHub does not offer that. If asked about tracking, say their move gets a Tracking ID they can check on the website's tracking page after booking.
- NEVER invent a specific price. Give a ballpark range at most if pushed, and offer to arrange a free survey or a callback with an exact quote.
- Your goal in conversation, in order: (1) understand if it's home, office, or vehicle relocation, (2) get the move route — from city and to city, (3) get a rough move date, (4) get the caller's name and a callback phone number (the caller's own number is already on file, so only ask for a different number if they want to be reached elsewhere), (5) once you have name + phone + fromCity + toCity, that's enough to log it as a lead.
- If the caller asks to speak to a human, sounds angry, mentions a complaint about an existing booking, or the conversation is going in circles after a few turns, transfer the call.
- If the caller says goodbye, thanks you and ends, or has nothing further, end the call politely.

After EVERY reply, on its own new final line, output exactly one control tag (this line is never read aloud, the system strips it):
[CONTINUE]                        — normal, keep the conversation going
[TRANSFER]                        — connect now to a human team member
[END]                             — say a brief goodbye and hang up
[LEAD]{"name":"","phone":"","fromCity":"","toCity":"","moveDate":"","moveType":""}
                                   — use this once you have at least name, phone, fromCity, and toCity; fill in only the fields you actually know, leave others as empty strings

Output nothing except the spoken reply followed by exactly one control tag line.`;
}

export async function callVoiceAgent(
  lang: VoiceLang,
  history: CallTurn[],
): Promise<AgentTurnResult> {
  const apiKey = cfEnv?.ANTHROPIC_API_KEY ?? import.meta.env.ANTHROPIC_API_KEY;

  // No key configured yet → safe fallback so the call never dies silently.
  if (!apiKey) {
    return {
      spokenText:
        lang.code === 'en-IN'
          ? 'Sorry, our AI assistant is being set up right now. Let me connect you to our team.'
          : lang.greeting,
      control: 'TRANSFER',
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 250,
        temperature: 0.4,
        system: buildSystemPrompt(lang),
        messages: history.map((t) => ({
          role: t.role,
          content: t.text,
        })),
      }),
    });

    if (!response.ok) {
      return { spokenText: '', control: 'TRANSFER' };
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text || '')
      .join('\n')
      .trim();

    const match = raw.match(CONTROL_TAG_RE);
    let spokenText = raw;
    let control: AgentTurnResult['control'] = 'CONTINUE';
    let leadUpdate: Record<string, string> | undefined;

    if (match) {
      spokenText = raw.slice(0, match.index).trim();
      const tag = match[1];
      if (tag === 'TRANSFER' || tag === 'END') control = tag;
      if (tag === 'LEAD' && match[2]) {
        try {
          leadUpdate = JSON.parse(match[2]);
        } catch {
          // ignore malformed JSON from the model, treat as CONTINUE
        }
      }
    }

    if (!spokenText) {
      spokenText =
        lang.code === 'en-IN'
          ? "Sorry, could you say that again?"
          : lang.greeting;
    }

    return { spokenText, control, leadUpdate };
  } catch {
    return { spokenText: '', control: 'TRANSFER' };
  }
}

// ---------------------------------------------------------------------------
// 6. Lead hand-off — reuses the existing /api/lead endpoint so phone leads
//    flow into the same KV tracking + email + follow-up sequence as web leads.
// ---------------------------------------------------------------------------
export function fireLeadCapture(state: CallState, baseUrl: string): void {
  fetch(`${baseUrl}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'phone-call',
      name: state.lead.name || '',
      phone: state.lead.phone || state.from || '',
      fromCity: state.lead.fromCity || '',
      toCity: state.lead.toCity || '',
      moveDate: state.lead.moveDate || '',
      moveType: state.lead.moveType || '',
      message: `AI Phone Agent call (${langByCode(state.langCode).label}). Transcript:\n${state.turns
        .map((t) => `${t.role === 'user' ? 'Caller' : 'Agent'}: ${t.text}`)
        .join('\n')}`,
      source: 'ai-phone-agent',
    }),
  }).catch(() => {
    /* best-effort, never block call flow */
  });
}
