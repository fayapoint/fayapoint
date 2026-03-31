// Cube rotation stops — each maps to a face orientation
export const STOPS = [
  { rx: 90, ry: 0 },      // 0: TOP (Hero)
  { rx: 0, ry: 0 },       // 1: FRONT (Cursos)
  { rx: 0, ry: -90 },     // 2: RIGHT (Certificacao)
  { rx: 0, ry: -180 },    // 3: BACK (Manifesto)
  { rx: 0, ry: -270 },    // 4: LEFT (Servicos)
  { rx: -90, ry: -360 },  // 5: BOTTOM (Comece)
] as const;

export const FACE_NAMES = ["HERO", "CURSOS", "CERTIFICACAO", "MANIFESTO", "SERVICOS", "COMECE"] as const;
export const N = FACE_NAMES.length;

export type FacePosition = "top" | "front" | "right" | "back" | "left" | "bottom";

export interface FaceConfig {
  face: FacePosition;
  icon: string;
  title: string;
  subtitle: string;
  phantom: string;
  route?: string;        // clickable route to navigate into
  routeLabel?: string;   // hover tooltip text
  content: FaceContent;
}

export type FaceContent =
  | { type: "grid"; items: { num: string; label: string }[] }
  | { type: "services"; items: string[] }
  | { type: "certificate"; name: string; course: string; score: string; code: string }
  | { type: "image"; src: string; alt: string }
  | { type: "cta"; url: string; label: string };

export interface SectionConfig {
  id: string;
  faceIndex: number;
  position: "left" | "right" | "center";
  tag: string;
  heading: string[];
  body: string[];
  stats?: { num: string; label: string }[];
  features?: string[];
  prevHref?: string;
  prevLabel?: string;
  nextHref: string;
  nextLabel: string;
  nextRoute?: string; // actual Next.js route for zoom navigation
}

export const FACES: FaceConfig[] = [
  {
    face: "top", icon: "🎓", title: "FAYAI", subtitle: "Domine Inteligencia Artificial", phantom: "HERO",
    route: "/descobrir", routeLabel: "Explorar plataforma",
    content: { type: "grid", items: [
      { num: "18+", label: "Cursos" }, { num: "247", label: "Certificados" },
      { num: "92%", label: "Aprovacao" }, { num: "100+", label: "Ferramentas" },
    ]},
  },
  {
    face: "front", icon: "🤖", title: "CURSOS", subtitle: "ChatGPT / Claude / Midjourney / n8n", phantom: "CURSOS",
    route: "/cursos", routeLabel: "Ver todos os cursos",
    content: { type: "grid", items: [
      { num: "01", label: "ChatGPT Masterclass" }, { num: "02", label: "Claude AI Pro" },
      { num: "03", label: "Gemini & AI Studio" }, { num: "04", label: "Prompt Engineering" },
    ]},
  },
  {
    face: "right", icon: "📋", title: "CERTIFICACAO", subtitle: "Verificavel por qualquer empregador", phantom: "CERT",
    route: "/certificacoes", routeLabel: "Ver certificacoes",
    content: { type: "image", src: "/certificado.svg", alt: "Certificado FayAI - ChatGPT Masterclass" },
  },
  {
    face: "back", icon: "⚡", title: "POR QUE FAYAI", subtitle: "Manifesto", phantom: "MANIFESTO",
    route: "/blog", routeLabel: "Ler manifesto",
    content: { type: "services", items: [
      "Certificacao real com quiz avaliativo",
      "Conteudo atualizado semanalmente",
      "100% em portugues brasileiro",
      "Pagamento via Pix, boleto, cartao",
    ]},
  },
  {
    face: "left", icon: "🛠", title: "SERVICOS", subtitle: "Consultoria e Desenvolvimento", phantom: "SERVICOS",
    route: "/servicos", routeLabel: "Ver servicos",
    content: { type: "services", items: [
      "Construcao de sites",
      "Automacao com n8n e IA",
      "Consultoria em IA",
      "Treinamento corporativo",
    ]},
  },
  {
    face: "bottom", icon: "🇧🇷", title: "COMECE AGORA", subtitle: "Curso gratuito disponivel este mes", phantom: "INICIO",
    route: "/registro", routeLabel: "Registre-se gratis",
    content: { type: "cta", url: "/registro", label: "GRATIS" },
  },
];

