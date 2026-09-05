"use client";

/**
 * A LENTE — agora sobre o capítulo de verdade.
 *
 * ## O que mudou, e por que importa
 *
 * A primeira lente desenhava a própria coluna a partir da linha do tempo: só
 * texto, sem as imagens do capítulo, sem a formatação, sem a arte. Funcionava,
 * mas era um PAINEL que substituía a leitura — não uma lente.
 *
 * Esta enxerga o que já está na página. `acharFaixas` descobre onde cada frase
 * narrada mora no Markdown renderizado — SEM alterar o DOM — e daqui para a
 * frente tudo é realce nativo sobre essas faixas mais uma rolagem que segue o
 * áudio.
 *
 * Consequência prática: ligar a lente no meio do capítulo não muda nada de
 * lugar. As imagens continuam onde estavam, o que você estava lendo continua
 * onde estava, e a frase que toca acende ali mesmo.
 *
 * ## As três decisões que sustentam o resto
 *
 * 1. **O realce é PINTADO SOBRE a página, não construído nela.** Nada é
 *    redesenhado e nada é envolvido: o DOM continua exatamente como o React o
 *    deixou. Envolver era o desenho anterior, e derrubava a página inteira ao
 *    trocar de capítulo — ver `lente-realce.ts`.
 * 2. **A rolagem persegue, não salta.** O destino é interpolado pelo progresso
 *    dentro da frase e alcançado por amortecimento — o texto desliza devagar em
 *    vez de pular de dez em dez segundos.
 * 3. **Verde é o que já passou, azul é o que vem.** Sublinhado, não fundo: num
 *    capítulo inteiro colorido, fundo vira mancha e cansa; a linha embaixo lê
 *    como progresso.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpToLine,
  Bookmark,
  Focus,
  ChevronDown,
  Gauge,
  Highlighter,
  ListTree,
  Loader2,
  Lock,
  LockOpen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Scissors,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  acharFaixas,
  acharTrecho,
  limparRealces,
  publicarRealces,
  temRealceNativo,
  type Faixas,
} from "@/lib/lente-realce";
import { andar, moldura, ouvirRolagem, porTopo, quemRola, topoDe } from "@/lib/rolagem";
import type { LinhaDoTempo } from "@/components/portal/LenteDeLeitura";

/** Onde a frase atual pousa: acima do meio, para o que vem a seguir caber. */
const ANCORA = 0.38;
const VELOCIDADES = [0.75, 1, 1.25, 1.5, 1.75] as const;
const PULO = 15;
const ZOOM_MIN = 1;
const ZOOM_MAX = 1.6;
/**
 * ── A LENTE ABRE AUMENTANDO ──────────────────────────────────────────────
 *
 * O padrão era 1,0: ligar a lente não mudava um pixel do tamanho do texto, e
 * o controle de aumento morava atrás de um ícone de ajustes. O Ricardo abriu,
 * olhou e disse "não vi nada aumentado" — e estava certo, porque não havia.
 *
 * 1,18 é o passo que se NOTA sem reflowar o capítulo a ponto de desorientar
 * quem estava lendo. Quem preferir o tamanho original desce no A− e a
 * preferência fica gravada.
 */
const ZOOM_PADRAO = 1.18;
const PASSO_ZOOM = 0.06;
const CHAVE_PREFS = "fayapoint_lente_v2";

