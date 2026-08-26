import { TRABALHOS, TOTAL_TOCAVEIS } from "@/dados/casos";
import { casosDoIdioma } from "@/dados/casos-idioma";
import { GaleriaCasos } from "@/components/casos/GaleriaCasos";

/**
 * /casos — o portfólio real de Ricardo Faya, de 1992 a hoje.
 *
 * ── O que esta página era até 21/08/2026 ───────────────────────────────────
 *
 * Sete cases INVENTADOS: "Atlas Seguros — Operação de Suporte com IA",
 * "Aurora Educação — Tutor AI", "Flux Orchestrator", "Omni Commerce",
 * "Talent Scout", "Cortex Command", "Lumina Experience". Nenhum cliente
 * daqueles existe. As métricas do topo também eram invenção: "68+ projetos
 * entregues", "42 dias para ROI", "210+ processos automatizados". E os
 * depoimentos idem.
 *
 * ── O que ela é agora ──────────────────────────────────────────────────────
 *
 * 32 trabalhos que aconteceram, tirados de sete currículos e de 360 vídeos do
 * canal dele. Cada trabalho carrega o campo `prova` dizendo se a informação
 * veio do currículo, do acervo, ou dos dois — e a página mostra isso ao leitor
 * num "De onde saiu" em cada estação.
 *
 * ── Por que é Server Component com uma ilha ────────────────────────────────
 *
 * O texto (que é o que o Google lê e o que o visitante veio ler) é servido no
 * HTML. A interação — cena WebGL, moviola, trilha, vídeos — mora numa única
 * ilha cliente. Ver `GaleriaCasos`.
 *
 * ⚠️ O conteúdo é biográfico. Até 26/08/2026 ele saía em PORTUGUÊS na árvore
 * inglesa — 36 trechos, ou seja a página toda (item 12 do laudo): o cromo do
 * site é traduzido por `next-intl`, e o dossiê não vem de `messages/`. Agora
 * passa por `casosDoIdioma`, que junta `casos.en.json` campo a campo e cai no
 * português quando a tradução falta. Título de vídeo, nome de instituição e
 * cidade seguem em português DE PROPÓSITO — são registro, não texto de tela.
 *
 * ⚠️ Título e descrição NÃO saem daqui. Saem de `ROUTE_SEO["/casos"]` em
 * `src/lib/metadata.ts`, pelo `generateMetadata` do `layout.tsx` ao lado — que
 * é quem sabe o locale e escreve a canônica certa. Exportar `metadata` nesta
 * página sobrescreveria os dois com uma canônica travada em pt-BR.
 */

/** Dados estruturados: cada trabalho vira um `CreativeWork` do currículo. */
function esquema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Ricardo Antonio de Freitas Faya",
      jobTitle: "Editor de vídeo e criador",
      url: "https://fayai.com.br/pt-BR/casos",
      sameAs: ["https://www.linkedin.com/in/ricardo-faya-04555a"],
      hasOccupation: TRABALHOS.filter((t) => t.destaque).map((t) => ({
        "@type": "Occupation",
        name: t.papel,
        occupationLocation: { "@type": "City", name: t.cidade },
      })),
    },
    hasPart: TRABALHOS.map((t) => ({
      "@type": "CreativeWork",
      name: t.titulo,
      abstract: t.linha,
      dateCreated: t.inicio,
      creator: { "@type": "Person", name: "Ricardo Faya" },
      locationCreated: { "@type": "Place", name: t.cidade },
    })),
  };
}

export default async function PaginaCasos({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { atos, trabalhos } = casosDoIdioma(locale);
  return (
    <>
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(esquema()) }}
      />
      <GaleriaCasos atos={atos} trabalhos={trabalhos} totalVideos={TOTAL_TOCAVEIS} />
    </>
  );
}
