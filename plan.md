# FixMyText AI --- 2-Hour Full-Stack MVP Plan (Claude Code)

> **Project goal:** Build a polished, responsive AI text-rewriting
> website in approximately 2 hours using Claude Code.
>
> **MVP principle:** Keep the scope small. The first version does not
> need authentication, a database, payments, or saved history.

------------------------------------------------------------------------

## 1. Product Overview

### The user problem

People often need to improve messages, emails, LinkedIn posts, or other
text but struggle with grammar, clarity, or the right tone.

### The solution

FixMyText AI lets a user: 1. Paste or type text. 2. Choose a tone. 3.
Choose an action. 4. Click **Improve text**. 5. Review the rewritten
result and copy it.

### Target users

-   Students writing assignments or emails
-   Job seekers writing applications
-   Professionals writing emails and messages
-   Non-native English speakers

### MVP success criteria

-   A user can rewrite text without signing in.
-   The app supports the four tones and three actions listed below.
-   The interface works on mobile and desktop.
-   API keys are only used on the server.
-   Errors and loading states are clear.
-   The user can copy the result.

------------------------------------------------------------------------

## 2. MVP Scope

### Required features (P0)

-   Text input area
-   Tone selector:
    -   Professional
    -   Friendly
    -   Simple
    -   Confident
-   Action selector:
    -   Rewrite
    -   Fix grammar
    -   Make shorter
-   Improve button
-   Output area
-   Copy output button
-   Character count
-   Loading state
-   Empty-input validation
-   API error handling
-   Responsive layout
-   Basic accessibility: labels, keyboard focus, contrast

### Optional if time remains (P1)

-   Clear input/output button
-   Swap input/output
-   Example prompt buttons
-   Before/after word count
-   "Try again" button

### Explicitly out of scope for this 2-hour MVP

-   User accounts / authentication
-   Database / saved history
-   Subscription billing
-   Team workspace
-   File upload
-   Browser extension
-   Multi-language interface
-   Analytics dashboard

------------------------------------------------------------------------

## 3. Recommended Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Why
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js App Router +    Full-stack web app in
                          TypeScript              one repo

  Styling                 Tailwind CSS            Fast responsive UI

  UI components           Native elements;        Keep setup lightweight
                          optionally shadcn/ui    

  Backend                 Next.js Route Handler   Avoid a separate
                                                  backend for this MVP

  AI provider             Anthropic API or        Text rewriting
                          another configured LLM  
                          provider                

  Validation              Zod                     Validate API request

  Deployment              Vercel                  Simple Next.js
                                                  deployment

  Database                None in MVP             Avoid unnecessary scope
  -----------------------------------------------------------------------

**Important:** Claude Code is the coding agent used to build the
application. The AI model powering the deployed product is a separate
decision. Do not assume Claude Code credentials automatically provide an
API key for the website.

### Suggested model integration

Create a provider abstraction so the app can switch providers later: -
`lib/ai/provider.ts` - `lib/ai/rewrite.ts`

Use environment variables for the API key and model name. Never hardcode
secrets or expose them in client-side variables.

------------------------------------------------------------------------

## 4. User Journey (Non-Technical Explanation)

1.  The user opens the website.
2.  They paste a message into the large text box.
3.  They select the desired tone, such as Professional.
4.  They select what they want: Rewrite, Fix grammar, or Make shorter.
5.  They click **Improve text**.
6.  The website sends the text and selected options to its server.
7.  The server asks the configured AI provider to improve the text.
8.  The improved text appears in the output box.
9.  The user clicks **Copy** and uses the result wherever they need.

The app should preserve the original meaning. It should not invent
facts, names, dates, or promises.

------------------------------------------------------------------------

## 5. Architecture

``` mermaid
flowchart TD
    U[User in Browser] --> UI[Next.js UI]
    UI -->|POST /api/rewrite| API[Next.js Route Handler]
    API --> V[Zod Input Validation]
    V --> P[AI Provider Wrapper]
    P --> L[LLM API]
    L --> P
    P --> API
    API -->|JSON response| UI
    UI --> O[Output + Copy]
```

### Request/response contract

**Request** `POST /api/rewrite`

``` json
{
  "text": "hey can you send me the report today",
  "tone": "professional",
  "action": "rewrite"
}
```

**Successful response**

``` json
{
  "result": "Could you please send me the report today?"
}
```

**Error response**

``` json
{
  "error": "The text could not be improved. Please try again."
}
```

### Server-side responsibilities

-   Validate the request
-   Enforce a reasonable input limit (e.g. 5,000 characters)
-   Build the system/user prompt
-   Call the model
-   Handle provider failures and timeouts
-   Return only the rewritten text
-   Keep credentials on the server

### Client-side responsibilities

-   Input and selections
-   Display character count
-   Disable submit while loading
-   Show success or error feedback
-   Display and copy output

------------------------------------------------------------------------

## 6. AI Prompt Design

Use a consistent system instruction along these lines:

