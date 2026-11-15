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

- `AI_PROVIDER` — `openrouter` (default)
- `OPENROUTER_API_KEY` — required for real rewrites
- `OPENROUTER_BASE_URL` — optional, defaults to https://openrouter.ai/api/v1
- `DEFAULT_MODEL` — optional default model id (see `lib/ai/models.ts`)
- `APP_URL` — your app URL (used for OpenRouter ranking headers)

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