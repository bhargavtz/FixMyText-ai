import { NextResponse } from "next/server";
import { rewriteRequestSchema } from "@/lib/validation/rewrite-schema";
import { rewriteText } from "@/lib/ai/rewrite";
import { getModel } from "@/lib/ai/models";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = rewriteRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || "Invalid request.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  try {
    const { result, modelId } = await rewriteText(parsed.data);
    const model = getModel(modelId);
    return NextResponse.json({ result, model: model?.label ?? modelId });
  } catch (err) {
    console.error("rewrite failed", err);
    const message = err instanceof Error ? err.message : "The text could not be improved. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}