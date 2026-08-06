// English copy of the landing minigame bank.
//
// Deliberately a SEPARATE file instead of a locale field inside each example:
// `examples.ts` is the Portuguese original that the whole funnel was tuned on,
// and it stays byte-for-byte untouched. Adding English here can never regress
// the pt-BR home.
//
// ⚠️ The `id` of every entry MUST match the Portuguese one. The id is the key
// for the scene artwork (`/landing/scenes/<id>.webp`) and for XP idempotency on
// the server (`/api/gate/claim-xp` credits per `exampleId`). A student who
// plays "email-dificil" in English and again in Portuguese is the same play.

import type { ExampleCategory, MagicExample } from "./examples";

export const CATEGORIES_EN: { id: ExampleCategory; emoji: string; label: string }[] = [
  { id: "trabalho", emoji: "💼", label: "Work" },
  { id: "estudos", emoji: "📚", label: "Study" },
  { id: "criar", emoji: "🎨", label: "Create" },
  { id: "dia-a-dia", emoji: "☕", label: "Everyday" },
];

export const MAGIC_EXAMPLES_EN: MagicExample[] = [
  {
    id: "email-dificil",
    category: "trabalho",
    emoji: "📧",
    title: "The hard email, done in 10 seconds",
    hook: "That delicate email you've been putting off for three days? AI writes the diplomatic version on the spot.",
    prompt:
      "I need to answer a delicate email. Situation: [describe it in one sentence, e.g. a client is chasing a deadline we're going to miss]. Write a professional, honest and empathetic reply in English, six lines at most, that protects the relationship.",
    result:
      "“Hi Marcus, thanks for following up — you're right to chase it. We hit an unexpected technical issue and the delivery moves to Friday. To make up for it, I've pushed the first part forward; it's attached. I'm around all day today for any adjustments.”",
    apply:
      "Works for chasing payments, apologies, negotiations and hard feedback. Paste the situation, get the finished text — then edit only the final tone.",
    quiz: {
      question: "How long does AI take to write that diplomatic email?",
      options: ["About 5 minutes, if it thinks it through", "Under 10 seconds", "It can't — email is a human thing"],
      answer: 1,
    },
  },
  {
    id: "reuniao-resumida",
    category: "trabalho",
    emoji: "📝",
    title: "A one-hour meeting becomes five lines",
    hook: "Paste the transcript (or your messy notes) and get the minutes back: decisions, open items and who does what.",
    prompt:
      "Here are my notes from a meeting: [paste everything, however messy]. Organise it into: 1) Decisions made, 2) Open items with an owner and a due date, 3) One sentence of summary for someone who wasn't there.",
    result:
      "Decisions: campaign approved with a $5,000 budget. Open items: Ana sends the artwork by Wednesday; Leo closes the supplier by Friday. Summary: the August campaign is approved and starts on the 1st.",
    apply:
      "Use it with your phone's recorder plus automatic transcription. Never leave a meeting again without knowing what was agreed.",
    quiz: {
      question: "What does AI pull out of one messy hour of meeting?",
      options: ["Just a generic summary", "Nothing — it gets lost in the audio", "Decisions, open items AND who does what"],
      answer: 2,
    },
  },
  {
    id: "professor-24h",
    category: "estudos",
    emoji: "🧑‍🏫",
    title: "A private tutor available 24/7",
    hook: "Any subject explained YOUR way — with an analogy, an example and a mini-quiz at the end.",
    prompt:
      "Explain [subject, e.g. compound interest] as if I were 12 years old, using a football analogy. Then ask me 3 questions to test whether I understood, one at a time, correcting my answers.",
    result:
      "“Compound interest is like a team that plays every round with last round's points added to the squad: what you won starts playing too. $100 at 10% becomes 110, and next month the whole 110 takes the field...”",
    apply:
      "Swap the analogy for whatever you love (cooking, music, TV). The mini-quiz is what makes it stick.",
    quiz: {
      question: "Can AI explain compound interest using... football?",
      options: ["It can — with an analogy AND a mini-quiz at the end", "Only if you pay for the premium version", "It can, but it gets confusing"],
      answer: 0,
    },
  },
  {
    id: "flashcards",
    category: "estudos",
    emoji: "🎴",
    title: "Any text becomes memory cards",
    hook: "Paste the chapter, the syllabus or the slide — and get finished question-and-answer flashcards.",
    prompt:
      "Turn this text into 10 question-and-answer flashcards, from the most basic to the hardest, in English: [paste the text]. Then quiz me one by one and tell me whether I got it right.",
    result:
      "Card 1 — Q: Which organ produces insulin? A: The pancreas. | Card 2 — Q: What's the difference between type 1 and type 2 diabetes? A: In type 1 the body doesn't produce insulin; in type 2 it resists it...",
    apply:
      "Perfect for exams and certifications. AI becomes your active-recall partner — the method the science says actually works.",
    quiz: {
      question: "You paste in a whole chapter. What does AI hand back?",
      options: ["An ordinary summary", "10 finished flashcards — and it quizzes you too", "A list of links to study"],
      answer: 1,
    },
  },
  {
    id: "post-30s",
    category: "criar",
    emoji: "📱",
    title: "A complete Instagram post in 30 seconds",
    hook: "One sentence about your business → hook, caption and hashtags ready to publish.",
    prompt:
      "I'm [e.g. a home baker in Brooklyn] and I want a post about [e.g. chocolate cake jars]. Create: 1) a first-line hook that stops the thumb, 2) a short caption with a light tone, 3) 8 local and niche hashtags, 4) a photo idea to go with it.",
    result:
      "Hook: “The cake that's gone before the coffee cools ☕🍫” — Caption: “Real fudge layers, made this morning. Delivering across Brooklyn until 6pm...” plus hashtags and a natural-light photo suggestion.",
    apply:
      "Repeat for each product. In 10 minutes you have a whole week of content — and our courses show you how to automate it.",
    quiz: {
      question: "One sentence about your cake jars. What comes out the other side?",
      options: ["Hook + caption + hashtags + photo idea", "Just a simple caption", "A formal advertising blurb"],
      answer: 0,
    },
  },
  {
    id: "imagem-sem-designer",
    category: "criar",
    emoji: "🖼️",
    title: "Professional images without hiring a designer",
    hook: "The difference between an amateur image and a stunning one is the prompt. Learn the recipe.",
    prompt:
      "Create an image: [subject, e.g. a logo for the ‘Happy Bean’ coffee shop], style [e.g. minimalist, flat], colours [e.g. brown and cream], background [e.g. plain], lighting [e.g. soft], no extra text, high quality.",
    result:
      "An image that matches your brand — because you described subject, style, colour, background and light instead of just “make a nice logo”. That five-ingredient structure works in any generator.",
    apply:
      "Use it in ChatGPT's image generator, in Gemini or in our Studio. The prompt recipe is worth more than the tool.",
    quiz: {
      question: "What's the secret behind a professional AI image?",
      options: ["Luck on the click", "Paying for the most expensive generator", "The recipe: subject + style + colour + background + light"],
      answer: 2,
    },
  },
  {
    id: "cardapio-semana",
    category: "dia-a-dia",
    emoji: "🍳",
    title: "A week of meals from what's already in the fridge",
    hook: "List what you have at home and get the week's menu plus a shopping list for what's missing.",
    prompt:
      "In my fridge I have: [e.g. chicken, rice, eggs, tomatoes, cheese, pasta]. Build a dinner menu from Monday to Friday using that — varied and quick (30 min max) — and a shopping list of only what's missing.",
    result:
      "Mon: creamy chicken pasta. Tue: stuffed omelette + tomato salad. Wed: baked rice with cheese... Shopping list: onion, cream, broccoli (3 items).",
    apply:
      "Five minutes on Sunday and the week is sorted. Works for meal prep, diets and a tight budget too.",
    quiz: {
      question: "You list what's in the fridge. AI builds...",
      options: ["A single recipe", "The week's menu + a shopping list for what's missing", "A generic internet diet"],
      answer: 1,
    },
  },
  {
    id: "conta-explicada",
    category: "dia-a-dia",
    emoji: "🔍",
    title: "Confusing contract or bill? Translated on the spot",
    hook: "Paste the clause or the invoice line you don't understand and get it explained in plain English.",
    prompt:
      "Explain in plain language what this means: [paste the contract clause or the invoice line]. Then tell me: 1) what I should watch out for, 2) what question I should ask before signing or paying.",
    result:
      "“This clause says the monthly fee rises automatically with inflation every 12 months. Watch out: the index used tends to run higher than headline inflation. Ask whether the index can be changed...”",
    apply:
      "Health plans, rent, financing, phone bills. Never sign without understanding again — AI reads the fine print with you.",
    quiz: {
      question: "Paste that confusing contract clause. AI tells you...",
      options: ["What it means + what to ask before signing", "That you need a lawyer", "It just repeats it in other words"],
      answer: 0,
    },
  },
];
