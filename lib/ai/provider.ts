import type { Action, Tone } from "@/lib/validation/rewrite-schema";
import { DEFAULT_MODEL_ID, isAllowedModelId } from "@/lib/ai/model-catalog";

const MAX_TOKENS = 2048;
const TIMEOUT_MS = 45_000;

const ACTION_GUIDANCE: Record<Action, string> = {
  rewrite:
    "Rewrite the text so it is clearer and more natural while keeping every fact, name, date, number, and promise intact.",
  "fix-grammar":
    "Correct grammar, spelling, punctuation, and capitalization only. Keep the wording as close to the original as possible.",
  "make-shorter":
    "Shorten the text aggressively while preserving all essential information, names, dates, numbers, and the original intent.",
  expand:
    "Expand the text with useful detail and context. Do not invent facts, names, dates, numbers, or promises; only elaborate on what is already implied.",
  summarize:
    "Summarize the text into a brief version that captures the key points and intent. Do not add new information.",
  "bullet-points":
    "Convert the text into a clean bulleted list. Preserve the original meaning and order. Use plain hyphen bullets.",
  simplify:
    "Simplify the language so a general reader can understand it easily. Keep the original meaning and do not add new claims.",
};

const TONE_GUIDANCE: Record<Tone, string> = {
  professional: "Polished, respectful, and appropriate for the workplace.",
  friendly: "Warm, conversational, and natural without being overly casual.",
  simple: "Plain language, short sentences, and easy to understand.",
  confident: "Direct, clear, and assertive without sounding rude or arrogant.",
  formal: "Formal, precise, and respectful. Avoid slang and contractions.",
  casual: "Relaxed and conversational, like a message to a colleague you know well.",
  persuasive: "Compelling and convincing while staying honest and factual.",
  empathetic: "Considerate and understanding, especially for sensitive messages.",
};

function buildSystemPrompt(tone: Tone, action: Action): string {
  return [
    "You are a careful, expert writing assistant.",
    "Follow the requested action and tone exactly.",
    "Hard rules:",
    "1. Preserve the original meaning, intent, facts, names, dates, numbers, and promises.",
    "2. Never invent information, statistics, quotes, links, or commitments.",
    "3. Return only the improved text. No preamble, no explanation, no quotation marks, no markdown fences.",
    "4. Keep the original language.",
    "5. If the input already uses formatting, preserve it unless the action asks you to change it.",
    "6. Do not mention that you are an AI or that you rewrote the text.",
    `Action: ${ACTION_GUIDANCE[action]}`,
    `Tone: ${TONE_GUIDANCE[tone]}`,
  ].join(" ");
}

export function isDemoMode(): boolean {
  return !process.env.OPENROUTER_API_KEY;
}

export async function rewriteText(input: {
  text: string;
  tone: Tone;
  action: Action;
  model?: string;
}): Promise<{ result: string; modelId: string }> {
  const modelId =
    input.model && isAllowedModelId(input.model) ? input.model : DEFAULT_MODEL_ID;
  const system = buildSystemPrompt(input.tone, input.action);

  if (isDemoMode()) {
    return {
      result: `[Demo mode — add OPENROUTER_API_KEY for real rewrites]\n${input.text.trim()}`,
      modelId,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": appUrl,
        "X-Title": "FixMyText AI",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input.text },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new Error("Invalid OpenRouter API key.");
      if (status === 402) throw new Error("OpenRouter credits are exhausted.");
      if (status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (status === 404) throw new Error("That model is unavailable on OpenRouter.");
      throw new Error(`OpenRouter request failed (${status}).`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("The model returned an empty response.");
    return { result: text, modelId };
  } finally {
    clearTimeout(timeout);
  }
}