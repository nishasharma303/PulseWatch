import { NarratorInput, buildFallbackNarration } from "./fallback";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"; // verify current flash-tier model name before demo
const GEMINI_TIMEOUT_MS = 4000;

function buildPrompt(input: NarratorInput): string {
  // CRITICAL: only pre-computed structured JSON goes in. Gemini is never
  // asked to calculate anything, and never sees raw price series.
  return [
    "You are a financial data narrator. You will be given a JSON object of ALREADY-COMPUTED signals for one stock.",
    "Do not calculate, estimate, or invent any numbers. Only phrase the given numbers as one or two natural, plain-English sentences.",
    "Do not give buy/sell advice or predictions. Be factual and neutral.",
    "",
    `JSON:\n${JSON.stringify(input, null, 2)}`,
  ].join("\n");
}

export async function narrate(input: NarratorInput): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: buildFallbackNarration(input), source: "fallback" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(input) }] }],
        }),
      }
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("empty gemini response");
    return { text, source: "gemini" };
  } catch {
    // implemented for real, not a TODO — app must never break because of the AI call
    return { text: buildFallbackNarration(input), source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

export async function narrateDigest(events: string[]): Promise<{ text: string; source: "gemini" | "fallback" }> {
  if (events.length === 0) {
    return { text: "Nothing needs your attention right now.", source: "fallback" };
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const fallbackText = `While you were away: ${events.join("; ")}.`;
  if (!apiKey) return { text: fallbackText, source: "fallback" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const prompt = [
      "You are a financial data narrator. Turn this bulleted list of already-computed events into a short, natural 2-3 sentence briefing.",
      "Do not add any facts, numbers, or predictions not present in the list.",
      "",
      events.map((e) => `- ${e}`).join("\n"),
    ].join("\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("empty gemini response");
    return { text, source: "gemini" };
  } catch {
    return { text: fallbackText, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}
