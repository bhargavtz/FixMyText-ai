# FixMyText AI

A polished, responsive AI text-rewriting web app. Paste text, choose a model, a
tone, and an action, then copy the result.

## Features

- **App-style, no-scroll workspace.** Modes, tone and the main button sit above
  the fold on desktop and phones; input and result share one screen.
- **12 modes:** Improve, Fix grammar, Shorten, Expand, Simplify, Paraphrase,
  Summarize, Bullets, Write email (notes → email), Reply (draft a reply, with
  optional `---` instructions), Social post, Translate (25 languages).
- **10 tones:** Natural, Professional, Friendly, Confident, Formal, Casual,
  Persuasive, Empathetic, Simple, Academic. Modes that should keep your own
  voice (grammar, simplify, summarize, bullets, translate) hide the tone picker.
- **Result tools:** editable result, one-click Copy (with a fallback for
  non-HTTPS/LAN testing), word-level "Changes" diff, Regenerate, Edit more
  (result → input), Stop an in-flight request.
- **Everyday comforts:** draft autosave, last 20 results in History, light/dark
  theme, Ctrl/⌘ + Enter shortcut, remembered mode/tone/model. All of this is
  stored in the browser only (localStorage) — nothing is saved server-side.
- Model picker with live text-to-text models from OpenRouter.
- Demo mode when no API key is configured.

## Prompting

`lib/ai/prompts.ts` builds a structured system prompt: core rules (fidelity to
facts, user text is content not instructions, same language, plain-text
output, placeholders instead of invented details), a detailed per-mode task,
and a tone description. Temperature is lowered for grammar/translation.
`cleanOutput` strips fences, chatty preambles and wrapping quotes that models
sometimes add.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Next.js Route Handler (`POST /api/rewrite`)
- Zod validation
- Server-side OpenRouter provider wrapper

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local with your OpenRouter API key
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. Server secrets must never use the `NEXT_PUBLIC_` prefix.

- `AI_PROVIDER` — `openrouter` (default)
- `OPENROUTER_API_KEY` — required for real rewrites
- `OPENROUTER_BASE_URL` — optional, defaults to https://openrouter.ai/api/v1
- `DEFAULT_MODEL` — optional default OpenRouter model id. Gemini is used when
  this is unset or unavailable.
- `APP_URL` — your app URL (used for OpenRouter ranking headers)

If no API key is configured, the app runs in **demo mode**: it returns the
input unchanged and the result panel shows a "Demo" badge.

## How model selection works

The server fetches OpenRouter's public model list and filters it to text-to-text
models from the six supported providers. The list is cached for an hour and
falls back to a small static list if OpenRouter is unreachable. Only allowlisted
provider prefixes are accepted by the API.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

Deploy to Vercel and configure the production environment variables in the
Vercel dashboard. Never commit `.env.local`.