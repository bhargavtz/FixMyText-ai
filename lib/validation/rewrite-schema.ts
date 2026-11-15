import { z } from "zod";
import { isAllowedModelId } from "@/lib/ai/model-catalog";
import { LANGUAGES, MAX_INPUT_CHARS, MODE_IDS, TONE_IDS } from "@/lib/modes";

export const rewriteRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Please enter some text to improve.")
    .max(MAX_INPUT_CHARS, `Text must be ${MAX_INPUT_CHARS.toLocaleString("en-US")} characters or fewer.`),
  tone: z.enum(TONE_IDS, { message: "Invalid tone." }),
  action: z.enum(MODE_IDS, { message: "Invalid action." }),
  language: z.enum(LANGUAGES, { message: "Invalid language." }).optional(),
  model: z.string().refine(isAllowedModelId, { message: "Invalid model." }).optional(),
});

export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export type { Mode as Action, Tone } from "@/lib/modes";
