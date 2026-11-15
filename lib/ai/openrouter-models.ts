import {
  FALLBACK_MODELS,
  PROVIDER_KEYS,
  isAllowedModelId,
  providerLabel,
  type ModelOption,
} from "@/lib/ai/model-catalog";

type RawModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

function isTextToText(model: RawModel): boolean {
  const input = model.architecture?.input_modalities ?? [];
  const output = model.architecture?.output_modalities ?? [];
  const name = (model.name ?? "").toLowerCase();
  if (!input.includes("text") || !output.includes("text")) return false;
  if (name.includes("image") || name.includes("audio") || name.includes("video")) return false;
  if (model.id.includes(":free") || model.id.includes(":batch")) return false;
  return true;
}

function pricePerMillion(value?: string): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Number((n * 1_000_000).toFixed(4)) : 0;
}

export async function fetchOpenRouterModels(): Promise<ModelOption[]> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`OpenRouter models request failed: ${res.status}`);

    const json = (await res.json()) as { data?: RawModel[] };
    const models = (json.data ?? [])
      .filter((m) => isAllowedModelId(m.id) && isTextToText(m))
      .map((m) => {
        const providerKey = m.id.split("/")[0];
        return {
          id: m.id,
          name: (m.name ?? m.id).replace(/^[^:]+:\s*/, ""),
          provider: providerLabel(providerKey),
          providerKey,
          description: m.description?.trim() || "Text rewriting model.",
          contextLength: m.context_length ?? 0,
          promptPrice: pricePerMillion(m.pricing?.prompt),
          completionPrice: pricePerMillion(m.pricing?.completion),
        } satisfies ModelOption;
      });

    if (models.length === 0) return FALLBACK_MODELS;

    const order = new Map<string, number>(PROVIDER_KEYS.map((key, i) => [key, i]));
    return models.sort((a, b) => {
      const pa = order.get(a.providerKey) ?? 99;
      const pb = order.get(b.providerKey) ?? 99;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error("Could not fetch OpenRouter models, using fallback list", err);
    return FALLBACK_MODELS;
  }
}