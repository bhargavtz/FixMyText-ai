"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import {
  Check,
  CircleAlert,
  ClipboardPaste,
  Copy,
  CornerLeftUp,
  Eraser,
  FileText,
  GitCompareArrows,
  History,
  Languages,
  Lightbulb,
  List,
  Mail,
  Maximize2,
  Megaphone,
  Minimize2,
  Moon,
  Repeat2,
  Reply,
  RotateCcw,
  Sparkles,
  SpellCheck,
  Square,
  Sun,
  type LucideProps,
} from "lucide-react";
import ModelSelector from "@/components/model-selector";
import HistoryPanel, { type HistoryItem } from "@/components/history-panel";
import type { ModelOption } from "@/lib/ai/model-catalog";
import { wordDiff } from "@/lib/diff";
import {
  LANGUAGES,
  MAX_INPUT_CHARS,
  MODE_IDS,
  MODES,
  TONE_IDS,
  TONES,
  modeInfo,
  type Language,
  type Mode,
  type Tone,
} from "@/lib/modes";
import { useStored } from "@/lib/use-stored";

const MODE_ICONS: Record<Mode, ComponentType<LucideProps>> = {
  rewrite: Sparkles,
  "fix-grammar": SpellCheck,
  "make-shorter": Minimize2,
  expand: Maximize2,
  simplify: Lightbulb,
  paraphrase: Repeat2,
  summarize: FileText,
  "bullet-points": List,
  "to-email": Mail,
  reply: Reply,
  "social-post": Megaphone,
  translate: Languages,
};

const EXAMPLES: { label: string; mode: Mode; text: string }[] = [
  {
    label: "Casual request → polished",
    mode: "rewrite",
    text: "hey, i wanted to ask if you can send me the invoice today because we need it",
  },
  {
    label: "Notes → full email",
    mode: "to-email",
    text: "to Priya - thanks for the demo yesterday, team liked it, need pricing for 25 seats, can we talk thursday or friday",
  },
  {
    label: "Typos → clean",
    mode: "fix-grammar",
    text: "i think im a good fit for this role becuase i have 5 years experiance and i learn realy fast",
  },
  {
    label: "Message → reply",
    mode: "reply",
    text: "Hi! Are you free to join the planning call on Tuesday at 3pm? We'd love your input on the roadmap.\n---\nsay yes but I need to leave by 3:30",
  },
  {
    label: "Update → LinkedIn post",
    mode: "social-post",
    text: "started a new job as a product manager at a small climate startup, nervous but excited, grateful to my old team",
  },
];

const HISTORY_LIMIT = 20;

function words(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

function isMode(v: string): v is Mode {
  return (MODE_IDS as readonly string[]).includes(v);
}
function isTone(v: string): v is Tone {
  return (TONE_IDS as readonly string[]).includes(v);
}
function isLanguage(v: string): v is Language {
  return (LANGUAGES as readonly string[]).includes(v);
}

/** Clipboard API first; falls back to execCommand for non-secure origins and restricted webviews. */
async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, value.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    el.remove();
    return ok;
  }
}

function parseHistory(raw: string): HistoryItem[] {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? (data as HistoryItem[]).filter((i) => i && isMode(i.mode)) : [];
  } catch {
    return [];
  }
}

type Props = {
  models: ModelOption[];
  defaultModel: string;
};

