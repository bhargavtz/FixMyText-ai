export type AIModel = {
  id: string; // internal key used by client + validation
  openRouterId: string; // OpenRouter model id
  label: string;
  provider: string;
  description: string;
};

export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    openRouterId: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "OpenAI",
    description: "Fast and affordable. Good default.",
  },
  {
    id: "gpt-4o",
    openRouterId: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    description: "Strong general-purpose model.",
  },
  {
    id: "claude-3.5-sonnet",
    openRouterId: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Excellent writing quality and nuance.",
  },
  {
    id: "claude-3.5-haiku",
    openRouterId: "anthropic/claude-3.5-haiku",
    label: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Fast and cost-efficient.",
  },
  {
    id: "gemini-2.0-flash",
    openRouterId: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast multimodal-capable model.",
  },
  {
    id: "llama-3.3-70b",
    openRouterId: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    provider: "Meta",
    description: "Open-weight, strong reasoning.",
  },
];

export const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL || AI_MODELS[0].id;

export function getModel(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}