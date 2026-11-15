"use client";

import { Cpu } from "lucide-react";
import { PROVIDERS, type ModelOption } from "@/lib/ai/model-catalog";

type Props = {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export default function ModelSelector({ models, value, onChange, disabled }: Props) {
  const selected = models.find((m) => m.id === value);
  const grouped = PROVIDERS.map((p) => ({
    ...p,
    models: models.filter((m) => m.providerKey === p.key),
  })).filter((group) => group.models.length > 0);

  return (
    <label
      className="flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-1 text-sm text-ink transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 hover:border-line-strong"
      title={selected ? `${selected.name} — ${selected.description}` : "AI model"}
    >
      <Cpu aria-hidden className="size-4 shrink-0 text-muted" />
      <span className="sr-only">AI model</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-[7.5rem] min-w-0 cursor-pointer truncate bg-transparent py-1 pr-1 text-[13px] font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-48"
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
    </label>
  );
}
