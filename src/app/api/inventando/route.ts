import { NextResponse } from "next/server";
import { microcursosOrdenados, capaDe } from "@/data/microcursos";

/**
 * Índice dos microcursos, em JSON — a porta pela qual o Mission Control enxerga
 * a seção `/inventando`.
 *
 * Por que existe: os microcursos moram em arquivo TypeScript (ver o comentário
 * em `data/microcursos/tipos.ts` — conteúdo indexável não pode vir do cliente).
 * O Mission Control é outro projeto, com outro deploy, e não consegue importar
 * esse módulo. Sem esta rota ele só poderia raspar o HTML da página, que quebra
 * na primeira mudança de layout.
 *
 * ⚠️ Devolve METADADOS e MEDIDAS, nunca o corpo das aulas. Não é economia de
 * banda: `/api/` está sob `Disallow` no robots.txt, então tudo que sai por aqui
 * é invisível para o Google. Servir o conteúdo da aula por esta rota seria
 * recriar o soft 404 de 28/07/2026, quando 20 páginas de curso buscavam o texto
 * no cliente e o robô recebia 624 caracteres iguais em todas.
 *
 * Público de propósito: não expõe nada que a página já não mostre, e um portão
 * aqui só criaria um segredo para o Mission Control guardar.
 */
export const dynamic = "force-static";

export function GET() {
  const itens = microcursosOrdenados.map((m) => {
    const aulas = m.aulas.length;

    // Conta o que a PÁGINA mostra, não só as aulas.
    //
    // A primeira versão somava apenas `aulas.secoes` e acusava as 16 páginas
    // de terem menos de 500 palavras. Duas coisas estavam erradas: metade do
    // texto renderizado (o que é, por que importa, pra quem serve, limites,
    // ficha) ficava de fora da conta, e o corte de 500 ignorava que o
    // microcurso é curto POR DECISÃO — "gratuito e curto" foi o pedido. Um
    // painel que acusa todas as páginas não prioriza nada.
    const textoDasAulas = m.aulas.flatMap((aula) =>
      aula.secoes.map((s) => (s.tipo === "lista" || s.tipo === "passos" ? s.itens.join(" ") : s.texto)),
    );
    const textoDaPagina = [
      ...textoDasAulas,
      ...m.oQueE,
      ...m.porQueImporta,
      ...m.praQuemServe,
      ...m.limites,
      ...m.ficha.map((f) => `${f.rotulo} ${f.valor}`),
      m.resumo,
      m.subtitulo,
    ];
    const contar = (partes: string[]) => partes.join(" ").split(/\s+/).filter(Boolean).length;
    const palavras = contar(textoDaPagina);

    return {
      slug: m.slug,
      titulo: m.titulo,
      subtitulo: m.subtitulo,
      ferramenta: m.ferramenta,
      fabricante: m.fabricante,
      categoria: m.categoria,
      nivel: m.nivel,
      acesso: m.acesso,
      duracao: m.duracao,
      resumo: m.resumo,
      publicadoEm: m.publicadoEm,
      patrocinado: Boolean(m.patrocinado),
      capa: capaDe(m),
      url: `/inventando/${m.slug}`,
      urlCompleto: `/inventando/${m.slug}/completo`,
      // ⚠️ A fonte NÃO sai daqui. Havia um bloco com videoId, canal, capítulo e
      // timestamp — útil para o painel e desastroso para o negócio: esta rota é
      // pública (sem portão, porque não expõe nada além do que a página mostra),
      // e a fonte é justamente o que a página deixou de mostrar em 03/08/2026.
      // Publicá-la em JSON seria mais fácil de raspar do que no HTML.
      // As medidas que o Mission Control usa para apontar problema. Ficam aqui,
      // e não lá, porque dependem da forma do dado — se `Aula` mudar, quem
      // quebra é este arquivo, no mesmo repositório da mudança.
      medidas: {
        aulas,
        palavras,
        // A 1ª aula é a página pública e gratuita; as outras vivem atrás do
        // portão. Microcurso com uma aula só não tem o que vender.
        aulasPagas: Math.max(0, aulas - 1),
        tamanhoResumo: m.resumo.length,
        oQueE: m.oQueE.length,
        porQueImporta: m.porQueImporta.length,
        limites: m.limites.length,
        ficha: m.ficha.length,
        linksInternos: m.proximosPassos.length,
      },
    };
  });

  return NextResponse.json({
    total: itens.length,
    geradoEm: new Date().toISOString(),
    itens,
  });
}
