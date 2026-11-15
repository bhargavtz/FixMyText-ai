import { rewriteText as providerRewrite } from "@/lib/ai/provider";
import type { Action, Tone } from "@/lib/validation/rewrite-schema";

export async function rewriteText(input: {
  text: string;
  tone: Tone;
  action: Action;
  model?: string;
}): Promise<{ result: string; modelId: string }> {
  return providerRewrite(input);
}