import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/models";

export const tones = ["professional", "friendly", "simple", "confident"] as const;
export const actions = ["rewrite", "fix-grammar", "make-shorter"] as const;
export const modelIds = AI_MODELS.map((m) => m.id) as [string, ...string[]];

export const rewriteRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Please enter some text to improve.")
    .max(5000, "Text must be 5,000 characters or fewer."),
  tone: z.enum(tones, { message: "Invalid tone." }),
  action: z.enum(actions, { message: "Invalid action." }),
  model: z.enum(modelIds as [string, ...string[]], { message: "Invalid model." }).optional(),
});

export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export type Tone = (typeof tones)[number];
export type Action = (typeof actions)[number];