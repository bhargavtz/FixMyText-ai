"use client";

import {
  PROVIDERS,
  type ModelOption,
} from "@/lib/ai/model-catalog";

type Props = {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

function formatContext(tokens: number): string {
  if (!tokens) return "";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M context`;
  return `${Math.round(tokens / 1000)}k context`;
}

export default function ModelSelector({ models, value, onChange, disabled }: Props) {
  const selected = models.find((m) => m.id === value);
  const grouped = PROVIDERS.map((p) => ({
    ...p,
    models: models.filter((m) => m.providerKey === p.key),
  })).filter((group) => group.models.length > 0);

  return (
    <div>
      <label htmlFor="model-select" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <i className="bi bi-cpu" aria-hidden="true" />
        AI model
      </label>
      <select
        id="model-select"
        suppressHydrationWarning
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
      >
        {grouped.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {selected ? (
        <p className="mt-1 text-xs text-muted">
          {selected.description}
          {formatContext(selected.contextLength) ? ` · ${formatContext(selected.contextLength)}` : ""}
          {selected.promptPrice > 0
            ? ` · $${selected.promptPrice.toFixed(2)}/M in, $${selected.completionPrice.toFixed(2)}/M out`
            : ""}
        </p>
      ) : null}
    </div>
  );
}