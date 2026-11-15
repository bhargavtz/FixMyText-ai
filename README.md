# FixMyText AI

A polished, responsive AI text-rewriting web app. Paste text, choose a model, a
tone, and an action, then copy the result.

## Features

- Model picker with live text-to-text models from OpenRouter:
  Google Gemini, Anthropic Claude, OpenAI, DeepSeek, Z.ai (GLM), and NVIDIA.
- Default model is a Gemini model.
- 8 tones: Professional, Friendly, Simple, Confident, Formal, Casual,
  Persuasive, Empathetic.
- 7 actions: Rewrite, Fix grammar, Make shorter, Expand, Summarize,
  Bullet points, Simplify.
- Example prompts that fill the editor in one click.
- Character/word counts, copy, try again, use output as input, clear all.
- Demo mode when no API key is configured.

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

If no API key is configured, the app runs in **demo mode** and returns the
input unchanged with a demo label.

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