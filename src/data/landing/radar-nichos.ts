/**
 * Nichos do Radar da IA e o formato de um termo medido.
 *
 * Mora em `data/` e não em `lib/radar.ts` de propósito: o componente da home é
 * client-side e só precisa da configuração — não deve arrastar para o bundle o
 * código de coleta e pontuação, que é servidor puro.
 *
 * A lacuna estratégica achada em 26/07/2026: o catálogo da FayAI é organizado
 * por FERRAMENTA (ChatGPT, n8n, Midjourney) e a busca brasileira é organizada
 * por PROFISSÃO e TAREFA ("para advogados", "para concurso"). Cada nicho aqui é
 * uma profissão, não uma ferramenta. É esse o ponto.
 */

/**
 * A ponte entre o que a pessoa procura e o que a FayAI realmente tem.
 *
 * Isto substitui o selo "temos curso" que existia por termo e que era
 * **falso**: não existe curso de IA para advogados no catálogo, e prometer um
 * gera frustração — que custa mais caro que a visita perdida. O que existe é
 * verdade e é forte: quem domina a ferramenta escreve melhor em qualquer LLM.
 * Então a ponte é escrita à mão por nicho, dizendo exatamente o que ajuda e
 * por quê, sem inventar um curso que não fizemos.
 */
import { ehIngles } from "@/lib/idioma";

import { NICHOS_EN } from "./radar-nichos.en";

export interface Ponte {
  /** A frase honesta: o que temos, o que não temos, e por que ainda serve. */
  texto: string;
  cursos: Array<{ slug: string; nome: string }>;
}

export interface Nicho {
  id: string;
  /** Rótulo curto exibido na pílula */
  label: string;
  /** Frase que explica o recorte, exibida sob as pílulas */
  chamada: string;
  /** Cor de contexto — paleta funcional do IDENTIDADE_VISUAL.md §2 */
  cor: string;
  /** Consultas-base enviadas ao autocomplete */
  sementes: string[];
  ponte: Ponte;
}

