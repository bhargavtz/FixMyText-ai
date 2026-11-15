import { NextResponse } from "next/server";
import { rewriteRequestSchema } from "@/lib/validation/rewrite-schema";
import { rewriteText } from "@/lib/ai/rewrite";

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
    const result = await rewriteText(parsed.data);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("rewrite failed", err);
    return NextResponse.json(
      { error: "The text could not be improved. Please try again." },
      { status: 502 }
    );
  }
}