> You are a careful writing assistant. Improve the user's text according
> to the requested action and tone. Preserve the original meaning,
> facts, names, dates, and intent. Do not add claims or information.
> Return only the improved text, without explanations, quotation marks,
> or markdown unless the input clearly requires formatting.

### Action guidance

-   **Rewrite:** Make the text clearer and more natural while retaining
    its meaning.
-   **Fix grammar:** Correct grammar, spelling, and punctuation with
    minimal changes.
-   **Make shorter:** Make the text concise while preserving essential
    information.

### Tone guidance

-   **Professional:** Polished, respectful, workplace-appropriate.
-   **Friendly:** Warm, conversational, natural.
-   **Simple:** Plain language and easy to understand.
-   **Confident:** Direct, clear, and assertive without being rude.

Do not ask the model to reveal its reasoning. The output should be the
final revised text only.

------------------------------------------------------------------------

## 7. UI / Page Design

### Single-page layout

-   Top navigation: logo/name `FixMyText AI`, small "AI writing
    assistant" descriptor
-   Hero headline: **Say it better. In seconds.**
-   Subtitle: "Improve emails, messages, and posts without losing your
    meaning."
-   Main workspace:
    -   Left/top: input textarea
    -   Tone chips or select
    -   Action segmented control
    -   Primary button: **Improve text**
    -   Right/below: output panel
    -   Copy button
-   Footer: "AI can make mistakes. Review before sending."

### Design direction

-   Premium, minimal SaaS aesthetic
-   Light background with deep navy text and electric-blue accent
-   Rounded cards, subtle borders, restrained shadows
-   Strong typography and ample whitespace
-   Responsive: two-column workspace on wide screens, stacked on mobile
-   Avoid clutter, excessive gradients, and unnecessary dashboard
    widgets

### Example content

Input: \> hey, i wanted to ask if you can send me the invoice today
because we need it

Professional rewrite: \> Hi, could you please send me the invoice today?
We need it for our records.

The example is illustrative; the model output may vary.

------------------------------------------------------------------------

## 8. Suggested Project Structure

``` text
fixmytext-ai/
├── app/
│   ├── api/
│   │   └── rewrite/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── text-workspace.tsx
│   ├── tone-selector.tsx
│   ├── action-selector.tsx
│   └── output-panel.tsx
├── lib/
│   ├── ai/
│   │   ├── provider.ts
│   │   └── rewrite.ts
│   └── validation/
│       └── rewrite-schema.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is a suggested structure. Claude Code may simplify it if the code
remains easy to understand and maintain.

------------------------------------------------------------------------

## 9. Environment Variables

Create `.env.local` locally and never commit it.

Example `.env.example` (placeholder values only):

``` dotenv
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=replace_with_your_key
AI_MODEL=replace_with_supported_model_name
```

If choosing another provider, use that provider's documented variable
names. Do not prefix server secrets with `NEXT_PUBLIC_`.

------------------------------------------------------------------------

## 10. Build Schedule --- 120 Minutes

### 0--10 minutes: Setup

-   Confirm Node.js version is compatible with current Next.js
    requirements.
-   Create Next.js project with TypeScript and Tailwind.
-   Open project folder in Claude Code.
-   Add environment variable placeholder.

### 10--35 minutes: UI

-   Build page layout and responsive workspace.
-   Add input, tone selector, action selector, and output panel.
-   Add character count and button states.
-   Use mock output temporarily.

### 35--60 minutes: API + AI

-   Create `POST /api/rewrite`.
-   Add Zod validation and input length limit.
-   Implement provider wrapper.
-   Call the model from the server only.
-   Add error handling and timeout behavior.

### 60--80 minutes: Connect frontend

-   Connect the button to the API.
-   Display returned output.
-   Implement loading and error states.
-   Implement copy-to-clipboard.

### 80--100 minutes: Polish

-   Check mobile layout.
-   Add clear/reset and try-again if time permits.
-   Improve accessibility and microcopy.
-   Check that the UI does not lose user input on errors.

### 100--120 minutes: Test and deploy

-   Test all tone/action combinations.
-   Test empty and overly long input.
-   Test invalid/missing API key.
-   Test provider failure.
-   Deploy to Vercel and configure production environment variables.
-   Verify deployed site.

**If the AI API key or provider setup is not ready:** finish the UI with
a mock response first, then connect the provider later.

------------------------------------------------------------------------

## 11. Manual Test Checklist

-   [ ] Empty input is rejected with a friendly message.
-   [ ] Input over the configured limit is rejected.
-   [ ] Rewrite works.
-   [ ] Fix grammar works.
-   [ ] Make shorter works.
-   [ ] Each tone changes the style appropriately.
-   [ ] Output preserves the original facts and intent.
-   [ ] Loading state appears while the request is running.
-   [ ] Button cannot trigger duplicate requests while loading.
-   [ ] Copy button copies the output.
-   [ ] API errors are shown clearly.
-   [ ] API key is not visible in browser source or client logs.
-   [ ] Layout is usable on mobile and desktop.
-   [ ] The app works after deployment.

------------------------------------------------------------------------

## 12. Claude Code Workflow

### How to use Claude Code

1.  Create the project folder.
2.  Open the folder in Claude Code.
3.  Paste the **Master Prompt** below.
4.  Let Claude Code inspect and create the project.
5.  Run the commands it recommends.
6.  Test locally.
7.  Ask Claude Code to fix errors based on terminal output.
8.  Review changes before deploying.

### Master Prompt for Claude Code

``` text
You are a senior full-stack engineer. Build a polished, production-minded but
small MVP called FixMyText AI. The goal is to complete the first usable version
quickly, with a strict scope suitable for a 2-hour build.

