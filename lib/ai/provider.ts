import type { Action, Tone } from "@/lib/validation/rewrite-schema";
import { getModel, isOpenRouterConfigured, DEFAULT_MODEL_ID } from "@/lib/ai/models";

const MAX_TOKENS = 1024;
const TIMEOUT_MS = 30_000;

function buildSystemPrompt(tone: Tone, action: Action): string {
  const actionGuidance: Record<Action, string> = {
    rewrite: "Make the text clearer and more natural while retaining its meaning.",
    "fix-grammar": "Correct grammar, spelling, and punctuation with minimal changes.",
    "make-shorter": "Make the text concise while preserving essential information.",
  };
  const toneGuidance: Record<Tone, string> = {
    professional: "Polished, respectful, workplace-appropriate.",
    friendly: "Warm, conversational, natural.",
    simple: "Plain language and easy to understand.",
    confident: "Direct, clear, and assertive without being rude.",
  };

  return [
    "You are a careful writing assistant. Improve the user's text according to the requested action and tone.",
    "Preserve the original meaning, facts, names, dates, and intent. Do not add claims or information.",
    "Return only the improved text, without explanations, quotation marks, or markdown unless the input clearly requires formatting.",
    `Action: ${actionGuidance[action]}`,
    `Tone: ${toneGuidance[tone]}`,
  ].join(" ");
}

export function isDemoMode(): boolean {
  return !isOpenRouterConfigured();
}

export async function rewriteText(input: {
  text: string;
  tone: Tone;
  action: Action;
  model?: string;
}): Promise<{ result: string; modelId: string }> {
  const requestedId = input.model || DEFAULT_MODEL_ID;
  const model = getModel(requestedId) || getModel(DEFAULT_MODEL_ID) || getModel("gpt-4o-mini")!;
  const system = buildSystemPrompt(input.tone, input.action);

  if (isDemoMode()) {
    return {
      result: `[Demo mode — configure OPENROUTER_API_KEY for real rewrites]\n${input.text.trim()}`,
      modelId: model.id,
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
        model: model.openRouterId,
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
      if (status === 402) throw new Error("OpenRouter credits exhausted.");
      if (status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (status === 404) throw new Error("Selected model is unavailable.");
      throw new Error(`OpenRouter request failed: ${status}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from provider.");
    return { result: text, modelId: model.id };
  } finally {
    clearTimeout(timeout);
  }
}