/**
 * Os nichos do Radar da IA em inglês — só o que é TEXTO DE TELA.
 *
 * Fica separado de `radar-nichos.ts` pelo mesmo motivo de `examples.en.ts`: o
 * arquivo em português é o original e continua intocado. Aqui não há `sementes`
 * (as consultas mandadas ao autocomplete do Google/YouTube) nem `cor` — as
 * sementes MEDEM o Brasil em português e traduzi-las mudaria o dado, não a
 * apresentação dele. O Radar continua sendo o retrato da busca brasileira; o
 * inglês só explica esse retrato para quem lê em inglês.
 *
 * O `nome` de cada curso na ponte também é traduzido aqui — mas o `slug` não,
 * porque é a URL.
 */

export interface NichoEn {
  label: string;
  chamada: string;
  ponte: { texto: string; cursos: Record<string, string> };
}

export const NICHOS_EN: Record<string, NichoEn> = {
  geral: {
    label: "Everyone",
    chamada: "What the whole of Brazil is asking about AI right now.",
    ponte: {
      texto:
        "No course here promises to turn you into a specialist in your field. What they deliver is command of the tool — and that is what changes the result of any prompt you write afterwards.",
      cursos: { "chatgpt-zero": "ChatGPT from Scratch", "prompt-engineering": "Prompt Engineering" },
    },
  },
  concurso: {
    label: "Exams and study",
    chamada: "A huge market with high willingness to pay — and no coverage from us today.",
    ponte: {
      texto:
        "We don't have a course on public-service exams. We have what turns AI into a study partner: summaries that don't invent, worked questions, spaced repetition — all of it comes from a well-written prompt, not from a new tool.",
      cursos: { "prompt-engineering": "Prompt Engineering", "chatgpt-zero": "ChatGPT from Scratch" },
    },
  },
  advogados: {
    label: "Lawyers",
    chamada: "A high-ticket niche that searches by profession, not by tool.",
    ponte: {
      texto:
        "There is no legal-AI course in the catalogue, and we won't pretend there is. What does exist is command of ChatGPT and of prompt writing — which is exactly where a lawyer wins: a structured filing, a case summary and research you can actually verify.",
      cursos: { "chatgpt-masterclass": "ChatGPT Masterclass", "prompt-engineering": "Prompt Engineering" },
    },
  },
  saude: {
    label: "Doctors and healthcare",
    chamada: "People who care for people, wanting the repetitive work out of the way.",
    ponte: {
      texto:
        "We have no course on AI in medicine, and the field demands care no generic course covers. What genuinely helps is the foundation: how to ask, how to check the answer, and how never to outsource a clinical decision to a model.",
      cursos: { "chatgpt-masterclass": "ChatGPT Masterclass", "claude-ia-segura": "Claude and Safe AI" },
    },
  },
  rh: {
    label: "HR and management",
    chamada: "The corporate use case that comes up most and has the least good material.",
    ponte: {
      texto:
        "What HR asks for is repetition with judgement: screening, job descriptions, structured feedback. That's automation plus a well-written prompt — and those two things we teach properly.",
      cursos: { "primeiras-automacoes": "Your First Automations", "prompt-engineering": "Prompt Engineering" },
    },
  },
  vendas: {
    label: "Sales and marketing",
    chamada: "A concrete pain for small Brazilian businesses: sell more without hiring more.",
    ponte: {
      texto:
        "Selling with AI is less about the tool and more about the flow: the right message, at the right moment, without typing it again. That's automation — and the n8n course takes it all the way to WhatsApp.",
      cursos: { "n8n-automacao-avancada": "n8n — Advanced Automation", "primeiras-automacoes": "Your First Automations" },
    },
  },
  professores: {
    label: "Teachers",
    chamada: "People who teach need AI before anyone else — and nobody is talking to them.",
    ponte: {
      texto:
        "We have no course on AI in education. We have what saves a teacher the hours they lose: lesson plans, tests, marking and adapted material — all of it prompt work, and prompts can be learned.",
      cursos: { "prompt-engineering": "Prompt Engineering", "chatgpt-zero": "ChatGPT from Scratch" },
    },
  },
  empreendedores: {
    label: "Founders",
    chamada: "WhatsApp answering on its own is the promise that drives the most search in Brazil.",
    ponte: {
      texto:
        "Here the promise is literal: the n8n course connects WhatsApp, a spreadsheet and AI into a flow that answers on its own. It's the most searched request in Brazil and it's what we actually teach.",
      cursos: { "n8n-automacao-avancada": "n8n — Advanced Automation", "make-integracao-total": "Make — Total Integration" },
    },
  },
  automacao: {
    label: "Automation and agents",
    chamada: "Explicit VIDEO demand for a course that already exists here.",
    ponte: {
      texto:
        "This is the niche where the catalogue lines up with the search: agents, n8n and automation are whole courses, not chapters.",
      cursos: {
        "crie-agentes-de-ia-autonomos": "Build Autonomous AI Agents",
        "n8n-automacao-avancada": "n8n — Advanced Automation",
      },
    },
  },
  criadores: {
    label: "Creators",
    chamada: "Tool discovery — the cheapest top of funnel there is.",
    ponte: {
      texto:
        "We have visual creation and, inside the Banana Dev course, far more creator material than the name lets on. More tools still need covering — that's our limitation, not yours, and it's in the queue.",
      cursos: {
        "leonardo-ai-criacao-visual": "Leonardo AI — Visual Creation",
        "banana-dev-deploy-ia": "Banana Dev — Deploying AI",
      },
    },
  },
};
