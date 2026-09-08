"use client";

import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { FUNDO, LIMA, bebas } from "@/lib/game/tema";

/**
 * AS CENAS DO WINNERS 22 — a arte da seção, num lugar só. 08/09/2026.
 *
 * ## Por que um componente e não `<img>` solto em cada página
 *
 * Onze imagens foram geradas juntas para formarem UMA linguagem: mesmo preto
 * azulado de fundo, mesma lima (#a3e635) como única fonte de luz, mesma névoa
 * volumétrica, e a marca FayAi nascida DENTRO da cena — cortada na grama,
 * gravada na base do troféu, cunhada no selo, estampada na parede do túnel.
 *
 * Espalhar `<img>` por quatro arquivos faria essa unidade durar até a primeira
 * pessoa que precisasse de uma imagem nova e escolhesse pelo nome do arquivo.
 * Com o catálogo aqui, quem procura arte vê o conjunto e escolhe dentro dele.
 *
 * ## O véu não é enfeite
 *
 * Toda cena vai atrás de texto em algum momento. O gradiente para o `FUNDO`
 * existe para a leitura sobreviver à imagem — e é sempre para a cor de fundo
 * da seção, nunca um "escurecer tudo" genérico, que suja a lima e faz a arte
 * parecer um plano de fundo de PowerPoint.
 */

/** O catálogo. Nome semântico, não nome de arquivo. */
export const CENAS = {
  /** Campo aéreo com a marca cortada na grama. Herói de página. */
  campo: "/game/w22/pitch-aereo.webp",
  /** Controle com a marca em relevo. Convite a jogar. */
  controle: "/game/w22/controle.webp",
  /** Troféu com a marca gravada na base. Recompensa. */
  trofeu: "/game/w22/trofeu.webp",
  /** Fichas em queda, uma delas marcada. A mesa. */
  fichas: "/game/w22/fichas.webp",
  /** Rastros de luz subindo e caindo, com a marca projetada na névoa. A odd. */
  luzGrafico: "/game/w22/luz-grafico.webp",
  /** Corredor que se divide em dois. A escolha. */
  corredor: "/game/w22/corredor.webp",
  /** Duas equipes frente a frente no círculo central. O confronto. */
  duelo: "/game/w22/duelo.webp",
  /** Selo hexagonal com a marca cunhada. A prova de honestidade. */
  selo: "/game/w22/selo.webp",
  /** Campo vazio depois do jogo, refletor aceso. A súmula. */
  posJogo: "/game/w22/pos-jogo.webp",
  /** Estúdio de transmissão com a marca em neon. A copa. */
  estudio: "/game/w22/estudio.webp",
  /** Túnel do estádio com a marca na parede. A entrada em campo. */
  tunel: "/game/w22/tunel.webp",
  /** Constelação de nós desenhando a marca. O dado. */
  constelacao: "/game/w22/constelacao.webp",
} as const;

export type NomeDaCena = keyof typeof CENAS;

/**
 * Uma faixa de cena com texto por cima.
 *
 * `prioridade` marca a imagem que abre a página — só ela, porque marcar todas
 * é o mesmo que não marcar nenhuma e ainda atrasa a que importa.
 *
 * ## `href` não é opcional por preguiça — é uma regra de tela
 *
 * Uma faixa COM TÍTULO no meio de uma grade de cartões clicáveis **parece um
 * cartão**. Se ela não levar a lugar nenhum, a pessoa clica e nada acontece —
 * e a conclusão dela não é "essa parte é decorativa", é "o site está
 * quebrado". Foi exatamente o que aconteceu: três faixas tituladas entraram no
 * hub ao lado dos cinco cartões, e o Ricardo relatou clique morto.
 *
 * A regra que fica: **faixa com título tem `href`; faixa sem `href` não tem
 * título.** Textura pode ser muda; manchete, não.
 */
export function FaixaDeCena({
  cena,
  alt,
  titulo,
  linha,
  altura = "h-56 sm:h-72",
  prioridade = false,
  href,
  locale,
  children,
}: {
  cena: NomeDaCena;
  alt: string;
  titulo?: string;
  linha?: string;
  altura?: string;
  prioridade?: boolean;
  /** Para onde a faixa leva. Obrigatório na prática quando há `titulo`. */
  href?: string;
  locale?: string;
  children?: React.ReactNode;
}) {
  const conteudo = (
    <div className={`relative h-full overflow-hidden rounded-2xl ${href ? "" : altura}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática; o otimizador não acrescenta nada a um webp já dimensionado */}
      <img
        src={CENAS[cena]}
        alt={alt}
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : "auto"}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* O véu, para a cor da seção — nunca um preto genérico. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${FUNDO} 4%, ${FUNDO}cc 32%, ${FUNDO}33 70%, transparent 100%)`,
        }}
      />
      {(titulo || linha || children) && (
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          {titulo && (
            <p style={bebas} className="text-2xl uppercase leading-tight tracking-wide sm:text-3xl">
              {titulo}
            </p>
          )}
          {linha && <p className="mt-1 max-w-xl text-sm text-white/65">{linha}</p>}
          {/* A seta só aparece quando a faixa REALMENTE leva a algum lugar.
              É o sinal que faltava: sem ela, clicável e decorativo eram
              indistinguíveis. */}
          {href && (
            <span
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: LIMA }}
            >
              abrir
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          )}
          {children}
        </div>
      )}
    </div>
  );

  if (!href) return conteudo;

  return (
    <Link
      href={href}
      locale={locale}
      className={`group block ${altura} transition duration-200 hover:-translate-y-0.5`}
    >
      {conteudo}
    </Link>
  );
}

/**
 * Cena decorativa de fundo, atrás de um bloco de conteúdo.
 *
 * `aria-hidden` e opacidade baixa: ela é textura, não informação. Uma imagem
 * decorativa anunciada ao leitor de tela é ruído para quem não a vê.
 */
export function FundoDeCena({
  cena,
  opacidade = 0.22,
}: {
  cena: NomeDaCena;
  opacidade?: number;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática */}
      <img
        src={CENAS[cena]}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        style={{ opacity: opacidade }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to right, ${FUNDO} 10%, ${FUNDO}aa 55%, transparent 100%)` }}
      />
    </div>
  );
}
