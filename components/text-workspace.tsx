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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
            F
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">FixMyText AI</h1>
            <p className="text-sm text-slate-500">AI writing assistant</p>
          </div>
        </div>
      </header>

      <section className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Say it better. In seconds.
        </h2>
        <p className="mt-3 text-lg text-slate-600">
          Improve emails, messages, and posts without losing your meaning.
        </p>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setText(ex)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input panel */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="input-text" className="mb-2 text-sm font-medium text-slate-700">
            Your text
          </label>
          <textarea
            id="input-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here..."
            spellCheck={false}
            className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-describedby="char-count"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span id="char-count" className={overLimit ? "text-red-600" : "text-slate-500"}>
              {charCount} / {MAX} characters · {wordCount(text)} words
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-700"
            >
              Clear all
            </button>
          </div>

          <div className="mt-5">
            <ModelSelector value={model} onChange={setModel} disabled={loading} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Tone</p>
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
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Action</p>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1" role="radiogroup" aria-label="Action">
              {ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  role="radio"
                  aria-checked={action === a.value}
                  onClick={() => setAction(a.value)}
                  className={
                    "rounded-lg px-4 py-1.5 text-sm font-medium transition " +
                    (action === a.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900")
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
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Improving..." : "Improve text"}
            </button>
            <button
              type="button"
              onClick={handleTryAgain}
              disabled={loading || !text.trim()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!result}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use output as input
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Output panel */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Improved text
              {resultModel ? <span className="ml-2 text-xs font-normal text-slate-400">via {resultModel}</span> : null}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!result}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div
            aria-live="polite"
            className="min-h-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 whitespace-pre-wrap"
          >
            {loading ? (
              <span className="text-slate-400">Working on it...</span>
            ) : result ? (
              result
            ) : (
              <span className="text-slate-400">Your improved text will appear here.</span>
            )}
          </div>
          {result && (
            <p className="mt-3 text-xs text-slate-500">
              {result.length} characters · {wordCount(result)} words
            </p>
          )}
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-400">
        AI can make mistakes. Review before sending.
      </footer>
    </div>
  );
}