import type { Language, Mode, Tone } from "@/lib/modes";
import { buildPrompt, cleanOutput } from "@/lib/ai/prompts";
import { DEFAULT_MODEL_ID, isAllowedModelId } from "@/lib/ai/model-catalog";

const MAX_TOKENS = 2048;
const TIMEOUT_MS = 45_000;

export function isDemoMode(): boolean {
  return !process.env.OPENROUTER_API_KEY;
}

export async function rewriteText(input: {
  text: string;
  tone: Tone;
  action: Mode;
  language?: Language;
  model?: string;
}): Promise<{ result: string; modelId: string; demo: boolean }> {
  const modelId =
    input.model && isAllowedModelId(input.model) ? input.model : DEFAULT_MODEL_ID;
  const { system, user, temperature } = buildPrompt(input);

  if (isDemoMode()) {
    return {
      result: input.text.trim(),
      modelId,
      demo: true,
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
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
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
    return { result: cleanOutput(text, input.text), modelId, demo: false };
  } finally {
    clearTimeout(timeout);
  }
}