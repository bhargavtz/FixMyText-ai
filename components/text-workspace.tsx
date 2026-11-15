"use client";

import { useEffect, useState } from "react";
import type { Action, Tone } from "@/lib/validation/rewrite-schema";
import type { ModelOption } from "@/lib/ai/model-catalog";
import ModelSelector from "@/components/model-selector";

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "simple", label: "Simple" },
  { value: "confident", label: "Confident" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
  { value: "empathetic", label: "Empathetic" },
];

const ACTIONS: { value: Action; label: string }[] = [
  { value: "rewrite", label: "Rewrite" },
  { value: "fix-grammar", label: "Fix grammar" },
  { value: "make-shorter", label: "Make shorter" },
  { value: "expand", label: "Expand" },
  { value: "summarize", label: "Summarize" },
  { value: "bullet-points", label: "Bullet points" },
  { value: "simplify", label: "Simplify" },
];

const EXAMPLES: { label: string; text: string }[] = [
  {
    label: "Invoice email",
    text: "hey, i wanted to ask if you can send me the invoice today because we need it",
  },
  {
    label: "Job application",
    text: "i think im a good fit for this job because i have 5 years experience and i learn fast",
  },
  {
    label: "Project update",
    text: "quick update on the project, we finished the design and now working on the api, should be done friday",
  },
  {
    label: "Customer support",
    text: "sorry for the delay, we are looking into your issue and will get back to you soon",
  },
  {
    label: "Apology",
    text: "i missed our meeting yesterday, i am sorry, can we reschedule",
  },
  {
    label: "LinkedIn post",
    text: "excited to share that i started a new job as a product manager at a startup",
  },
  {
    label: "Follow-up",
    text: "just following up on my last email, let me know if you need anything else",
  },
  {
    label: "Student email",
    text: "hi professor, i was absent yesterday, can you tell me what i missed",
  },
];

const MAX = 5000;

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

type Props = {
  models: ModelOption[];
  defaultModel: string;
};

export default function TextWorkspace({ models, defaultModel }: Props) {
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [action, setAction] = useState<Action>("rewrite");
  const [model, setModel] = useState<string>(() => {
    const fallback =
      models.find((m) => m.id === defaultModel)?.id ?? models[0]?.id ?? defaultModel;
    if (typeof window === "undefined") return fallback;
    try {
      const saved = window.localStorage.getItem("fmx:model");
      return saved && models.some((m) => m.id === saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });
  const [result, setResult] = useState("");
  const [resultModel, setResultModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem("fmx:model", model);
    } catch {
      // ignore
    }
  }, [model]);

  const charCount = text.length;
  const overLimit = charCount > MAX;
  const resultModelName = models.find((m) => m.id === resultModel)?.name;

  async function handleImprove() {
    setError("");
    setCopied(false);
    if (!text.trim()) {
      setError("Please enter some text to improve.");
      return;
    }
    if (overLimit) {
      setError(`Text must be ${MAX} characters or fewer.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, tone, action, model }),
      });
      const data = (await res.json()) as { result?: string; model?: string; error?: string };
      if (!res.ok || !data.result) {
        throw new Error(data.error || "Request failed.");
      }
      setResult(data.result);
      setResultModel(data.model || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  function handleClear() {
    setText("");
    setResult("");
    setResultModel("");
    setError("");
    setCopied(false);
  }

  function handleSwap() {
    if (!result) return;
    setText(result);
    setResult("");
    setResultModel("");
  }

  function handleTryAgain() {
    if (text.trim()) handleImprove();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
              <i className="bi bi-stars text-lg" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">FixMyText AI</p>
              <p className="text-xs text-muted">AI writing assistant</p>
            </div>
          </div>
        </header>

        <section className="mb-10 max-w-3xl">
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Say it better. In seconds.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Improve emails, messages, and posts without losing your meaning.
          </p>
          <div className="mt-6 h-px w-24 bg-border" />
        </section>

        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <i className="bi bi-lightbulb" aria-hidden="true" />
            Start from an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setText(ex.text)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-foreground"
              >
                <i className="bi bi-arrow-up-right" aria-hidden="true" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <label htmlFor="input-text" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <i className="bi bi-pencil-square" aria-hidden="true" />
              Your text
            </label>
            <textarea
              id="input-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              placeholder="Paste or type your text here..."
              className="min-h-[240px] w-full resize-y rounded-2xl border border-border bg-background p-4 text-foreground placeholder-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-describedby="char-count"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span id="char-count" className={overLimit ? "text-danger" : "text-muted"}>
                {charCount} / {MAX} characters · {wordCount(text)} words
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-muted transition hover:text-foreground"
              >
                <i className="bi bi-trash3" aria-hidden="true" />
                Clear all
              </button>
            </div>

            <div className="mt-6">
              <ModelSelector models={models} value={model} onChange={setModel} disabled={loading} />
            </div>

            <div className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <i className="bi bi-palette" aria-hidden="true" />
                Tone
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tone">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={tone === t.value}
                    onClick={() => setTone(t.value)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition " +
                      (tone === t.value
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-foreground hover:border-accent/40")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <i className="bi bi-sliders" aria-hidden="true" />
                Action
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Action">
                {ACTIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    role="radio"
                    aria-checked={action === a.value}
                    onClick={() => setAction(a.value)}
                    className={
                      "rounded-xl border px-3.5 py-1.5 text-sm font-medium transition " +
                      (action === a.value
                        ? "border-foreground bg-foreground text-white"
                        : "border-border bg-surface text-foreground hover:border-accent/40")
                    }
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleImprove}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className={loading ? "bi bi-hourglass-split" : "bi bi-stars"} aria-hidden="true" />
                {loading ? "Improving..." : "Improve text"}
              </button>
              <button
                type="button"
                onClick={handleTryAgain}
                disabled={loading || !text.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                Try again
              </button>
              <button
                type="button"
                onClick={handleSwap}
                disabled={!result}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-arrow-left-right" aria-hidden="true" />
                Use output as input
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          {/* Output panel */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <i className="bi bi-magic" aria-hidden="true" />
                Improved text
                {resultModelName ? (
                  <span className="ml-2 text-xs font-normal text-muted">via {resultModelName}</span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className={copied ? "bi bi-check2" : "bi bi-clipboard"} aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div
              aria-live="polite"
              className="min-h-[240px] flex-1 rounded-2xl border border-border bg-background p-4 text-foreground whitespace-pre-wrap"
            >
              {loading ? (
                <span className="text-muted">Working on it...</span>
              ) : result ? (
                result
              ) : (
                <span className="text-muted">Your improved text will appear here.</span>
              )}
            </div>
            {result && (
              <p className="mt-3 text-xs text-muted">
                {result.length} characters · {wordCount(result)} words
              </p>
            )}
          </div>
        </div>

        <footer className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-muted">
          <span>FixMyText AI</span>
          <span className="inline-flex items-center gap-1.5">
            <i className="bi bi-info-circle" aria-hidden="true" />
            AI can make mistakes. Review before sending.
          </span>
        </footer>
      </div>
    </div>
  );
}