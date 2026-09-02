import { env } from 'cloudflare:workers';

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const { messages, system } = await request.json();

    // Cloudflare adapter v13: env bindings come from cloudflare:workers,
    // not Astro.locals.runtime.env (removed). Falls back to import.meta.env
    // for local `astro dev` without a platformProxy binding configured.
    const apiKey =
      env?.ANTHROPIC_API_KEY ??
      (import.meta.env.ANTHROPIC_API_KEY as string | undefined);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ reply: "AI assistant not configured. Please call +91 77310 74075 or WhatsApp for support!" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: system || 'You are a helpful customer support assistant for PackersHub, a packers and movers company in South India. Keep responses concise and helpful.',
        messages: (messages as unknown[]).slice(-6),
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json() as { content?: { text?: string }[] };
    const reply = data.content?.[0]?.text || "I'm here to help! Call +91 77310 74075 for immediate assistance.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ reply: "I'm having a moment. Please call +91 77310 74075 or WhatsApp us — we're available 24/7!" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
