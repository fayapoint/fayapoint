// Cube rotation stops — each maps to a face orientation
export const STOPS = [
  { rx: 90, ry: 0 },      // 0: TOP (Hero)
  { rx: 0, ry: 0 },       // 1: FRONT (Cursos)
  { rx: 0, ry: -90 },     // 2: RIGHT (Certificacao)
  { rx: 0, ry: -180 },    // 3: BACK (Manifesto)
  { rx: 0, ry: -270 },    // 4: LEFT (Servicos)
  { rx: -90, ry: -360 },  // 5: BOTTOM (Comece)
] as const;

export const FACE_NAMES = ["HERO", "CURSOS", "CERTIFICAÇÃO", "MANIFESTO", "SERVIÇOS", "COMECE"] as const;
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
    face: "top", icon: "🎓", title: "FAYAI", subtitle: "Domine Inteligência Artificial", phantom: "HERO",
    route: "/descobrir", routeLabel: "Explorar plataforma",
    content: { type: "grid", items: [
      { num: "18+", label: "Cursos" }, { num: "247", label: "Certificados" },
      { num: "92%", label: "Aprovação" }, { num: "100+", label: "Ferramentas" },
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
    face: "right", icon: "📋", title: "CERTIFICAÇÃO", subtitle: "Verificável por qualquer empregador", phantom: "CERT",
    route: "/certificacoes", routeLabel: "Ver certificações",
    content: { type: "image", src: "/certificado.svg", alt: "Certificado FayAI - ChatGPT Masterclass" },
  },
  {
    face: "back", icon: "⚡", title: "POR QUE FAYAI", subtitle: "Manifesto", phantom: "MANIFESTO",
    route: "/blog", routeLabel: "Ler manifesto",
    content: { type: "services", items: [
      "Certificação real com quiz avaliativo",
      "Conteúdo atualizado semanalmente",
      "100% em português brasileiro",
      "Pagamento via Pix, boleto, cartão",
    ]},
  },
  {
    face: "left", icon: "🛠", title: "SERVIÇOS", subtitle: "Consultoria e Desenvolvimento", phantom: "SERVIÇOS",
    route: "/servicos", routeLabel: "Ver serviços",
    content: { type: "services", items: [
      "Construção de sites",
      "Automação com n8n e IA",
      "Consultoria em IA",
      "Treinamento corporativo",
    ]},
  },
  {
    face: "bottom", icon: "🇧🇷", title: "COMECE AGORA", subtitle: "Curso gratuito disponível este mês", phantom: "INÍCIO",
    route: "/registro", routeLabel: "Registre-se grátis",
    content: { type: "cta", url: "/registro", label: "GRÁTIS" },
  },
];

export const SECTIONS: SectionConfig[] = [
  {
    id: "s0", faceIndex: 0, position: "left",
    tag: "FayAI — Educação em IA",
    heading: ["DOMINE", "INTELIGÊNCIA", "ARTIFICIAL"],
    body: ["18+ cursos práticos em português.", "Aprenda ChatGPT, Claude, Midjourney, n8n", "e 100+ ferramentas. Certifique-se."],
    stats: [{ num: "18+", label: "Cursos" }, { num: "247", label: "Certs" }, { num: "92%", label: "Aprovação" }],
    nextHref: "#s1", nextLabel: "Descobrir FayAI ->", nextRoute: "/descobrir",
  },
  {
    id: "s1", faceIndex: 1, position: "right",
    tag: "01 — Cursos em Destaque",
    heading: ["APRENDA", "COM", "PRATICA"],
    body: ["Cada curso cobre uma ferramenta de IA", "do zero ao avançado. Exemplos reais.", "Exercícios práticos. Certificação ao final."],
    prevHref: "#s0", prevLabel: "<- Voltar",
    nextHref: "#s2", nextLabel: "Certificação ->", nextRoute: "/certificacoes",
  },
  {
    id: "s2", faceIndex: 2, position: "left",
    tag: "02 — Certificação Verificável",
    heading: ["PROVE", "QUE VOCE", "SABE"],
    body: ["Não é um PDF decorativo.", "Quiz com 10 questões, 70% de aprovação.", "Código de verificação único.", "Qualquer empregador pode confirmar."],
    features: ["10 questões por curso", "70% de nota mínima", "Até 3 tentativas", "Verificação pública", "Compartilhável no LinkedIn"],
    prevHref: "#s1", prevLabel: "<- Voltar",
    nextHref: "#s3", nextLabel: "Manifesto ->",
  },
  {
    id: "s3", faceIndex: 3, position: "right",
    tag: "03 — Manifesto",
    heading: ["POR QUE", "FAYAI"],
    body: ["Conteúdo de IA revisado com fontes oficiais.", "Não meses. Não anos. Atualização constante.", "GPT-5.5, Claude Opus 4.7, Gemini 3.1.", "100% em português. Feito para o Brasil."],
    stats: [{ num: "100+", label: "Ferramentas" }, { num: "BR", label: "Português" }],
    prevHref: "#s2", prevLabel: "<- Voltar",
    nextHref: "#s4", nextLabel: "Serviços ->", nextRoute: "/servicos",
  },
  {
    id: "s4", faceIndex: 4, position: "left",
    tag: "04 — Serviços Profissionais",
    heading: ["ALEM", "DOS", "CURSOS"],
    body: ["Construção de sites. Automação com n8n.", "Consultoria em inteligência artificial.", "Treinamento corporativo.", "Edição de vídeo e SEO local."],
    prevHref: "#s3", prevLabel: "<- Voltar",
    nextHref: "#s5", nextLabel: "Comece ->", nextRoute: "/servicos",
  },
  {
    id: "s5", faceIndex: 5, position: "center",
    tag: "05 — Comece Agora",
    heading: ["PRONTO", "PARA", "DOMINAR IA"],
    body: ["Comece pelo curso gratuito do mês.", "Sem cartão. Sem compromisso.", "Certificado incluso."],
    nextHref: "/registro", nextLabel: "Comece Grátis ->", nextRoute: "/registro",
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
