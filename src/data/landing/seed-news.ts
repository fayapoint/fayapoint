// Notícias-semente da seção "IA HOJE" da landing.
// São cápsulas educativas evergreen usadas como fallback enquanto o agente
// autônomo (OpenClaw/Hermes) não estiver publicando na collection `ainews`
// do MongoDB — a página lê o banco primeiro e só cai aqui se estiver vazio.

export interface AiNewsItem {
  slug: string;
  tag: string;
  title: string;
  summary: string;
  url?: string; // link da matéria (externo) ou rota interna
  source?: string; // veículo/origem, ex. "The Verge", "FayAI Explica"
  image?: string; // caminho da imagem ilustrativa
  date?: string; // ISO — vazio nas seeds (evergreen)
}

export const SEED_NEWS: AiNewsItem[] = [
  {
    slug: "ia-le-tudo",
    tag: "VOCÊ SABIA?",
    title: "A IA que você já usa lê imagens, PDFs e planilhas",
    summary:
      "A maioria das pessoas ainda só pede texto ao ChatGPT — mas os modelos atuais analisam fotos, contratos e tabelas inteiras. Envie o arquivo em vez de digitar.",
    url: "/blog",
    source: "FayAI Explica",
    image: "/landing/news-leitura.webp",
  },
  {
    slug: "agentes-executam",
    tag: "TENDÊNCIA",
    title: "Agentes de IA já executam tarefas sozinhos",
    summary:
      "A nova geração de IA não só responde: pesquisa, compara preços, preenche planilhas e monitora páginas para você. É o assunto mais quente de 2026.",
    url: "/blog",
    source: "FayAI Explica",
    image: "/landing/news-agentes.webp",
  },
  {
    slug: "video-barato",
    tag: "FERRAMENTAS",
    title: "Criar vídeo com IA ficou acessível para qualquer um",
    summary:
      "O que custava um estúdio hoje sai por centavos: roteiro, narração e imagem gerados em minutos. Pequenos negócios estão publicando vídeo diário assim.",
    url: "/blog",
    source: "FayAI Explica",
    image: "/landing/news-video.webp",
  },
];
