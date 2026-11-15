import TextWorkspace from "@/components/text-workspace";
import { fetchOpenRouterModels } from "@/lib/ai/openrouter-models";
import { DEFAULT_MODEL_ID } from "@/lib/ai/model-catalog";

export default async function Home() {
  const models = await fetchOpenRouterModels();

  const requestedDefault = process.env.DEFAULT_MODEL || DEFAULT_MODEL_ID;
  const defaultModel =
    models.find((m) => m.id === requestedDefault)?.id ??
    models.find((m) => m.id === DEFAULT_MODEL_ID)?.id ??
    models.find((m) => m.providerKey === "google")?.id ??
    models[0]?.id ??
    DEFAULT_MODEL_ID;

  return <TextWorkspace models={models} defaultModel={defaultModel} />;
}