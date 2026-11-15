// Shared by the client UI and the server prompt builder.

export const MODE_IDS = [
  "rewrite",
  "fix-grammar",
  "make-shorter",
  "expand",
  "simplify",
  "paraphrase",
  "summarize",
  "bullet-points",
  "to-email",
  "reply",
  "social-post",
  "translate",
] as const;

export const TONE_IDS = [
  "natural",
  "professional",
  "friendly",
  "confident",
  "formal",
  "casual",
  "persuasive",
  "empathetic",
  "simple",
  "academic",
] as const;

export type Mode = (typeof MODE_IDS)[number];
export type Tone = (typeof TONE_IDS)[number];

export type ModeInfo = {
  id: Mode;
  label: string;
  hint: string;
  /** False when the mode should keep the writer's own tone (e.g. grammar fixes). */
  usesTone: boolean;
  placeholder: string;
};

export const MODES: ModeInfo[] = [
  {
    id: "rewrite",
    label: "Improve",
    hint: "Clearer, smoother, more natural",
    usesTone: true,
    placeholder: "Paste anything you wrote — an email, message, post, essay…",
  },
  {
    id: "fix-grammar",
    label: "Fix grammar",
    hint: "Spelling, grammar & punctuation only",
    usesTone: false,
    placeholder: "Paste text to proofread. Your wording stays the same.",
  },
  {
    id: "make-shorter",
    label: "Shorten",
    hint: "Same message, fewer words",
    usesTone: true,
    placeholder: "Paste text that feels too long…",
  },
  {
    id: "expand",
    label: "Expand",
    hint: "Fuller sentences, no made-up facts",
    usesTone: true,
    placeholder: "Paste a short draft or a few rough lines to flesh out…",
  },
  {
    id: "simplify",
    label: "Simplify",
    hint: "Plain words anyone can follow",
    usesTone: false,
    placeholder: "Paste complex or technical text to make easy to read…",
  },
  {
    id: "paraphrase",
    label: "Paraphrase",
    hint: "Say it a different way",
    usesTone: true,
    placeholder: "Paste text to reword in fresh language…",
  },
  {
    id: "summarize",
    label: "Summarize",
    hint: "The key points, briefly",
    usesTone: false,
    placeholder: "Paste an article, thread, or long email to summarize…",
  },
  {
    id: "bullet-points",
    label: "Bullets",
    hint: "Turn prose into a clean list",
    usesTone: false,
    placeholder: "Paste notes or a paragraph to turn into bullet points…",
  },
  {
    id: "to-email",
    label: "Write email",
    hint: "Rough notes → ready-to-send email",
    usesTone: true,
    placeholder: "Jot what you want to say, e.g. “ask Sam for the Q3 invoice by Friday, thanks for the quick help last week”",
  },
  {
    id: "reply",
    label: "Reply",
    hint: "Draft a reply to a message",
    usesTone: true,
    placeholder: "Paste the message you received. Optionally add your intent after “---”, e.g. “--- say yes but next week”",
  },
  {
    id: "social-post",
    label: "Social post",
    hint: "LinkedIn / X-ready post",
    usesTone: true,
    placeholder: "Paste an idea, update, or announcement to turn into a post…",
  },
  {
    id: "translate",
    label: "Translate",
    hint: "Natural translation, same meaning",
    usesTone: false,
    placeholder: "Paste text in any language to translate…",
  },
];

export const TONES: { id: Tone; label: string }[] = [
  { id: "natural", label: "Natural" },
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "confident", label: "Confident" },
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Casual" },
  { id: "persuasive", label: "Persuasive" },
  { id: "empathetic", label: "Empathetic" },
  { id: "simple", label: "Simple" },
  { id: "academic", label: "Academic" },
];

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Dutch",
  "Hindi",
  "Gujarati",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Urdu",
  "Arabic",
  "Turkish",
  "Russian",
  "Ukrainian",
  "Polish",
  "Chinese (Simplified)",
  "Japanese",
  "Korean",
  "Indonesian",
  "Vietnamese",
  "Thai",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const MAX_INPUT_CHARS = 5000;

export function modeInfo(id: Mode): ModeInfo {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}
