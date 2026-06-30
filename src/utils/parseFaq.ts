/**
 * parseFaq.ts — v10.6.5
 *
 * cities.json stores each city's local FAQ content as a single freeform
 * string in `faq_text` (e.g. "Question one? Answer one. Question two?
 * Answer two. Question three? Answer three."), exactly 3 Q&A pairs per
 * city, validated at data-entry time. This was previously dead data —
 * nothing in the codebase read `city.faq_text`, so all 100 city pages
 * rendered an identical templated FAQPage schema (just the city name
 * swapped in) instead of genuinely unique per-city Q&A.
 *
 * This parser splits that prose into structured {q, a} pairs so it can be
 * rendered as real, visible content (FAQ.astro) and matching FAQPage
 * JSON-LD — satisfying Google's requirement that FAQPage structured data
 * must mirror content actually visible on the page.
 */

export interface FaqPair {
  q: string;
  a: string;
}

export function parseFaqText(text: string | undefined | null): FaqPair[] {
  if (!text || !text.trim()) return [];

  const parts = text.split('?');
  if (parts.length < 2) return [];

  const questionsRaw = parts.slice(0, -1);
  const tail = parts[parts.length - 1].trim();

  const qas: { q: string; a: string | null }[] = [];

  questionsRaw.forEach((rawSeg, i) => {
    const seg = rawSeg.trim();
    if (i === 0) {
      qas.push({ q: seg, a: null });
    } else {
      // seg = "<rest of previous answer>. <Next question>"
      // Split on the last ". " boundary before a capital letter — that's
      // the start of the next question. Everything before it is the
      // continuation of the previous answer.
      const sentenceBoundary = /(?<=[a-z0-9)])\.\s+(?=[A-Z])/g;
      const sentences = seg.split(sentenceBoundary);
      let ans: string;
      let nextQ: string;
      if (sentences.length >= 2) {
        ans = sentences.slice(0, -1).join('. ').trim();
        if (!ans.endsWith('.')) ans += '.';
        nextQ = sentences[sentences.length - 1].trim();
      } else {
        ans = seg;
        nextQ = '';
      }
      qas[qas.length - 1].a = ans;
      qas.push({ q: nextQ, a: null });
    }
  });

  qas[qas.length - 1].a = tail;

  return qas
    .filter((p) => p.q && p.a)
    .map((p) => ({ q: `${p.q}?`, a: p.a as string }));
}
