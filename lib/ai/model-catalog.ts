export type ModelOption = {
  id: string;
  name: string;
  provider: string;
  providerKey: string;
  description: string;
  contextLength: number;
  promptPrice: number; // USD per 1M prompt tokens
  completionPrice: number; // USD per 1M completion tokens
};

export const PROVIDERS = [
  { key: "google", label: "Google (Gemini)" },
  { key: "anthropic", label: "Anthropic (Claude)" },
  { key: "openai", label: "OpenAI" },
  { key: "deepseek", label: "DeepSeek" },
  { key: "z-ai", label: "Z.ai (GLM)" },
  { key: "nvidia", label: "NVIDIA" },
] as const;

export type ProviderKey = (typeof PROVIDERS)[number]["key"];

export const PROVIDER_KEYS = PROVIDERS.map((p) => p.key);

const PROVIDER_LABELS: Record<string, string> = Object.fromEntries(
  PROVIDERS.map((p) => [p.key, p.label])
);

export const DEFAULT_MODEL_ID = "google/gemini-3.8-flash";

export function providerLabel(key: string): string {
  return PROVIDER_LABELS[key] ?? key;
}

export function isAllowedModelId(id: string): boolean {
  if (!id || id.includes(":batch")) return false;
  return PROVIDER_KEYS.some((key) => id.startsWith(`${key}/`));
}

// Used only when OpenRouter's model list cannot be fetched.
export const FALLBACK_MODELS: ModelOption[] = [
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google (Gemini)",
    providerKey: "google",
    description: "Fast, capable Gemini model.",
    contextLength: 1048576,
    promptPrice: 0.825,
    completionPrice: 4.125,
  },
  {
    id: "anthropic/claude-sonnet-5.5",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic (Claude)",
    providerKey: "anthropic",
    description: "Strong writing quality and nuance.",
    contextLength: 200000,
    promptPrice: 3,
    completionPrice: 15,
  },
  {
    id: "openai/gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    provider: "OpenAI",
    providerKey: "openai",
    description: "General-purpose OpenAI model.",
    contextLength: 400000,
    promptPrice: 2,
    completionPrice: 8,
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    providerKey: "deepseek",
    description: "Fast and affordable DeepSeek model.",
    contextLength: 128000,
    promptPrice: 0.14,
    completionPrice: 0.28,
  },
  {
    id: "z-ai/glm-5.3-flash",
    name: "GLM 5.3 Flash",
    provider: "Z.ai (GLM)",
    providerKey: "z-ai",
    description: "Efficient GLM model from Z.ai.",
    contextLength: 200000,
    promptPrice: 0.1,
    completionPrice: 0.3,
  },
  {
    id: "nvidia/nemotron-3.5-lightning",
    name: "Nemotron 3.5 Lightning",
    provider: "NVIDIA",
    providerKey: "nvidia",
    description: "Fast NVIDIA Nemotron model.",
    contextLength: 128000,
    promptPrice: 0.1,
    completionPrice: 0.2,
  },
];