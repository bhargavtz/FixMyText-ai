"use client";

import { useEffect } from "react";
import { History, Trash2, X } from "lucide-react";
import { modeInfo, type Language, type Mode, type Tone } from "@/lib/modes";

export type HistoryItem = {
  id: string;
  at: number;
  mode: Mode;
  tone: Tone;
  language?: Language;
  input: string;
  output: string;
};

type Props = {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onClose: () => void;
};

function timeAgo(at: number): string {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryPanel({ items, onSelect, onClear, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="History">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
      />
      <aside className="slide-in relative flex h-full w-full max-w-sm flex-col border-l border-line bg-surface shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <History aria-hidden className="size-4 text-muted" /> Recent
          </p>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
              >
                <Trash2 aria-hidden className="size-3.5" /> Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              autoFocus
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <History aria-hidden className="size-6 text-line-strong" />
            <p className="text-sm text-muted">Your last 20 results will show up here. They stay in this browser only.</p>
          </div>
        ) : (
          <ul className="thin-scroll flex-1 divide-y divide-line overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="w-full px-4 py-3 text-left transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                >
                  <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <span>
                      {modeInfo(item.mode).label}
                      {item.mode === "translate" && item.language ? ` · ${item.language}` : ""}
                    </span>
                    <span className="font-medium normal-case tracking-normal">{timeAgo(item.at)}</span>
                  </span>
                  <span className="line-clamp-2 text-sm text-ink">{item.output}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="shrink-0 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[11px] text-muted">
          Stored only in your browser — never on our servers.
        </p>
      </aside>
    </div>
  );
}
