# FixMyText AI

A polished, responsive AI text-rewriting web app. Paste text, choose a tone and
action, click **Improve text**, and copy the result.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Next.js Route Handler (`POST /api/rewrite`)
- Zod validation
- Server-side LLM provider wrapper (Anthropic or OpenAI-compatible)

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local with your API key
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. Server secrets must never use the `NEXT_PUBLIC_` prefix.

- `AI_PROVIDER` — `anthropic` (default) or `openai`
- `ANTHROPIC_API_KEY` — required when provider is anthropic
- `OPENAI_API_KEY` — required when provider is openai
- `AI_MODEL` — optional model override
- `AI_BASE_URL` — optional OpenAI-compatible base URL

If no API key is configured, the app runs in **demo mode** and returns the
input unchanged with a demo label.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

Deploy to Vercel and configure the production environment variables in the
Vercel dashboard. Never commit `.env.local`.