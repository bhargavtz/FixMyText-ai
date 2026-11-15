"use client";

import { useEffect, useState } from "react";
import type { Action, Tone } from "@/lib/validation/rewrite-schema";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import ModelSelector from "@/components/model-selector";

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "simple", label: "Simple" },
  { value: "confident", label: "Confident" },
];

const ACTIONS: { value: Action; label: string }[] = [
  { value: "rewrite", label: "Rewrite" },
  { value: "fix-grammar", label: "Fix grammar" },
  { value: "make-shorter", label: "Make shorter" },
];

const EXAMPLES = [
  "hey, i wanted to ask if you can send me the invoice today because we need it",
  "Just checking in to see if you had a chance to review my application. Thanks!",
  "Can we move the meeting to tomorrow? I have a conflict this afternoon.",
];

const MAX = 5000;

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export default function TextWorkspace() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [action, setAction] = useState<Action>("rewrite");
  const [model, setModel] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    try {
      return window.localStorage.getItem("fmx:model") || DEFAULT_MODEL_ID;
    } catch {
      return DEFAULT_MODEL_ID;
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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white font-semibold shadow-sm">
              F
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

        <div className="mb-6 flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(ex)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-foreground"
            >
              Try example {i + 1}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <label htmlFor="input-text" className="mb-2 text-sm font-medium text-foreground">
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
                className="text-muted transition hover:text-foreground"
              >
                Clear all
              </button>
            </div>

            <div className="mt-6">
              <ModelSelector value={model} onChange={setModel} disabled={loading} />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-foreground">Tone</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tone">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={tone === t.value}
                    onClick={() => setTone(t.value)}
                    className={
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition " +
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
              <p className="mb-2 text-sm font-medium text-foreground">Action</p>
              <div className="inline-flex rounded-2xl border border-border bg-background p-1" role="radiogroup" aria-label="Action">
                {ACTIONS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    role="radio"
                    aria-checked={action === a.value}
                    onClick={() => setAction(a.value)}
                    className={
                      "rounded-xl px-4 py-1.5 text-sm font-medium transition " +
                      (action === a.value
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted hover:text-foreground")
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
                className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Improving..." : "Improve text"}
              </button>
              <button
                type="button"
                onClick={handleTryAgain}
                disabled={loading || !text.trim()}
                className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleSwap}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
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
              <p className="text-sm font-medium text-foreground">
                Improved text
                {resultModel ? <span className="ml-2 text-xs font-normal text-muted">via {resultModel}</span> : null}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
              >
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
          <span>AI can make mistakes. Review before sending.</span>
        </footer>
      </div>
    </div>
  );
}