export const SECTIONS: SectionConfig[] = [
  {
    id: "s0", faceIndex: 0, position: "left",
    tag: "FayAI — Educacao em IA",
    heading: ["DOMINE", "INTELIGENCIA", "ARTIFICIAL"],
    body: ["18+ cursos praticos em portugues.", "Aprenda ChatGPT, Claude, Midjourney, n8n", "e 100+ ferramentas. Certifique-se."],
    stats: [{ num: "18+", label: "Cursos" }, { num: "247", label: "Certs" }, { num: "92%", label: "Aprovacao" }],
    nextHref: "#s1", nextLabel: "Explorar Cursos →", nextRoute: "/cursos",
  },
  {
    id: "s1", faceIndex: 1, position: "right",
    tag: "01 — Cursos em Destaque",
    heading: ["APRENDA", "COM", "PRATICA"],
    body: ["Cada curso cobre uma ferramenta de IA", "do zero ao avancado. Exemplos reais.", "Exercicios praticos. Certificacao ao final."],
    prevHref: "#s0", prevLabel: "← Voltar",
    nextHref: "#s2", nextLabel: "Certificacao →", nextRoute: "/certificacoes",
  },
  {
    id: "s2", faceIndex: 2, position: "left",
    tag: "02 — Certificacao Verificavel",
    heading: ["PROVE", "QUE VOCE", "SABE"],
    body: ["Nao e um PDF decorativo.", "Quiz com 10 questoes, 70% de aprovacao.", "Codigo de verificacao unico.", "Qualquer empregador pode confirmar."],
    features: ["10 questoes por curso", "70% de nota minima", "Ate 3 tentativas", "Verificacao publica", "LinkedIn shareable"],
    prevHref: "#s1", prevLabel: "← Voltar",
    nextHref: "#s3", nextLabel: "Manifesto →",
  },
  {
    id: "s3", faceIndex: 3, position: "right",
    tag: "03 — Manifesto",
    heading: ["POR QUE", "FAYAI"],
    body: ["Conteudo de IA que foi lancado semanas atras.", "Nao meses. Nao anos. Semanas.", "Autoresearch, Claude 4, Gemini 2.5.", "100% em portugues. Feito para o Brasil."],
    stats: [{ num: "100+", label: "Ferramentas" }, { num: "BR", label: "Portugues" }],
    prevHref: "#s2", prevLabel: "← Voltar",
    nextHref: "#s4", nextLabel: "Servicos →", nextRoute: "/servicos",
  },
  {
    id: "s4", faceIndex: 4, position: "left",
    tag: "04 — Servicos Profissionais",
    heading: ["ALEM", "DOS", "CURSOS"],
    body: ["Construcao de sites. Automacao com n8n.", "Consultoria em inteligencia artificial.", "Treinamento corporativo.", "Edicao de video e SEO local."],
    prevHref: "#s3", prevLabel: "← Voltar",
    nextHref: "#s5", nextLabel: "Comece →", nextRoute: "/servicos",
  },
  {
    id: "s5", faceIndex: 5, position: "center",
    tag: "05 — Comece Agora",
    heading: ["PRONTO", "PARA", "DOMINAR IA"],
    body: ["Comece pelo curso gratuito do mes.", "Sem cartao. Sem compromisso.", "Certificado incluso."],
    nextHref: "/registro", nextLabel: "Comece Gratis →", nextRoute: "/registro",
  },
];

// Easing function: quadratic in-out
export const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

// Interpolate cube rotation from normalized scroll position (0-1)
export function getCubeRotation(scrollNorm: number) {
  const t = scrollNorm * (N - 1);
  const i = Math.min(Math.floor(t), N - 2);
  const f = easeIO(t - i);
  const a = STOPS[i], b = STOPS[i + 1];
  return {
    rx: a.rx + (b.rx - a.rx) * f,
    ry: a.ry + (b.ry - a.ry) * f,
  };
}
