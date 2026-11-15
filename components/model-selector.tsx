"use client";

import { AI_MODELS } from "@/lib/ai/models";
import type { AIModel } from "@/lib/ai/models";

type Props = {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export default function ModelSelector({ value, onChange, disabled }: Props) {
  const selected = AI_MODELS.find((m) => m.id === value) ?? AI_MODELS[0];
  return (
    <div>
      <label htmlFor="model-select" className="mb-2 block text-sm font-medium text-slate-700">
        AI model
      </label>
      <select
        id="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
      >
        {AI_MODELS.map((m: AIModel) => (
          <option key={m.id} value={m.id}>
            {m.label} — {m.provider}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">{selected.description}</p>
    </div>
  );
}