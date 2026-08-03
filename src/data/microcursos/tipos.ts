/**
 * Modelo dos microcursos — a seção `/inventando`.
 *
 * Cada microcurso nasce de UM trecho de UM vídeo: o capítulo em que a fonte
 * apresenta uma ferramenta. O recorte é esse de propósito. Um vídeo de 28
 * minutos que cobre 16 lançamentos não é uma página — é dezesseis, cada uma
 * respondendo à pergunta que a pessoa realmente digita ("o que é o Seedance
 * 2.5", "como rodar o DeepSeek V4 Flash").
 *
 * Por que dados em arquivo e não no banco: a página do curso é renderizada no
 * servidor a partir daqui. Buscar o conteúdo no cliente via `/api/` foi
 * exatamente o que transformou 20 páginas de curso em soft 404 em 28/07/2026 —
 * o Google recebia 624 chars idênticos porque `/api/` está sob `Disallow`.
 * Conteúdo que precisa ser indexado entra no HTML servido.
 */

/** Bloco de conteúdo de uma aula. */
export type Secao =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "passos"; itens: string[] }
  /** Trecho do que a fonte disse, com o minuto exato. */
  | { tipo: "citacao"; texto: string; minuto: string }
  /** Ressalva. Renderiza em destaque âmbar. */
  | { tipo: "alerta"; texto: string };

export interface Aula {
  titulo: string;
  /** Tempo de leitura estimado, ex.: "2 min". */
  duracao: string;
  secoes: Secao[];
}

/** De onde o microcurso saiu — sempre visível na página, com timestamp. */
export interface Fonte {
  videoId: string;
  tituloVideo: string;
  canal: string;
  canalUrl: string;
  /** Título do capítulo no vídeo original. */
  capitulo: string;
  /** Início do capítulo em segundos — vira `?t=` no link. */
  inicio: number;
  fim: number;
  /** Data de publicação do vídeo, ISO. */
  publicadoEm: string;
}

export type Categoria =
  | "Vídeo"
  | "Áudio"
  | "Imagem"
  | "Modelos"
  | "Robótica"
  | "Mundos 3D"
  | "Produtividade";

export type Acesso =
  | "Open source"
  | "Gratuito"
  | "Freemium"
  | "Pago"
  | "Em breve";

export type Nivel = "Introdutório" | "Intermediário" | "Avançado";

export interface Microcurso {
  slug: string;
  titulo: string;
  subtitulo: string;
  /** Nome canônico da ferramenta (corrigido — a legenda automática erra muito). */
  ferramenta: string;
  fabricante: string;
  categoria: Categoria;
  nivel: Nivel;
  acesso: Acesso;
  /** Tempo total de leitura, ex.: "8 min". */
  duracao: string;
  /** Vira a meta description. Até ~160 chars. */
  resumo: string;
  publicadoEm: string;
  linkOficial: string;
  /** Verdadeiro quando o segmento era publicidade no vídeo de origem. */
  patrocinado?: boolean;
  fonte: Fonte;
  oQueE: string[];
  porQueImporta: string[];
  aulas: Aula[];
  praQuemServe: string[];
  /** O que a ferramenta ainda NÃO faz. Sem isto a página vira folheto. */
  limites: string[];
  ficha: Array<{ rotulo: string; valor: string }>;
  /** Links internos. Página nova sem eles piora o índice, não melhora. */
  proximosPassos: Array<{ texto: string; href: string }>;
}