PRODUCT:
A user pastes text, selects a tone (Professional, Friendly, Simple, Confident)
and an action (Rewrite, Fix grammar, Make shorter), clicks Improve text, sees
the improved result, and can copy it.

STACK:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Next.js Route Handler for POST /api/rewrite
- Zod validation
- Configurable server-side LLM provider
- No database, authentication, billing, or saved history in this MVP

REQUIREMENTS:
1. Create a clean, premium, responsive SaaS single-page interface.
2. Use a light background, deep navy typography, and electric-blue accent.
3. Provide input textarea, character count, tone selector, action selector,
   Improve button, output panel, and Copy button.
4. Include loading, disabled, empty-input, validation, and API-error states.
5. Enforce a maximum input length of 5,000 characters (or a clearly documented
   configurable limit).
6. Keep API credentials on the server. Never use NEXT_PUBLIC_ for secrets.
7. Preserve the user's meaning, names, dates, and facts. The AI must not invent
   details. Return only the rewritten text.
8. Use a maintainable provider wrapper so the LLM vendor can be changed.
9. Add .env.example with placeholders only.
10. Add a README with setup, environment variables, run, test, and deployment
    instructions.
11. Do not add features outside the scope without asking.
12. Avoid overengineering. Prefer a few clear files over excessive abstraction.

PROCESS:
- First inspect the existing repository and package configuration.
- Briefly state your implementation plan.
- Then implement the application.
- Run lint/type checks if available and fix errors.
- Do not claim the app is tested unless you actually ran the checks.
- If credentials are unavailable, create a clear mock/demo mode so the UI can
  still be tested without a live AI call.
- At the end, report what was built, commands to run, environment variables
  needed, checks performed, and any remaining issues.
```

### Useful follow-up prompts for Claude Code

**If the UI is not polished:**

``` text
Improve the visual design without changing the product scope. Make the page feel
like a premium modern SaaS product. Improve typography, spacing, hierarchy,
responsive behavior, and empty/loading/output states. Keep the UI minimal.
```

**If the API is failing:**

``` text
Inspect the rewrite API route and client request. Identify the root cause of the
error, fix it, and run the available checks. Do not hide errors with fake success
responses. Explain any environment variable that is missing.
```

**Before deployment:**

``` text
Review this project for deployment readiness. Check TypeScript, lint, server-only
secret handling, input validation, API error handling, mobile responsiveness,
and README instructions. Fix issues you can verify. Do not claim a check passed
unless you ran it.
```

------------------------------------------------------------------------

## 13. Basic Security and Reliability

-   Keep AI keys in server environment variables.
-   Validate all client input on the server.
-   Limit text length and request size.
-   Avoid logging user text or API secrets.
-   Show a generic user-facing error; keep diagnostic details
    server-side.
-   Consider rate limiting before public launch.
-   Do not promise that AI output is always correct.
-   Tell users to review important messages before sending.
-   Do not store text in a database in this MVP.

------------------------------------------------------------------------

## 14. Launch Checklist

-   [ ] Project starts locally.
-   [ ] `.env.local` is configured.
-   [ ] Rewrite API works.
-   [ ] UI is responsive.
-   [ ] Copy functionality works.
-   [ ] Error states are tested.
-   [ ] No secrets committed to Git.
-   [ ] README is complete.
-   [ ] Production environment variables are configured.
-   [ ] Deployed URL is tested.

------------------------------------------------------------------------

## 15. Recommended Next Step After MVP

Do not immediately add lots of features. Show the working app to 5--10
potential users and observe whether they use it for real writing tasks.

If users find it useful, the next iteration could add: - Saved rewrite
history (with explicit user consent) - Email-specific templates -
LinkedIn post mode - Browser extension - Additional languages

The first objective is a working, simple product---not a large feature
list.

------------------------------------------------------------------------

## 16. Documentation Links

Use official documentation as the source of truth for setup and APIs:

-   Next.js: https://nextjs.org/docs
-   Next.js Route Handlers:
    https://nextjs.org/docs/app/building-your-application/routing/route-handlers
-   Tailwind CSS: https://tailwindcss.com/docs
-   Zod: https://zod.dev/
-   Anthropic API documentation: https://docs.anthropic.com/
-   Vercel deployment: https://vercel.com/docs
-   Claude Code documentation:
    https://docs.anthropic.com/en/docs/claude-code/overview

------------------------------------------------------------------------

**Founder note:** Build the smallest working version, demo it, and get
feedback. The project is intentionally scoped so a beginner can follow
it with Claude Code without needing a separate backend, database, or
authentication system.
