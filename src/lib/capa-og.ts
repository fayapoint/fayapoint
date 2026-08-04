/**
 * O cartão de compartilhamento do curso, feito a partir da capa.
 *
 * Até 04/08/2026 os 27 cursos declaravam `seo.ogImage = "/images/courses/<slug>-og.jpg"`
 * e **nenhum desses arquivos existia** — `ls public/images/courses/*-og.jpg` dava
 * zero. Na prática, todo link de curso colado no WhatsApp, no LinkedIn ou no
 * Telegram caía no OG genérico do site: 27 páginas de produto dividindo a mesma
 * miniatura, o que é o mesmo que não ter miniatura.
 *
 * Agora que a capa é um livro fotográfico com o título gravado, ela mesma é o
 * cartão. O Cloudinary faz o enquadramento na entrega, sem gerar arquivo novo:
 *
 * - `c_pad` encaixa o retrato 720×1040 inteiro dentro do 1200×630 e completa as
 *   laterais — nada de corte. O `c_fill` foi testado e é inaceitável: ele amplia
 *   tanto que sobra meia palavra do título ocupando a tela toda.
 * - `b_rgb:0c0e1d` é o navy da marca. O `b_blurred` do Cloudinary seria mais
 *   bonito, mas esta conta responde `400 Invalid color name blurred` — não está
 *   no plano.
 * - `f_jpg` porque nem todo rastreador de preview lê webp.
 */
const RECORTE_OG = "f_jpg,w_1200,h_630,c_pad,b_rgb:0c0e1d";

export function ogDaCapa(thumbnail?: string | null): string | undefined {
  if (!thumbnail) return undefined;
  // Só sabemos transformar o que está no Cloudinary; qualquer outra origem passa
  // direto e o chamador decide.
  const i = thumbnail.indexOf("/image/upload/");
  if (!thumbnail.startsWith("https://res.cloudinary.com/") || i === -1) {
    return thumbnail.startsWith("http") ? thumbnail : undefined;
  }
  const corte = i + "/image/upload/".length;
  return `${thumbnail.slice(0, corte)}${RECORTE_OG}/${thumbnail.slice(corte)}`;
}
