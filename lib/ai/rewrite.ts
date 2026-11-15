import { rewriteText as providerRewrite } from "@/lib/ai/provider";
import type { RewriteRequest } from "@/lib/validation/rewrite-schema";

export async function rewriteText(input: RewriteRequest) {
  return providerRewrite(input);
}
