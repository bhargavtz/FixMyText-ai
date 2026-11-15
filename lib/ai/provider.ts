import type { Action, Tone } from "@/lib/validation/rewrite-schema";

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
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "anthropic") return !process.env.ANTHROPIC_API_KEY;
  if (provider === "openai") return !process.env.OPENAI_API_KEY;
  // openai-compatible
  return !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY;
}

export async function rewriteText(input: {
  text: string;
  tone: Tone;
  action: Action;
}): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const model = process.env.AI_MODEL || (provider === "anthropic" ? "claude-3-5-haiku-latest" : "gpt-4o-mini");
  const system = buildSystemPrompt(input.tone, input.action);

  if (isDemoMode()) {
    // Demo mode: no credentials. Return a clearly-labeled placeholder so the
    // UI remains testable without a live AI call.
    return `[Demo mode — configure an API key for real rewrites]\n${input.text.trim()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY!;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          system,
          messages: [{ role: "user", content: input.text }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Anthropic request failed: ${res.status}`);
      }
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = data.content?.find((c) => c.type === "text")?.text?.trim();
      if (!text) throw new Error("Empty response from provider.");
      return text;
    }

    // OpenAI / OpenAI-compatible
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input.text },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`OpenAI-compatible request failed: ${res.status}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from provider.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}