function tempoHumano(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function acharFala(falas: LinhaDoTempo["falas"], t: number): number {
  let lo = 0, hi = falas.length - 1, achado = -1;
  while (lo <= hi) {
    const meio = (lo + hi) >> 1;
    if (t < falas[meio].de) hi = meio - 1;
    else { achado = meio; lo = meio + 1; }
  }
  return achado;
}

export default function LenteSobreposta({
  conteudoRef,
  rolagemRef,
  src,
  linhaDoTempo,
  chave,
  aoFechar,
  T = (s: string) => s,
  maximoInicial = -1,
  aoAvancar,
  capitulo,
  temAnterior = false,
  temProximo = false,
  proximoTemAudio = false,
  irParaCapitulo,
  cursoSlug,
  tituloDoCapitulo,
}: {
  /** O container do Markdown renderizado — é nele que as falas são marcadas. */
  conteudoRef: React.RefObject<HTMLElement | null>;
  /** Quem rola de verdade (o `<main>` do leitor). */
  rolagemRef: React.RefObject<HTMLElement | null>;
  src?: string | null;
  linhaDoTempo: LinhaDoTempo;
  chave?: string;
  aoFechar?: () => void;
  T?: (s: string) => string;
  /** Fase 2 — até onde este aluno já chegou neste capítulo (índice de fala). */
  maximoInicial?: number;
  /** Fase 2 — avisa o leitor para gravar. Já vem estrangulado por aqui. */
  aoAvancar?: (fala: number, de: number, capitulo: number) => void;
  /** O NÚMERO do capítulo aberto — vai junto na gravação. Ver `gravarPosicao`. */
  capitulo?: number | null;
  /** Fase 3 — navegação de capítulo, para a barra ser uma só. */
  temAnterior?: boolean;
  temProximo?: boolean;
  proximoTemAudio?: boolean;
  irParaCapitulo?: (direcao: -1 | 1) => void;
  /** Fase 4 — para o tutor saber de onde veio o trecho. */
  cursoSlug?: string;
  tituloDoCapitulo?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const faixasRef = useRef<Faixas | null>(null);
  /** Os grifos deste capítulo, já achados no texto. */
  const grifosRef = useRef<Range[]>([]);
  const ignorarAte = useRef(0);

  const [tocando, setTocando] = useState(false);
  const [agora, setAgora] = useState(0);
  const [atual, setAtual] = useState(-1);
  const [maximo, setMaximo] = useState(maximoInicial);
  const [seguindo, setSeguindo] = useState(true);
  const [velocidade, setVelocidade] = useState(1);
  const [zoom, setZoom] = useState(ZOOM_PADRAO);
  const [volume, setVolume] = useState(1);
  const [painelAberto, setPainelAberto] = useState(false);
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [casadas, setCasadas] = useState<number | null>(null);

  // ── Fase 3: continuar no capítulo seguinte ───────────────────────────────
  const [emSequencia, setEmSequencia] = useState(true);
  const ultimoGravado = useRef(-1);
  /** O `maximoInicial` mais recente, sem virar dependência de efeito nenhum. */
  const maximoInicialRef = useRef(maximoInicial);
  maximoInicialRef.current = maximoInicial;
  /**
   * Estas seguem o render sem guarda nenhuma — são o capítulo ATUAL. Servem só
   * para o efeito de reinício repor o retrato depois da descarga; o retrato em
   * si tem a guarda de chave, e é ele que a gravação usa.
   */
  const falasRef = useRef<LinhaDoTempo["falas"]>(linhaDoTempo.falas);
  const capituloRef = useRef(capitulo);
  const aoAvancarRef = useRef(aoAvancar);
  const continuarAoCarregar = useRef(false);
  /** Quem entrou em sequência começa do zero — não de onde parou da outra vez. */
  const pularRetomada = useRef(false);

  // ── Fase 4: selecionar e conversar ───────────────────────────────────────
  const [selecao, setSelecao] = useState<{ texto: string; x: number; y: number } | null>(null);
  const [tutor, setTutor] = useState<{
    trecho: string;
    pedido: string;
    resposta: string | null;
    erro: string | null;
  } | null>(null);
  const [pensando, setPensando] = useState(false);
  const [guardados, setGuardados] = useState<string[]>([]);
  const [guardadosAbertos, setGuardadosAbertos] = useState(false);
  const [foco, setFoco] = useState(true);
  const retomarDepois = useRef(false);

  const falas = linhaDoTempo.falas;
  const total = linhaDoTempo.segundos || 0;
  const comAudio = !!src;

  falasRef.current = falas;
  capituloRef.current = capitulo;
  aoAvancarRef.current = aoAvancar;

  const semAnimacao = useMemo(
    () => typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // ── Achar onde cada fala mora, e apagar o realce ao sair ─────────────────
  //
  // ⚠️ NADA AQUI MUDA O DOM. A versão anterior envolvia cada frase num `<span>`
  // e isso derrubava a página: o DOM é do React, e ao trocar de capítulo ele
  // chamava `removeChild` num nó que tinha mudado de pai
  // ("Application error", tela branca). Ver o cabeçalho de `lente-realce.ts`.
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;
    const r = acharFaixas(raiz, falas.map((f) => ({ i: f.i, texto: f.texto })));
    faixasRef.current = r;
    setCasadas(r.casadas);
    return () => { limparRealces(); faixasRef.current = null; grifosRef.current = []; };
  }, [conteudoRef, falas, chave]);

  // ── TROCAR DE CAPÍTULO ZERA O RELÓGIO, NÃO A MEMÓRIA ─────────────────────
  //
  // `atual` e `agora` são do capítulo que saiu e não querem dizer nada no que
  // entrou. `maximo` não zera: ele volta a ser o que o servidor sabe deste
  // capítulo — é isso que faz o verde aparecer já pintado ao voltar.
  //
  // ⚠️ A LISTA DE DEPENDÊNCIAS É SÓ `chave`, DE PROPÓSITO. `maximoInicial` vem
  // de um `useMemo` sobre o mapa de posições, e esse mapa é reescrito a cada
  // gravação — pôr `maximoInicial` aqui faria a lente ZERAR A FRASE ATUAL no
  // meio da narração, uma vez a cada gravação do próprio progresso.
  useEffect(() => {
    setAtual(-1);
    setAgora(0);
    setMaximo(maximoInicialRef.current);
    ultimoGravado.current = -1;   // outro capítulo, outra régua de gravação
    // A descarga do capítulo anterior já rodou (limpeza vem antes do corpo).
    // Agora o retrato pode passar a descrever o capítulo que entrou.
    despachoRef.current = {
      chave,
      maximo: maximoInicialRef.current,
      total: falasRef.current.length,
      capitulo: capituloRef.current,
      aoAvancar: aoAvancarRef.current,
    };
    setSelecao(null);
    setTutor(null);
  }, [chave]);

  // O progresso do servidor chega DEPOIS do capítulo (é uma requisição). Este
  // efeito é o que faz o verde aparecer quando ele chega — e ele só sobe,
  // nunca desce, para não desfazer o que o relógio já pintou.
  useEffect(() => {
    if (maximoInicial < 0) return;
    setMaximo((m) => (maximoInicial > m ? maximoInicial : m));
  }, [maximoInicial]);

  // ── Fase 2: gravar até onde chegou, sem afogar a rede ────────────────────
  //
  // O relógio mexe em `maximo` a cada frase — umas doze por minuto. Uma
  // requisição por frase seria absurdo, e nenhuma requisição perderia tudo de
  // quem fecha a aba no meio. Então: espera 4 s de quietude, e grava também ao
  // sair da página.
  //
  // ⚠️ O QUE GRAVAR SAI DE UMA REF, NÃO DAS DEPENDÊNCIAS. A primeira versão
  // punha `maximo` na lista do efeito do `pagehide` e gravava na limpeza — só
  // que a limpeza roda a CADA mudança de dependência, então gravava uma vez por
  // frase e a estrangulação não valia nada.
  // ⚠️ O RETRATO SÓ É ATUALIZADO ENQUANTO A CHAVE NÃO MUDA.
  //
  // Sem esta guarda, `maximo` e `capitulo` vêm do MESMO render e mesmo assim
  // pertencem a capítulos diferentes durante a troca: o React já renderizou o
  // capítulo novo, mas `maximo` ainda é o do que acabou (o fim da narração
  // acabou de marcá-lo como lido inteiro). A gravação pendente saía como
  // "capítulo 2 ouvido até o fim" cinco segundos depois de ele começar —
  // medido, com o capítulo 2 inteiro verde sem ninguém ter ouvido.
  //
  // Enquanto a chave difere, o retrato fica intacto: ele descreve o capítulo
  // que saiu, que é exatamente o que a gravação pendente precisa gravar. Quem
  // o repõe para o capítulo novo é o efeito de reinício, logo depois da
  // descarga.
  const despachoRef = useRef({ chave, maximo, total: falas.length, capitulo, aoAvancar });
  if (despachoRef.current.chave === chave) {
    despachoRef.current = { chave, maximo, total: falas.length, capitulo, aoAvancar };
  }

  const gravarPosicao = useCallback(() => {
    const d = despachoRef.current;
    if (!d.aoAvancar || d.capitulo == null) return;
    if (d.maximo < 0 || d.total === 0 || d.maximo <= ultimoGravado.current) return;
    ultimoGravado.current = d.maximo;
    // O capítulo vai JUNTO. Na troca de aula o React já renderizou a nova antes
    // de os efeitos rodarem; sem carregar o número, a posição do capítulo que
    // saiu seria gravada em cima da do que entrou.
    d.aoAvancar(d.maximo, d.total, d.capitulo);
  }, []);

  useEffect(() => {
    if (maximo < 0 || maximo <= ultimoGravado.current) return;
    const id = setTimeout(gravarPosicao, 4000);
    return () => clearTimeout(id);
  }, [maximo, gravarPosicao]);

  useEffect(() => {
    window.addEventListener("pagehide", gravarPosicao);
    // A limpeza roda ao sair da lente e ao trocar de capítulo — e só nessas
    // duas horas, porque a única dependência que muda é a `chave`.
    return () => { window.removeEventListener("pagehide", gravarPosicao); gravarPosicao(); };
  }, [chave, gravarPosicao]);

  // ── O relógio ────────────────────────────────────────────────────────────
  //
  // ⚠️ DOIS RELÓGIOS, E O SEGUNDO NÃO É LUXO.
  //
  // `requestAnimationFrame` PARA quando a aba fica escondida — e ouvir
  // audiobook com a tela apagada é o uso principal, não a exceção. Só com o
  // rAF, quem ouvisse um capítulo inteiro no bolso voltaria com a lente
  // exatamente onde deixou: nada verde, nada gravado.
  //
  // `timeupdate` continua disparando com a aba escondida (~4 vezes por
  // segundo). Ele é grosso demais para a rolagem parecer contínua, mas é
  // exatamente o suficiente para a frase atual, o verde e a gravação.
  //
  // O rAF fica para o que só importa com a tela acesa: o número do tempo
  // correndo e a interpolação da perseguição.
  useEffect(() => {
    if (!comAudio) return;
    const bater = () => {
      const a = audioRef.current;
      if (!a) return;
      setAgora(a.currentTime);
      const i = acharFala(falas, a.currentTime);
      setAtual((ant) => (ant === i ? ant : i));
      setMaximo((m) => (i > m ? i : m));
    };

    let vivo = true, quadro = 0;
    const passo = () => { if (!vivo) return; bater(); quadro = requestAnimationFrame(passo); };
    quadro = requestAnimationFrame(passo);

    const a = audioRef.current;
    a?.addEventListener("timeupdate", bater);
    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      a?.removeEventListener("timeupdate", bater);
    };
  }, [falas, comAudio, src]);

  // ── O realce, pintado pelo navegador ─────────────────────────────────────
  //
  // Três conjuntos de faixas por vez. Refazê-los é barato (é montar arrays), e
  // acontece só quando a frase atual ou a fronteira do verde muda — não a cada
  // quadro.
  useEffect(() => {
    const m = faixasRef.current;
    if (!m) return;
    const lidas: Range[] = [], porvir: Range[] = [], atuais: Range[] = [];
    const fronteira = Math.max(atual, maximo);
    falas.forEach((f, posicao) => {
      const faixa = m.faixas.get(f.i);
      if (!faixa) return;
      if (posicao === atual) atuais.push(faixa);
      else if (posicao < atual || posicao <= maximo) lidas.push(faixa);
      else if (posicao > fronteira) porvir.push(faixa);
    });
    publicarRealces({
      "lente-lida": lidas,
      // ── O AZUL SÓ EXISTE QUANDO O FOCO NÃO EXISTE ──────────────────────
      //
      // "sublinhado azul no que ainda não foi lido" era o pedido, e literalmente
      // atendido ele pinta o capítulo INTEIRO de risco: o não lido é quase todo
      // o texto quase sempre, e a página vira formulário — foi o que o Ricardo
      // viu na tela.
      //
      // Com o modo foco ligado, quem diz "ainda não" é o recuo de contraste, que
      // é mais forte e não risca nada. Os dois juntos são redundantes e feios.
      // Desligando o foco, o azul volta a ser a única marca e reaparece.
      "lente-porvir": foco ? [] : porvir,
      "lente-atual": atuais,
      "lente-guardado": grifosRef.current,
    });
  }, [atual, maximo, falas, casadas, foco]);

  // ── A rolagem que persegue ───────────────────────────────────────────────
  useEffect(() => {
    // Perseguir a narração enquanto o aluno arrasta o dedo sobre um parágrafo
    // arranca a seleção da mão dele. Enquanto há seleção ou resposta na tela,
    // a página fica parada.
    //
    // ⚠️ E SÓ PERSEGUE ENQUANTO TOCA. Sem `tocando`, a perseguição continuava
    // rodando com o áudio pausado e puxava a página de volta para a frase atual
    // — quem pausava para reler o parágrafo de cima era arrastado de volta, e o
    // botão de voltar ao topo era desfeito no quadro seguinte (medido: a página
    // ficava cravada em 977 px).
    if (!comAudio || !tocando || !seguindo || semAnimacao || selecao || tutor) return;
    let vivo = true, quadro = 0;
    const passo = () => {
      const rol = rolagemRef.current;
      const a = audioRef.current;
      const m = faixasRef.current;
      if (!rol || !a || !m || atual < 0) { if (vivo) quadro = requestAnimationFrame(passo); return; }

      const alvo = m.faixas.get(falas[atual]?.i);
      if (!alvo) { if (vivo) quadro = requestAnimationFrame(passo); return; }

      const quem = quemRola(rol);
      const mold = moldura(quem);
      const ondePousa = (faixa: Range) => {
        const r = faixa.getBoundingClientRect();
        return topoDe(quem) + (r.top - mold.topo) + r.height / 2 - mold.altura * ANCORA;
      };

      const f = falas[atual];
      const dur = Math.max(0.001, (f.ate ?? 0) - (f.de ?? 0));
      const dentro = Math.min(1, Math.max(0, (a.currentTime - (f.de ?? 0)) / dur));
      const seguinte = m.faixas.get(falas[atual + 1]?.i);

      const destino = seguinte
        ? ondePousa(alvo) + (ondePousa(seguinte) - ondePousa(alvo)) * dentro
        : ondePousa(alvo);

      const falta = Math.max(0, destino) - topoDe(quem);
      if (Math.abs(falta) > 0.5) {
        ignorarAte.current = Date.now() + 400;
        andar(quem, falta * 0.08);
      }
      if (vivo) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => { vivo = false; cancelAnimationFrame(quadro); };
  }, [comAudio, tocando, seguindo, semAnimacao, atual, falas, rolagemRef, selecao, tutor]);

  // Rolar com o dedo solta o seguimento — a lente não briga pelo scroll.
  useEffect(() => {
    const rol = rolagemRef.current;
    if (!comAudio) return;
    const aoRolar = () => {
      if (!seguindo || Date.now() < ignorarAte.current) return;
      setSeguindo(false);
    };
    return ouvirRolagem(quemRola(rol), aoRolar);
  }, [rolagemRef, seguindo, comAudio]);

  // ── SEM ÁUDIO, QUEM DÁ O FOCO É A ROLAGEM ───────────────────────────────
  //
  // No modo leitura não existe relógio, então `atual` ficaria em -1 para
  // sempre e nada acenderia — a lente viraria só um sublinhado azul parado. A
  // frase mais próxima da linha de âncora entra em foco: é o gesto que o
  // leitor já faz, com o dedo no lugar do relógio.
  useEffect(() => {
    const rol = rolagemRef.current;
    if (comAudio) return;

    const focar = () => {
      const m = faixasRef.current;
      if (!m) return;
      const mold = moldura(quemRola(rol));
      const alvoY = mold.topo + mold.altura * ANCORA;
      let melhor = -1, menor = Infinity;
      for (let i = 0; i < falas.length; i++) {
        const faixa = m.faixas.get(falas[i].i);
        if (!faixa) continue;
        const r = faixa.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - alvoY);
        if (d < menor) { menor = d; melhor = i; }
      }
      if (melhor >= 0) {
        setAtual((ant) => (ant === melhor ? ant : melhor));
        setMaximo((mx) => (melhor > mx ? melhor : mx));
      }
    };

    focar();
    return ouvirRolagem(quemRola(rol), focar);
  }, [rolagemRef, comAudio, falas, casadas]);

  /**
   * ── Zoom da coluna: é o "aumenta a área que estou" ───────────────────────
   *
   * ⚠️ TEM DE SER ESTILO INLINE, NÃO CLASSE.
   *
   * O leitor escreve `style={{ fontSize: settings.fontSize + "px" }}` no
   * container da prosa — é assim que o aluno escolhe o corpo do texto. Estilo
   * inline VENCE regra de folha de estilo, então a `.lente-ativa { font-size:
   * calc(1em * var(--lente-zoom)) }` que eu tinha escrito era calculada e
   * jogada fora. O aumento existia no código e não existia na tela: o Ricardo
   * abriu e disse "não vi nada aumentado", e não havia mesmo.
   *
   * A base é lida UMA vez por capítulo e guardada. Sem isso, cada mudança de
   * aumento multiplicaria em cima do valor já aumentado e o texto explodiria
   * em três cliques.
   */
  const fonteBase = useRef<number | null>(null);
  useEffect(() => { fonteBase.current = null; }, [chave]);

  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;
    const inlineOriginal = raiz.style.fontSize;

    // ⚠️ O REACT REESCREVE ESTE ESTILO DEPOIS DO EFEITO.
    //
    // O leitor carrega as preferências de leitura do `localStorage` num efeito
    // próprio; quando o corpo do texto chega (16 → 17px), o React escreve
    // `style.fontSize` de novo e apaga o aumento — sem erro, sem aviso, e sem
    // que este efeito volte a rodar, porque nem `zoom` nem `chave` mudaram.
    // Foi por isso que a primeira correção do aumento também não apareceu.
    //
    // O observador devolve o aumento sempre que o leitor mexe no corpo, e
    // trata o valor que ele escreveu como a nova base — então mudar o tamanho
    // do texto nas preferências continua funcionando, com o aumento por cima.
    let nosso = "";
    const aplicar = () => {
      if (raiz.style.fontSize !== nosso) {
        fonteBase.current =
          parseFloat(raiz.style.fontSize) || parseFloat(getComputedStyle(raiz).fontSize) || 16;
      }
      const alvo = `${((fonteBase.current ?? 16) * zoom).toFixed(2)}px`;
      if (raiz.style.fontSize !== alvo) { nosso = alvo; raiz.style.fontSize = alvo; }
      else nosso = alvo;
    };

    raiz.style.setProperty("--lente-zoom", String(zoom));
    raiz.classList.add("lente-ativa");
    aplicar();

    const observador = new MutationObserver(aplicar);
    observador.observe(raiz, { attributes: true, attributeFilter: ["style"] });

    return () => {
      observador.disconnect();
      raiz.classList.remove("lente-ativa");
      raiz.style.removeProperty("--lente-zoom");
      raiz.style.fontSize = inlineOriginal;
    };
  }, [conteudoRef, zoom, chave]);

  // ── O foco só recua o resto ENQUANTO a narração corre ────────────────────
  //
  // Apagar o capítulo enquanto o aluno lê no próprio ritmo seria hostil: ali
  // ele quer varrer a página, comparar parágrafos, voltar. O recuo pertence ao
  // momento em que existe uma frase sendo dita — aí sim o resto é ruído.
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;
    const ligado = foco && tocando && comAudio;
    raiz.classList.toggle("lente-foco", ligado);
    return () => { raiz.classList.remove("lente-foco"); };
  }, [conteudoRef, foco, tocando, comAudio]);

  useEffect(() => {
    try {
      const b = localStorage.getItem(CHAVE_PREFS);
      if (!b) return;
      const p = JSON.parse(b) as { zoom?: number; velocidade?: number; volume?: number; emSequencia?: boolean; foco?: boolean };
      if (typeof p.zoom === "number") setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom)));
      if (typeof p.velocidade === "number") setVelocidade(p.velocidade);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
      if (typeof p.emSequencia === "boolean") setEmSequencia(p.emSequencia);
      if (typeof p.foco === "boolean") setFoco(p.foco);
    } catch { /* preferência é conforto, não estado crítico */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHAVE_PREFS, JSON.stringify({ zoom, velocidade, volume })); }
    catch { /* modo privado */ }
  }, [zoom, velocidade, volume]);

  useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = velocidade; }, [velocidade]);
  useEffect(() => { const a = audioRef.current; if (a) a.volume = volume; }, [volume]);

  // Onde parou, por capítulo — trocar de aula e voltar não recomeça do zero.
  const chaveMarca = chave ? `fayapoint_lente_pos_${chave}` : null;
  useEffect(() => {
    if (!chaveMarca) return;
    const a = audioRef.current;
    if (!a) return;
    const retomar = () => {
      // Entrou tocando, vindo do capítulo anterior: começa no começo. Retomar
      // do meio aqui daria a impressão de que a lente pulou um pedaço.
      if (pularRetomada.current) { pularRetomada.current = false; return; }
      try {
        const s = Number(localStorage.getItem(chaveMarca));
        if (s > 1 && a.duration && s < a.duration - 5) a.currentTime = s;
      } catch { /* sem memória, começa do zero */ }
    };
    if (a.readyState >= 1) retomar();
    else a.addEventListener("loadedmetadata", retomar, { once: true });
  }, [chaveMarca]);

  useEffect(() => {
    if (!chaveMarca) return;
    const guardar = () => {
      try {
        const a = audioRef.current;
        if (a && a.currentTime > 1) localStorage.setItem(chaveMarca, String(a.currentTime));
      } catch { /* idem */ }
    };
    const id = setInterval(guardar, 5000);
    window.addEventListener("pagehide", guardar);
    return () => { clearInterval(id); window.removeEventListener("pagehide", guardar); guardar(); };
  }, [chaveMarca]);

  /**
   * ── O FIM DE UM CAPÍTULO NÃO É O FIM DA AULA (Fase 3) ────────────────────
   *
   * O pedido era "ele segue lendo, andando com o curso". O `<audio>` é o mesmo
   * elemento de um capítulo para o outro — a lente não desmonta ao trocar de
   * aula, só o `src` muda —, então continuar é avisar o leitor e marcar que a
   * próxima carga já entra tocando.
   *
   * ⚠️ NÃO PULA CAPÍTULO SEM ÁUDIO. Treze capítulos ainda estão reprovados no
   * portão; saltar por cima deles entregaria um curso com buracos que ninguém
   * veria. A lente avança um capítulo, e se lá não houver narração ela para e
   * diz isso — o aluno lê aquele e segue.
   */
  const aoTerminarCapitulo = useCallback(() => {
    setTocando(false);
    setMaximo(falas.length - 1);      // terminou de ouvir: o capítulo fica verde inteiro
    if (!emSequencia || !temProximo || !irParaCapitulo) return;
    continuarAoCarregar.current = proximoTemAudio;
    pularRetomada.current = proximoTemAudio;
    irParaCapitulo(1);
  }, [emSequencia, temProximo, proximoTemAudio, irParaCapitulo, falas.length]);

  // Chegou o áudio do capítulo seguinte e viemos tocando: continua sozinho.
  useEffect(() => {
    if (!continuarAoCarregar.current || !src) return;
    const a = audioRef.current;
    if (!a) return;
    continuarAoCarregar.current = false;
    const partir = () => { a.currentTime = 0; void a.play().catch(() => { /* o navegador pode recusar */ }); };
    if (a.readyState >= 2) partir();
    else a.addEventListener("canplay", partir, { once: true });
    return () => a.removeEventListener("canplay", partir);
  }, [src]);

  // ── Fase 4: SELECIONAR E CONVERSAR ───────────────────────────────────────
  //
  // O menu nasce da seleção do navegador, não de um modo à parte: o aluno já
  // sabe arrastar o dedo sobre um parágrafo. O que a lente acrescenta é o que
  // fazer com o que ele acabou de separar.
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;

    const olhar = () => {
      const sel = window.getSelection();
      const texto = sel?.toString().trim() ?? "";
      // Curto demais é clique, não seleção. Longo demais estoura o contexto do
      // tutor e deixa de ser "esta parte".
      if (!sel || sel.rangeCount === 0 || texto.length < 12) { setSelecao(null); return; }
      const faixa = sel.getRangeAt(0);
      if (!raiz.contains(faixa.commonAncestorContainer)) { setSelecao(null); return; }
      const r = faixa.getBoundingClientRect();
      if (!r.width && !r.height) { setSelecao(null); return; }
      setSelecao({
        texto: texto.slice(0, 2000),
        x: Math.min(window.innerWidth - 130, Math.max(130, r.left + r.width / 2)),
        y: Math.max(56, r.top),
      });
    };

    const soltar = () => setTimeout(olhar, 10);
    document.addEventListener("mouseup", soltar);
    document.addEventListener("touchend", soltar);
    return () => {
      document.removeEventListener("mouseup", soltar);
      document.removeEventListener("touchend", soltar);
    };
  }, [conteudoRef]);

  /**
   * ── OUVIR E LER AO MESMO TEMPO NÃO FUNCIONA ──────────────────────────────
   *
   * A narração pausa enquanto o tutor responde e volta sozinha depois — o
   * Ricardo já apontou noutro contexto que fica impossível entender o áudio
   * com outra coisa aparecendo na tela. Aqui a regra é a mesma.
   */
  const perguntar = useCallback(async (pedido: "explicar" | "resumir", trecho: string) => {
    setSelecao(null);
    const a = audioRef.current;
    if (a && !a.paused) { retomarDepois.current = true; a.pause(); }

    const rotulo = pedido === "explicar" ? T("Explicar melhor") : T("Resumir isto");
    setTutor({ trecho, pedido: rotulo, resposta: null, erro: null });
    setPensando(true);

    const ordem = pedido === "explicar"
      ? "Explique este trecho do capítulo para um aluno que travou nele. Vá direto ao ponto, use um exemplo concreto, e nao repita o trecho de volta."
      : "Resuma este trecho em ate tres frases curtas, sem perder nenhum numero nem nenhum nome proprio que ele traga.";

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: ordem,
          trecho,
          curso: cursoSlug,
          capitulo: tituloDoCapitulo,
        }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTutor((t) => t && { ...t, erro: dados?.error || T("Não consegui responder agora.") });
      } else {
        setTutor((t) => t && { ...t, resposta: String(dados?.response || "") });
      }
    } catch {
      setTutor((t) => t && { ...t, erro: T("Sem conexão com o tutor.") });
    } finally {
      setPensando(false);
    }
  }, [T, cursoSlug, tituloDoCapitulo]);

  // ── O caderno de trechos ─────────────────────────────────────────────────
  const [caderno, setCaderno] = useState<{ id: string; texto: string; capitulo: string | null }[]>([]);

  useEffect(() => {
    if (!cursoSlug) return;
    let vivo = true;
    fetch(`/api/courses/${cursoSlug}/trechos`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d?.trechos) setCaderno(d.trechos); })
      .catch(() => { /* sem caderno a lente continua inteira */ });
    return () => { vivo = false; };
  }, [cursoSlug]);

  const guardar = useCallback(async (texto: string) => {
    // ── O GRIFO APARECE NO TEXTO, NÃO SÓ NUMA LISTA ────────────────────────
    //
    // "poder destacar uma parte" era metade do pedido. Guardar sem marcar a
    // página deixaria o aluno sem saber o que já grifou da segunda vez que
    // abrisse o capítulo.
    //
    // ⚠️ NADA DE `<mark>`. A versão anterior envolvia a seleção num elemento, o
    // que é o mesmo defeito que derrubava a página na marcação das falas: DOM
    // do React alterado por fora. O grifo agora é uma faixa a mais no realce
    // nativo — o navegador pinta, o DOM não muda.
    const raiz = conteudoRef.current;
    if (raiz) {
      const achada = acharTrecho(raiz, texto);
      if (achada) {
        grifosRef.current = [...grifosRef.current, achada];
        publicarRealces({ "lente-guardado": grifosRef.current });
      }
    }
    window.getSelection()?.removeAllRanges();

    setSelecao(null);
    if (!cursoSlug) return;
    // Aparece na lista ANTES da rede responder: guardar tem de parecer
    // instantâneo, senão o aluno clica duas vezes achando que falhou.
    setGuardados((g) => (g.includes(texto) ? g : [...g, texto]));
    try {
      const res = await fetch(`/api/courses/${cursoSlug}/trechos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texto, capitulo: tituloDoCapitulo }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.id && !d?.repetido) {
        setCaderno((c) => [{ id: d.id, texto, capitulo: tituloDoCapitulo ?? null }, ...c]);
      }
    } catch { /* fica o grifo desta sessão; a próxima tentativa regrava */ }
  }, [cursoSlug, tituloDoCapitulo, conteudoRef]);

  // ── Reacender os grifos deste capítulo ───────────────────────────────────
  //
  // O caderno chega do servidor depois do capítulo, e o aluno volta a uma aula
  // que grifou semanas atrás. Sem isto, o grifo só existiria na sessão em que
  // foi feito — que é o mesmo que não existir.
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz || !tituloDoCapitulo) return;
    const daqui = caderno.filter((t) => t.capitulo === tituloDoCapitulo);
    if (daqui.length === 0) return;
    const achadas: Range[] = [];
    for (const t of daqui) {
      const f = acharTrecho(raiz, t.texto);
      if (f) achadas.push(f);
    }
    grifosRef.current = achadas;
    publicarRealces({ "lente-guardado": achadas });
  }, [caderno, tituloDoCapitulo, conteudoRef, casadas, chave]);

  const esquecer = useCallback(async (id: string) => {
    // Some da lista E do texto: o efeito acima recalcula os grifos a partir do
    // caderno, então basta tirar daqui.
    setCaderno((c) => c.filter((t) => t.id !== id));
    grifosRef.current = [];
    publicarRealces({ "lente-guardado": [] });
    if (!cursoSlug) return;
    try {
      await fetch(`/api/courses/${cursoSlug}/trechos?id=${encodeURIComponent(id)}`, {
        method: "DELETE", credentials: "include",
      });
    } catch { /* some da tela; volta na próxima carga se a rede falhou */ }
  }, [cursoSlug]);

  const fecharTutor = useCallback(() => {
    setTutor(null);
    if (retomarDepois.current) {
      retomarDepois.current = false;
      void audioRef.current?.play().catch(() => { /* o aluno reprende quando quiser */ });
    }
  }, []);

  const irPara = useCallback((s: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(s, a.duration || s));
    setSeguindo(true);
  }, []);

  /**
   * O índice de seções serve nos DOIS modos.
   *
   * Com narração, ele salta no relógio. Sem, ele rola até a primeira frase
   * daquela seção — que é o mesmo gesto para quem lê. A versão anterior só
   * aparecia com áudio, e por isso o leitor precisava manter um segundo painel
   * de navegação ao lado da lente só para ter sumário.
   */
  const irParaSecao = useCallback((m: { segundos: number; titulo: string }) => {
    if (comAudio) { irPara(m.segundos); return; }
    const marc = faixasRef.current;
    if (!marc) return;
    const f = falas.find((x) => x.secao === m.titulo);
    const faixa = f ? marc.faixas.get(f.i) : null;
    if (!faixa) return;
    const quem = quemRola(rolagemRef.current);
    const mold = moldura(quem);
    const r = faixa.getBoundingClientRect();
    porTopo(quem, topoDe(quem) + (r.top - mold.topo) - mold.altura * ANCORA, true);
  }, [comAudio, irPara, falas, rolagemRef]);

  const alternar = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play(); else a.pause();
  }, []);

  useEffect(() => {
    const noTeclado = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); alternar(); }
      else if (e.code === "ArrowLeft") irPara(agora - PULO);
      else if (e.code === "ArrowRight") irPara(agora + PULO);
    };
    window.addEventListener("keydown", noTeclado);
    return () => window.removeEventListener("keydown", noTeclado);
  }, [alternar, irPara, agora]);

  const secaoAtual = atual >= 0 ? falas[atual]?.secao : null;
  const progresso = total > 0 ? (agora / total) * 100 : 0;

  return (
    <>
      {/* ── Fase 4: o menu que nasce da seleção ────────────────────────────── */}
      {selecao && !tutor && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: selecao.x, top: selecao.y - 10 }}
          onMouseDown={(e) => e.preventDefault()}   /* não deixa a seleção morrer no clique */
        >
          <div className="flex items-center gap-0.5 rounded-full bg-[var(--lente-barra)] ring-1 ring-[var(--lente-barra-anel)] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] p-1">
            <button type="button" onClick={() => perguntar("explicar", selecao.texto)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[rgba(var(--reader-tint),0.8)] hover:text-white hover:bg-violet-500/25 transition-colors">
              <Sparkles size={13} />{T("Explicar melhor")}
            </button>
            <button type="button" onClick={() => perguntar("resumir", selecao.texto)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[rgba(var(--reader-tint),0.8)] hover:text-white hover:bg-violet-500/25 transition-colors">
              <Scissors size={13} />{T("Resumir isto")}
            </button>
            <button type="button" onClick={() => guardar(selecao.texto)}
              disabled={guardados.includes(selecao.texto)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[rgba(var(--reader-tint),0.8)] enabled:hover:text-white enabled:hover:bg-amber-500/25 disabled:text-amber-300/70 transition-colors">
              <Highlighter size={13} />{guardados.includes(selecao.texto) ? T("Guardado") : T("Guardar")}
            </button>
          </div>
        </div>
      )}

      {/* ── Fase 4: a resposta do tutor, sobre AQUELE trecho ───────────────── */}
      {tutor && (
        <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
          <div className="mx-auto max-w-3xl px-3 pb-24 pointer-events-auto">
            <div className="rounded-2xl bg-[var(--lente-barra)] ring-1 ring-violet-400/30 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3 border-b border-[rgba(var(--reader-tint),0.07)]">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-violet-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-violet-300/70">{tutor.pedido}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[rgba(var(--reader-tint),0.45)] line-clamp-2 italic">
                    &ldquo;{tutor.trecho}&rdquo;
                  </p>
                </div>
                <button type="button" onClick={fecharTutor} aria-label={T("Fechar")}
                  className="p-1 rounded-full text-[rgba(var(--reader-tint),0.4)] hover:text-white hover:bg-[rgba(var(--reader-tint),0.08)] transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="px-4 py-3 max-h-[38vh] overflow-y-auto">
                {pensando && (
                  <p className="flex items-center gap-2 text-sm text-[rgba(var(--reader-tint),0.5)]">
                    <Loader2 size={14} className="animate-spin" />
                    {T("O tutor está lendo o trecho…")}
                  </p>
                )}
                {tutor.erro && <p className="text-sm text-amber-300/90">{tutor.erro}</p>}
                {tutor.resposta && (
                  <p className="text-[13.5px] leading-relaxed text-[rgba(var(--reader-tint),0.88)] whitespace-pre-wrap">
                    {tutor.resposta}
                  </p>
                )}
              </div>
              {comAudio && retomarDepois.current && (
                <p className="px-4 pb-3 text-[11px] text-[rgba(var(--reader-tint),0.35)]">
                  {T("A narração volta quando você fechar.")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── A barra flutuante: um lugar só, sem moldura em volta do texto ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="relative mx-auto max-w-3xl px-3 pb-3 pointer-events-auto">
          {/* ── OS SUMÁRIOS MORAM FORA DA BARRA ────────────────────────────
              A barra tem `overflow-hidden` (é o que arredonda os cantos e
              recorta a animação do painel). Um popover que abre PARA CIMA de
              dentro dela é cortado pela própria caixa: o Ricardo só conseguiu
              ver a lista de seções depois de abrir o painel de áudio, que
              aumentava a altura recortada. Aqui eles são irmãos da barra, não
              filhos — nada os corta. */}
          {indiceAberto && linhaDoTempo.marcas.length > 0 && (
            <div className="absolute inset-x-3 bottom-full mb-2 z-50 flex justify-end">
              <div className="w-60 max-h-72 overflow-y-auto rounded-2xl bg-[var(--lente-barra)] ring-1 ring-[var(--lente-barra-anel)] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] py-1.5">
                {linhaDoTempo.marcas.map((m) => (
                  <button key={`${m.segundos}-${m.titulo}`} type="button"
                    onClick={() => { irParaSecao(m); setIndiceAberto(false); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-[13px] text-[rgba(var(--reader-tint),0.7)] hover:text-[rgba(var(--reader-tint),1)] hover:bg-[rgba(var(--reader-tint),0.06)] transition-colors">
                    <span className="truncate">{m.titulo}</span>
                    {comAudio && (
                      <span className="tabular-nums text-[11px] text-[rgba(var(--reader-tint),0.35)]">{tempoHumano(m.segundos)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {guardadosAbertos && caderno.length > 0 && (
            <div className="absolute inset-x-3 bottom-full mb-2 z-50 flex justify-end">
              <div className="w-72 max-h-80 overflow-y-auto rounded-2xl bg-[var(--lente-barra)] ring-1 ring-[var(--lente-barra-anel)] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] py-1.5">
                {caderno.map((t) => (
                  <div key={t.id} className="group flex items-start gap-2 px-3.5 py-2 hover:bg-[rgba(var(--reader-tint),0.05)]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-snug text-[rgba(var(--reader-tint),0.78)] line-clamp-3">{t.texto}</p>
                      {t.capitulo && (
                        <p className="mt-0.5 text-[10px] text-[rgba(var(--reader-tint),0.32)] truncate">{t.capitulo}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => esquecer(t.id)} title={T("Esquecer")}
                      className="shrink-0 p-1 rounded-full text-[rgba(var(--reader-tint),0.25)] hover:text-amber-300 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── A BARRA PRECISA SER UM OBJETO, NÃO UMA MANCHA ──────────────
              Ela usava `--reader-float` (#0d0f18) sobre um fundo de página
              #0b0c13: dois pontos de diferença, ou seja, invisível. Os
              controles pareciam soltos em cima do texto, e foi assim que o
              Ricardo viu "controles que aparecem por trás".
              `--lente-barra` é uma superfície DELIBERADAMENTE mais clara que a
              página em cada tema, com anel e sombra que a levantam. */}
          <div className="rounded-2xl bg-[var(--lente-barra)] ring-1 ring-[var(--lente-barra-anel)] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] overflow-hidden">

            {/* painel de som e sequência */}
            <div className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              painelAberto && comAudio ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}>
              <div className="overflow-hidden">
                <div className="grid gap-4 sm:grid-cols-2 px-5 pt-4 pb-2 border-b border-[rgba(var(--reader-tint),0.06)]">
                  {comAudio && (
                    <label className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                        <span className="flex items-center gap-1.5"><Gauge size={12} />{T("Velocidade")}</span>
                        <span className="tabular-nums">{velocidade}×</span>
                      </span>
                      <div className="flex gap-1">
                        {VELOCIDADES.map((v) => (
                          <button key={v} type="button" onClick={() => setVelocidade(v)}
                            className={cn("flex-1 py-1 rounded-lg text-[11px] tabular-nums transition-colors",
                              v === velocidade ? "bg-violet-500/25 text-violet-100"
                                : "bg-[rgba(var(--reader-tint),0.05)] text-[rgba(var(--reader-tint),0.5)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                            {v}×
                          </button>
                        ))}
                      </div>
                    </label>
                  )}

                  {comAudio && (
                    <label className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                        <span className="flex items-center gap-1.5">
                          {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}{T("Volume")}
                        </span>
                        <span className="tabular-nums">{Math.round(volume * 100)}%</span>
                      </span>
                      <input type="range" min={0} max={1} step={0.05} value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full accent-violet-400 cursor-pointer" aria-label={T("Volume")} />
                    </label>
                  )}

                  {comAudio && irParaCapitulo && (
                    <label className="sm:col-span-2 flex items-center justify-between gap-3 cursor-pointer pt-1">
                      <span className="text-[12px] text-[rgba(var(--reader-tint),0.6)]">
                        {T("Seguir para o próximo capítulo sozinho")}
                      </span>
                      <button type="button" role="switch" aria-checked={emSequencia}
                        onClick={() => setEmSequencia((v) => !v)}
                        className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0",
                          emSequencia ? "bg-violet-500" : "bg-[rgba(var(--reader-tint),0.15)]")}>
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                          emSequencia ? "left-[1.375rem]" : "left-0.5")} />
                      </button>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* progresso */}
            {comAudio && (
              <div className="relative h-1 bg-[rgba(var(--reader-tint),0.07)] cursor-pointer"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  irPara(((e.clientX - r.left) / r.width) * total);
                }}>
                <div className="absolute inset-y-0 left-0 bg-violet-400/80" style={{ width: `${progresso}%` }} />
                {linhaDoTempo.marcas.map((m) => (
                  <span key={`t-${m.segundos}`} className="absolute top-0 bottom-0 w-px bg-[rgba(var(--reader-tint),0.22)]"
                    style={{ left: `${total ? (m.segundos / total) * 100 : 0}%` }} />
                ))}
              </div>
            )}

            {/* controles */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5">
              {/* ── Fase 5: a navegação de capítulo mora AQUI ────────────────
                  Duas barras disputando o rodapé era o que havia antes. Quem
                  ouve não quer sair da barra para trocar de aula, e quem lê
                  sem áudio precisa dos mesmos botões. */}
              {irParaCapitulo && (
                <button type="button" disabled={!temAnterior}
                  onClick={() => irParaCapitulo(-1)} title={T("Capítulo anterior")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.5)] enabled:hover:text-[rgba(var(--reader-tint),0.95)] enabled:hover:bg-[rgba(var(--reader-tint),0.07)] disabled:opacity-25 transition-colors">
                  <SkipBack size={15} />
                </button>
              )}

              {comAudio && (
                <>
                  <button type="button" onClick={() => irPara(agora - PULO)} title={T("Voltar 15 segundos")}
                    className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                    <RotateCcw size={16} />
                  </button>
                  <button type="button" onClick={alternar} aria-label={tocando ? T("Pausar") : T("Tocar")}
                    className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-900/30 transition-colors">
                    {tocando ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button type="button" onClick={() => irPara(agora + PULO)} title={T("Avançar 15 segundos")}
                    className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                    <RotateCw size={16} />
                  </button>
                  <span className="ml-1 text-[11px] tabular-nums text-[rgba(var(--reader-tint),0.4)] hidden sm:inline">
                    {tempoHumano(agora)}<span className="opacity-50"> / {tempoHumano(total)}</span>
                  </span>
                </>
              )}

              {!comAudio && (
                <span className="px-2 text-xs text-[rgba(var(--reader-tint),0.5)]">{T("Lente de leitura")}</span>
              )}

              {irParaCapitulo && (
                <button type="button" disabled={!temProximo}
                  onClick={() => irParaCapitulo(1)} title={T("Próximo capítulo")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.5)] enabled:hover:text-[rgba(var(--reader-tint),0.95)] enabled:hover:bg-[rgba(var(--reader-tint),0.07)] disabled:opacity-25 transition-colors">
                  <SkipForward size={15} />
                </button>
              )}

              <div className="flex-1" />

              {/* O caderno: só aparece quando existe alguma coisa nele. */}
              {caderno.length > 0 && (
                <button type="button" onClick={() => setGuardadosAbertos((v) => !v)} aria-expanded={guardadosAbertos}
                  title={T("Trechos guardados")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    guardadosAbertos ? "text-amber-200 bg-amber-500/20"
                      : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                  <Bookmark size={13} />
                  <span className="tabular-nums">{caderno.length}</span>
                </button>
              )}

              {secaoAtual && (
                <span className="hidden md:inline text-[11px] text-[rgba(var(--reader-tint),0.45)] truncate max-w-[14rem]">
                  {secaoAtual}
                </span>
              )}

              {linhaDoTempo.marcas.length > 0 && (
                <button type="button" onClick={() => setIndiceAberto((v) => !v)} aria-expanded={indiceAberto}
                  title={T("Seções do capítulo")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-colors",
                    indiceAberto ? "text-violet-200 bg-violet-500/20"
                      : "text-[rgba(var(--reader-tint),0.6)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                  <ListTree size={13} />
                  <ChevronDown size={11} className={cn("transition-transform", indiceAberto && "rotate-180")} />
                </button>
              )}

              {/* ── O AUMENTO SAI DE TRÁS DO ÍCONE ─────────────────────────
                  Ele era um `range` dentro do painel de ajustes. Controle que
                  precisa ser descoberto é controle que não existe — e "aumenta
                  a área que estou" era metade do pedido original. */}
              <div className="flex items-center rounded-full bg-[rgba(var(--reader-tint),0.06)]">
                <button type="button" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - PASSO_ZOOM).toFixed(2)))}
                  disabled={zoom <= ZOOM_MIN} title={T("Diminuir o texto")}
                  className="px-2 py-1.5 rounded-l-full text-[12px] font-semibold text-[rgba(var(--reader-tint),0.6)] enabled:hover:text-[rgba(var(--reader-tint),1)] enabled:hover:bg-[rgba(var(--reader-tint),0.09)] disabled:opacity-30 transition-colors">
                  A<span className="text-[9px]">−</span>
                </button>
                <span className="px-1 text-[10px] tabular-nums text-[rgba(var(--reader-tint),0.42)] select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button type="button" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + PASSO_ZOOM).toFixed(2)))}
                  disabled={zoom >= ZOOM_MAX} title={T("Aumentar o texto")}
                  className="px-2 py-1.5 rounded-r-full text-[14px] font-semibold text-[rgba(var(--reader-tint),0.6)] enabled:hover:text-[rgba(var(--reader-tint),1)] enabled:hover:bg-[rgba(var(--reader-tint),0.09)] disabled:opacity-30 transition-colors">
                  A<span className="text-[10px]">+</span>
                </button>
              </div>

              {comAudio && (
                <button type="button" onClick={() => setFoco((v) => !v)} aria-pressed={foco}
                  title={foco ? T("O resto da página recua enquanto toca") : T("Página inteira em brilho cheio")}
                  className={cn("flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    foco ? "text-violet-200 bg-violet-500/20"
                      : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                  <Focus size={13} />
                </button>
              )}

              <button type="button" onClick={() => porTopo(quemRola(rolagemRef.current), 0, true)}
                title={T("Voltar ao topo")}
                className="p-2 rounded-full text-[rgba(var(--reader-tint),0.5)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                <ArrowUpToLine size={15} />
              </button>

              {/* Sem áudio o painel ficaria vazio: o aumento mudou-se para a
                  barra, e velocidade/volume/sequência só existem com narração. */}
              {comAudio && (
              <button type="button" onClick={() => setPainelAberto((v) => !v)} aria-expanded={painelAberto}
                title={T("Som e sequência")}
                className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                  painelAberto ? "text-violet-200 bg-violet-500/15"
                    : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                <SlidersHorizontal size={13} />
              </button>
              )}

              {comAudio && (
                <button type="button" onClick={() => setSeguindo((v) => !v)} aria-pressed={seguindo}
                  title={seguindo ? T("A página segue o áudio") : T("Vista solta")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    seguindo ? "text-violet-200 bg-violet-500/15"
                      : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                  {seguindo ? <Lock size={13} /> : <LockOpen size={13} />}
                </button>
              )}

              {aoFechar && (
                <button type="button" onClick={aoFechar} title={T("Fechar a lente")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.45)] hover:text-[rgba(var(--reader-tint),0.9)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Realce nativo é de 2022 (Chrome 105, Safari 17.2, Firefox 140). Num
              navegador mais velho não há como pintar sem mexer no DOM — e mexer
              no DOM é o que derrubava a página. Então dizemos, em vez de
              deixar a lente parecer quebrada. */}
          {!temRealceNativo() && (
            <p className="mt-1.5 text-center text-[10px] text-amber-300/60">
              {T("Seu navegador não pinta o realce; a narração e o índice continuam funcionando.")}
            </p>
          )}

          {casadas !== null && casadas < falas.length * 0.7 && (
            <p className="mt-1.5 text-center text-[10px] text-amber-300/60">
              {T("Sincronia parcial neste capítulo")} ({casadas}/{falas.length})
            </p>
          )}

          {/* Dizer que a narração vai parar antes de ela parar. O contrário —
              o silêncio sem explicação — lê como defeito. */}
          {comAudio && emSequencia && temProximo && !proximoTemAudio && (
            <p className="mt-1.5 text-center text-[10px] text-[rgba(var(--reader-tint),0.35)]">
              {T("O próximo capítulo ainda não tem narração — a lente segue em leitura.")}
            </p>
          )}
        </div>
      </div>

      {comAudio && (
        <audio ref={audioRef} src={src ?? undefined} preload="metadata"
          onPlay={() => setTocando(true)} onPause={() => setTocando(false)}
          onEnded={aoTerminarCapitulo} className="hidden" />
      )}
    </>
  );
}