export const NICHOS: Nicho[] = [
  {
    id: "geral",
    label: "Todo mundo",
    chamada: "O que o Brasil inteiro pergunta sobre IA agora.",
    cor: "#f5c04e",
    sementes: ["como usar ia", "ia para", "o que e ia"],
    ponte: {
      texto:
        "Nenhum curso aqui promete virar especialista da sua área. O que eles entregam é o domínio da ferramenta — e é isso que muda o resultado de qualquer prompt que você escrever depois.",
      cursos: [{ slug: "chatgpt-zero", nome: "ChatGPT do Zero" }, { slug: "prompt-engineering", nome: "Engenharia de Prompt" }],
    },
  },
  {
    id: "concurso",
    label: "Concurso e estudos",
    chamada: "Mercado gigantesco, alta disposição a pagar — e hoje sem nenhuma cobertura nossa.",
    cor: "#a78bfa",
    sementes: ["ia para estudar", "ia para concurso", "ia para estudantes"],
    ponte: {
      texto:
        "Não temos um curso de concursos. Temos o que faz a IA virar monitor de estudo: resumo que não inventa, questão comentada, revisão espaçada — tudo sai de prompt bem escrito, não de ferramenta nova.",
      cursos: [{ slug: "prompt-engineering", nome: "Engenharia de Prompt" }, { slug: "chatgpt-zero", nome: "ChatGPT do Zero" }],
    },
  },
  {
    id: "advogados",
    label: "Advogados",
    chamada: "Nicho de alto ticket que procura por profissão, não por ferramenta.",
    cor: "#38bdf8",
    sementes: ["ia para advogados", "ia juridica", "chatgpt para advogados"],
    ponte: {
      texto:
        "Não existe curso de IA jurídica no catálogo, e não vamos fingir que existe. O que existe é o domínio do ChatGPT e da escrita de prompt — que é exatamente onde o advogado ganha: petição estruturada, resumo de processo e pesquisa que você consegue conferir.",
      cursos: [{ slug: "chatgpt-masterclass", nome: "ChatGPT Masterclass" }, { slug: "prompt-engineering", nome: "Engenharia de Prompt" }],
    },
  },
  {
    id: "saude",
    label: "Médicos e saúde",
    chamada: "Quem cuida de gente querendo tirar o trabalho repetitivo da frente.",
    cor: "#f472b6",
    sementes: ["ia para medicos", "ia na medicina", "ia para saude"],
    ponte: {
      texto:
        "Não temos curso de IA na medicina, e a área exige cuidado que nenhum curso genérico cobre. O que ajuda de verdade é a base: como pedir, como checar a resposta e como nunca terceirizar decisão clínica para um modelo.",
      cursos: [{ slug: "chatgpt-masterclass", nome: "ChatGPT Masterclass" }, { slug: "claude-ia-segura", nome: "Claude e IA Segura" }],
    },
  },
  {
    id: "rh",
    label: "RH e gestão",
    chamada: "Aplicação corporativa — a que mais aparece e a que menos tem material bom.",
    cor: "#a3e635",
    sementes: ["ia para rh", "ia para gestao", "ia para recrutamento"],
    ponte: {
      texto:
        "O que RH pede é repetição com critério: triagem, descrição de vaga, feedback estruturado. Isso é automação com prompt bem escrito — e essas duas coisas nós ensinamos direito.",
      cursos: [{ slug: "primeiras-automacoes", nome: "Primeiras Automações" }, { slug: "prompt-engineering", nome: "Engenharia de Prompt" }],
    },
  },
  {
    id: "vendas",
    label: "Vendas e marketing",
    chamada: "Dor concreta de PME brasileira: vender mais sem contratar mais.",
    cor: "#fb923c",
    sementes: ["ia para vendas", "ia para marketing", "automatizar vendas com ia"],
    ponte: {
      texto:
        "Vender com IA é menos sobre ferramenta e mais sobre fluxo: mensagem certa, na hora certa, sem digitar de novo. É automação — e o curso de n8n leva isso até o WhatsApp.",
      cursos: [{ slug: "n8n-automacao-avancada", nome: "n8n — Automação Avançada" }, { slug: "primeiras-automacoes", nome: "Primeiras Automações" }],
    },
  },
  {
    id: "professores",
    label: "Professores",
    chamada: "Quem ensina precisa de IA antes de todo mundo — e ninguém está falando com eles.",
    cor: "#38bdf8",
    sementes: ["ia para professores", "ia na educacao", "ia para dar aula"],
    ponte: {
      texto:
        "Não temos curso de IA na educação. Temos o que faz um professor economizar as horas que ele perde: plano de aula, prova, correção e material adaptado — tudo em prompt, e prompt se aprende.",
      cursos: [{ slug: "prompt-engineering", nome: "Engenharia de Prompt" }, { slug: "chatgpt-zero", nome: "ChatGPT do Zero" }],
    },
  },
  {
    id: "empreendedores",
    label: "Empreendedores",
    chamada: "O WhatsApp respondendo sozinho é a promessa que mais gera busca no Brasil.",
    cor: "#a3e635",
    sementes: ["automatizar whatsapp com ia", "ia para pequenas empresas", "ganhar dinheiro com ia"],
    ponte: {
      texto:
        "Aqui a promessa é literal: o curso de n8n conecta WhatsApp, planilha e IA num fluxo que responde sozinho. É o pedido mais buscado do Brasil e é o que a gente realmente ensina.",
      cursos: [{ slug: "n8n-automacao-avancada", nome: "n8n — Automação Avançada" }, { slug: "make-integracao-total", nome: "Make — Integração Total" }],
    },
  },
  {
    id: "automacao",
    label: "Automação e agentes",
    chamada: "Demanda de VÍDEO explícita por um curso que já existe aqui.",
    cor: "#a78bfa",
    sementes: ["agentes de ia", "automatizar com ia", "n8n"],
    ponte: {
      texto:
        "Este é o nicho onde o catálogo bate certo com a busca: agentes, n8n e automação são cursos inteiros, não capítulos.",
      cursos: [{ slug: "crie-agentes-de-ia-autonomos", nome: "Crie Agentes de IA Autônomos" }, { slug: "n8n-automacao-avancada", nome: "n8n — Automação Avançada" }],
    },
  },
  {
    id: "criadores",
    label: "Criadores",
    chamada: "Descoberta de ferramenta — o topo de funil mais barato que existe.",
    cor: "#f472b6",
    sementes: ["ia para criar videos", "ia para criar imagens", "ia para conteudo"],
    ponte: {
      texto:
        "Temos criação visual e, no curso de Banana Dev, bem mais conteúdo para criador do que o nome entrega. Falta cobrir mais ferramentas — é limitação nossa, não sua, e está na fila.",
      cursos: [{ slug: "leonardo-ai-criacao-visual", nome: "Leonardo AI — Criação Visual" }, { slug: "banana-dev-deploy-ia", nome: "Banana Dev — Deploy de IA" }],
    },
  },
];

export const NICHO_PADRAO = "geral";

export function getNicho(id: string | null | undefined): Nicho {
  return NICHOS.find((n) => n.id === id) ?? NICHOS[0];
}

/**
 * O mesmo nicho com o texto de tela no idioma pedido.
 *
 * `id`, `cor` e `sementes` NUNCA mudam: as sementes são as consultas que medem
 * o autocomplete brasileiro, e traduzi-las mediria outra coisa. Só a
 * apresentação vira inglês. Falta de tradução cai no português — ver `escolher`
 * em `@/lib/idioma`.
 */
export function nichoDoIdioma(n: Nicho, locale: string): Nicho {
  if (!ehIngles(locale)) return n;
  const en = NICHOS_EN[n.id];
  if (!en) return n;
  return {
    ...n,
    label: en.label,
    chamada: en.chamada,
    ponte: {
      texto: en.ponte.texto,
      cursos: n.ponte.cursos.map((c) => ({ slug: c.slug, nome: en.ponte.cursos[c.slug] ?? c.nome })),
    },
  };
}

/** Um termo medido, já pontuado. */
export interface TermoRadar {
  termo: string;
  score: number;
  /** Quantas vezes apareceu em cada canal */
  web: number;
  yt: number;
  /** Posição média no autocomplete (menor = mais procurado). null se ausente */
  posWeb: number | null;
  posYt: number | null;
  canais: "web+yt" | "web" | "yt";
  /** Sementes distintas que trouxeram este termo — a amplitude do tema */
  sementes: string[];
  /** O que fazer com ele: matéria, Reel, página de curso, isca de funil */
  formato: string;
}