export default function TextWorkspace({ models, defaultModel }: Props) {
  // Persisted per-browser state
  const [text, setText] = useStored("fmx:draft", "");
  const [modeRaw, setModeRaw] = useStored("fmx:mode", "rewrite");
  const [toneRaw, setToneRaw] = useStored("fmx:tone", "natural");
  const [languageRaw, setLanguage] = useStored("fmx:language", "Spanish");
  const [storedModel, setModel] = useStored("fmx:model", defaultModel);
  const [historyRaw, setHistoryRaw] = useStored("fmx:history", "[]");
  const [theme, setTheme] = useStored("fmx:theme", "");

  const mode: Mode = isMode(modeRaw) ? modeRaw : "rewrite";
  const tone: Tone = isTone(toneRaw) ? toneRaw : "natural";
  const language: Language = isLanguage(languageRaw) ? languageRaw : "Spanish";
  const model = models.some((m) => m.id === storedModel) ? storedModel : defaultModel;
  const history = useMemo(() => parseHistory(historyRaw), [historyRaw]);
  const info = modeInfo(mode);

  // Session state
  const [result, setResult] = useState("");
  const [source, setSource] = useState("");
  const [resultMode, setResultMode] = useState<Mode>("rewrite");
  const [resultModel, setResultModel] = useState("");
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modeRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep the selected mode chip visible in the horizontal rail (e.g. after picking an example).
  useEffect(() => {
    modeRailRef.current
      ?.querySelector<HTMLElement>('[aria-checked="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [mode]);

  const charCount = text.length;
  const overLimit = charCount > MAX_INPUT_CHARS;
  const resultModelName = models.find((m) => m.id === resultModel)?.name;
  const canDiff = resultMode !== "translate" && !!result && !!source;
  const diff = useMemo(
    () => (showDiff && canDiff ? wordDiff(source, result) : null),
    [showDiff, canDiff, source, result],
  );

  async function run() {
    if (loading) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Type or paste some text first.");
      inputRef.current?.focus();
      return;
    }
    if (overLimit) {
      setError(`Please keep it under ${MAX_INPUT_CHARS.toLocaleString()} characters.`);
      return;
    }

    setError("");
    setCopied(false);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          tone,
          action: mode,
          model,
          ...(mode === "translate" ? { language } : {}),
        }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as {
        result?: string;
        model?: string;
        demo?: boolean;
        error?: string;
      };
      if (!res.ok || !data.result) throw new Error(data.error || "The text could not be improved. Please try again.");

      setResult(data.result);
      setSource(trimmed);
      setResultMode(mode);
      setResultModel(data.model || "");
      setDemo(!!data.demo);

      const item: HistoryItem = {
        id: `${Date.now()}`,
        at: Date.now(),
        mode,
        tone,
        language: mode === "translate" ? language : undefined,
        input: trimmed,
        output: data.result,
      };
      setHistoryRaw(JSON.stringify([item, ...history].slice(0, HISTORY_LIMIT)));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copy() {
    if (!result) return;
    if (await copyText(result)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      setError("Couldn't access the clipboard — select the text and copy it manually.");
    }
  }

  async function paste() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setError("");
      }
    } catch {
      setError("Clipboard access was blocked — paste with Ctrl+V / ⌘V instead.");
      inputRef.current?.focus();
    }
  }

  function clearAll() {
    setText("");
    setResult("");
    setSource("");
    setError("");
    setShowDiff(false);
    inputRef.current?.focus();
  }

  function useAsInput() {
    if (!result) return;
    setText(result);
    setResult("");
    setSource("");
    setShowDiff(false);
    inputRef.current?.focus();
  }

  function restore(item: HistoryItem) {
    setText(item.input);
    setModeRaw(item.mode);
    setToneRaw(item.tone);
    if (item.language) setLanguage(item.language);
    setResult(item.output);
    setSource(item.input);
    setResultMode(item.mode);
    setResultModel("");
    setDemo(false);
    setError("");
    setHistoryOpen(false);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      run();
    }
  }

  const ctaLabel = mode === "rewrite" ? "Fix my text" : info.label;

  return (
    <div onKeyDown={onKeyDown} className="flex h-dvh flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="rise flex h-14 shrink-0 items-center gap-2 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-bg">
            <span className="font-display text-[17px] font-semibold italic leading-none">F</span>
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-bg bg-accent" />
          </span>
          <span className="hidden min-[400px]:block">
            <span className="block font-display text-[17px] font-semibold leading-none tracking-tight">
              FixMyText
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Free · no sign-up
            </span>
          </span>
        </div>

        <p className="ml-6 hidden font-display text-[15px] italic text-muted xl:block">
          Say it better. In seconds.
        </p>

        <div className="ml-auto flex items-center gap-1.5">
          <ModelSelector models={models} value={model} onChange={setModel} disabled={loading} />
          <IconButton label="History" onClick={() => setHistoryOpen(true)} badge={history.length > 0}>
            <History className="size-[18px]" />
          </IconButton>
          <IconButton label="Toggle dark mode" onClick={toggleTheme}>
            <Moon className="size-[18px] dark:hidden" />
            <Sun className="hidden size-[18px] dark:block" />
          </IconButton>
        </div>
      </header>

      {/* ── Mode + tone controls (always above the fold) ───── */}
      <nav aria-label="What to do" className="rise shrink-0 [animation-delay:60ms]">
        <div
          ref={modeRailRef}
          role="radiogroup"
          aria-label="Mode"
          className="rail flex gap-1.5 overflow-x-auto px-3 pb-2 pt-1 sm:px-5"
        >
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m.id];
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={m.hint}
                onClick={() => setModeRaw(m.id)}
                className={
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                  (active
                    ? "border-ink bg-ink text-bg shadow-sm"
                    : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2")
                }
              >
                <Icon aria-hidden className={"size-4 " + (active ? "" : "text-muted")} />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="rail flex items-center gap-1.5 overflow-x-auto px-3 pb-3 sm:px-5">
          {mode === "translate" ? (
            <label className="flex h-8 shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent-soft pl-3 pr-1 text-[13px] font-semibold text-accent">
              <Languages aria-hidden className="size-4" />
              To
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="cursor-pointer bg-transparent pr-1 font-semibold text-ink outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <span className="shrink-0 pr-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Tone
          </span>
          {info.usesTone ? (
            <div role="radiogroup" aria-label="Tone" className="flex gap-1.5">
              {TONES.map((t) => {
                const active = t.id === tone;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setToneRaw(t.id)}
                    className={
                      "h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                      (active
                        ? "border-accent/50 bg-accent-soft font-semibold text-accent"
                        : "border-transparent text-muted hover:bg-surface hover:text-ink")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="shrink-0 text-[13px] text-muted">Kept as you wrote it — {info.hint.toLowerCase()}</span>
          )}
        </div>
      </nav>

      {/* ── Workspace ───────────────────────────────────────── */}
      <main
        className={
          "grid min-h-0 flex-1 gap-2.5 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[grid-template-rows] duration-300 sm:px-5 lg:grid-cols-2 lg:grid-rows-1 lg:gap-4 lg:pb-3 " +
          (result || loading
            ? "grid-rows-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
            : "grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)]")
        }
      >
        {/* Input */}
        <section
          aria-label="Your text"
          className="rise flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)] [animation-delay:120ms] focus-within:border-line-strong"
        >
          <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
            <label htmlFor="input-text" className="text-[13px] font-semibold">
              Your text
            </label>
            <div className="flex items-center gap-0.5">
              <SmallButton onClick={paste} label="Paste">
                <ClipboardPaste className="size-3.5" />
              </SmallButton>
              <SmallButton onClick={clearAll} label="Clear" disabled={!text && !result}>
                <Eraser className="size-3.5" />
              </SmallButton>
            </div>
          </div>

          <textarea
            id="input-text"
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
            placeholder={info.placeholder}
            spellCheck
            suppressHydrationWarning
            aria-describedby="char-count"
            className="thin-scroll min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted/70"
          />

          <div className="flex shrink-0 items-center gap-3 border-t border-line px-3 py-2 sm:px-4">
            <span
              id="char-count"
              className={"text-xs tabular-nums " + (overLimit ? "font-semibold text-danger" : "text-muted")}
            >
              {charCount.toLocaleString()}
              <span className="text-muted/60">/{MAX_INPUT_CHARS.toLocaleString()}</span>
              <span className="hidden sm:inline"> · {words(text)} words</span>
            </span>

            <kbd className="ml-auto hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-muted lg:inline">
              Ctrl / ⌘ + Enter
            </kbd>

            {loading ? (
              <button
                type="button"
                onClick={stop}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-4 text-sm font-semibold text-ink transition hover:bg-line lg:ml-0"
              >
                <Square aria-hidden className="size-3.5 fill-current" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={overLimit}
                className="group ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_-6px_var(--accent)] transition hover:bg-accent-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:ml-0"
              >
                <Sparkles aria-hidden className="size-4 transition group-hover:rotate-12" />
                {ctaLabel}
              </button>
            )}
          </div>
        </section>

        {/* Output */}
        <section
          aria-label="Result"
          className="rise flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)] [animation-delay:180ms]"
        >
          <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
            <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
              Result
              {demo ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Demo
                </span>
              ) : resultModelName ? (
                <span className="truncate text-xs font-normal text-muted">via {resultModelName}</span>
              ) : null}
            </p>
            {result && !loading ? (
              <div className="flex items-center gap-0.5">
                {canDiff && (
                  <SmallButton
                    onClick={() => setShowDiff((v) => !v)}
                    label="Changes"
                    pressed={showDiff}
                  >
                    <GitCompareArrows className="size-3.5" />
                  </SmallButton>
                )}
                <button
                  type="button"
                  onClick={copy}
                  className={
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-accent " +
                    (copied ? "bg-add-bg text-add-ink" : "bg-ink text-bg hover:opacity-90")
                  }
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
          </div>

          <div aria-live="polite" aria-busy={loading} className="relative flex min-h-0 flex-1 flex-col">
            {error ? (
              <div
                role="alert"
                className="m-3 mb-0 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3 px-4 py-4" aria-label="Working on it">
                {[92, 100, 84, 96, 60].map((w, i) => (
                  <div key={i} className="shimmer h-3.5 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : result ? (
              showDiff && canDiff ? (
                <div className="thin-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-[15px] leading-relaxed">
                  {diff ? (
                    diff.map((p, i) =>
                      p.type === "same" ? (
                        <span key={i}>{p.text}</span>
                      ) : p.type === "added" ? (
                        <ins key={i} className="rounded bg-add-bg text-add-ink no-underline">
                          {p.text}
                        </ins>
                      ) : (
                        <del key={i} className="rounded bg-del-bg text-del-ink decoration-del-ink/60">
                          {p.text}
                        </del>
                      ),
                    )
                  ) : (
                    <span className="text-muted">This text is too long to compare word by word.</span>
                  )}
                </div>
              ) : (
                <textarea
                  aria-label="Result (editable)"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  spellCheck
                  className="thin-scroll min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink outline-none"
                />
              )
            ) : (
              <EmptyState
                onPick={(ex) => {
                  setModeRaw(ex.mode);
                  setText(ex.text);
                  setError("");
                }}
              />
            )}
          </div>

          {result && !loading ? (
            <div className="flex shrink-0 items-center gap-1 border-t border-line px-2 py-1.5 sm:px-3">
              <span className="px-1 text-xs tabular-nums text-muted">
                {words(result)} words
                {source && resultMode !== "translate" ? (
                  <span className="hidden sm:inline"> · was {words(source)}</span>
                ) : null}
              </span>
              <div className="ml-auto flex items-center gap-0.5">
                <SmallButton onClick={useAsInput} label="Edit more">
                  <CornerLeftUp className="size-3.5" />
                </SmallButton>
                <SmallButton onClick={run} label="Regenerate">
                  <RotateCcw className="size-3.5" />
                </SmallButton>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="hidden h-8 shrink-0 items-center justify-between px-5 text-[11px] text-muted lg:flex">
        <span>Free for everyone. Nothing you write is saved on our servers.</span>
        <span>AI can make mistakes — review before sending.</span>
      </footer>

      {historyOpen && (
        <HistoryPanel
          items={history}
          onSelect={restore}
          onClear={() => setHistoryRaw("[]")}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (ex: (typeof EXAMPLES)[number]) => void }) {
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="font-display text-lg leading-snug sm:text-xl">
        Your polished text will appear here.
      </p>
      <p className="mt-1 text-[13px] text-muted">
        Pick a mode above, paste your words, and hit the button. Or try one:
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {EXAMPLES.map((ex) => {
          const Icon = MODE_ICONS[ex.mode];
          return (
            <li key={ex.label} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(ex)}
                className="group flex w-full items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-accent/50 hover:bg-accent-soft/50 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted transition group-hover:bg-accent group-hover:text-accent-ink">
                  <Icon aria-hidden className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{ex.label}</span>
                  <span className="block truncate text-xs text-muted">{ex.text.split("\n")[0]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] text-muted lg:hidden">AI can make mistakes — review before sending.</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  badge,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
      {badge ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" /> : null}
    </button>
  );
}

function SmallButton({
  label,
  onClick,
  children,
  disabled,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent " +
        (pressed ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink")
      }
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
