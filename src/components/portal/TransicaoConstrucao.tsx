"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  esqueletoGenerico,
  estimativaMs,
  lerEsqueleto,
  type BlocoEsqueleto,
} from "./esqueletoPortal";

/**
 * A entrada do portal que se CONSTRÓI em vez de girar um spinner.
 *
 * O aluno já viu este dashboard. Em vez de um círculo girando enquanto a API
 * responde, o esqueleto guardado da última visita é redesenhado em 3D: o
 * contorno de cada bloco se desenha, a face preenche, o número em cache sobe.
 * O tempo é o mesmo — a leitura é outra.
 *
 * As três leis (de `.claude/skills/landing-3d/SKILL.md`):
 *
 *  1. **A cena nunca segura o dado.** Ela não faz fetch, não sabe da API. Só
 *     recebe `pronto` e reage.
 *  2. **Nunca termina antes do dado chegar** — trava em 92% e respira.
 *  3. **Nunca demora mais do que precisa** quando o dado chega cedo: acelera
 *     com velocidade limitada, sem salto.
 *
 * Protótipo de origem, verificado quadro a quadro:
 * `.claude/skills/landing-3d/exemplo/construcao.html`.
 */

const TETO_ESPERA = 0.92; // até onde a coreografia vai sozinha
/**
 * Teto do desenho, em ms.
 *
 * ⚠️ Já foi 4.200 e **estava errado**. Ricardo, vendo rodar: *"prefiro que
 * demore mais para desenhar tudo, fica muito tempo esperando"*. Com o teto
 * baixo, num carregamento de ~21 s o esqueleto ficava pronto em 4 s e sobravam
 * 17 s de luz varrendo — que é exatamente a sensação de espera que a transição
 * existe para tirar. Melhor desenhar devagar e chegar perto do fim junto com o
 * dado do que terminar cedo e ficar olhando.
 */
const RITMO_MAX = 16000;
/**
 * Quanto leva para varrer a coreografia INTEIRA no fechamento, em ms.
 *
 * Vira velocidade máxima, não duração fixa — então o tempo real do fecho é
 * proporcional ao que ainda falta desenhar: 90% restantes levam ~1 s, 8%
 * restantes levam ~90 ms.
 *
 * ⚠️ Era um mínimo fixo de 420 ms, e com o ritmo lento isso virava um FLASH:
 * dado chegando aos 2 s com o desenho em 12% mandava os 88% restantes
 * aparecerem de uma vez.
 */
const FECHAMENTO_MS = 1100;
const SAIDA_S = 0.42; // duração do cross-fade final

const AMBAR = "#f59e0b";
const OSSO = "#e8e4dc";
const FRACO = "#8a8f99";

/* ────────────────────────────────────────────── desenho procedural
   Nenhum arquivo de imagem: cada face é um <canvas> virado CanvasTexture.
   ⚠️ Toda medida de arte vive em UNIDADES DE MUNDO e só no fim vira pixel.
   Com tamanho fixo de textura, o rótulo de um bloco largo sai várias vezes
   maior que o de um estreito — foi o defeito que só a imagem revelou. */

const RAIO_MUNDO = 0.22;
const ARTE = {
  pad: 0.17,
  rotulo: 0.115,
  espaco: 0.016,
  barra: 0.075,
  listaAlt: 0.1,
  listaGap: 0.075,
  traco: 0.014,
};

/**
 * Quanto a arte encolhe num bloco baixo. 1 num cartão de altura normal,
 * ~0,45 numa faixa fina. Sem isto o rótulo e o valor se atropelam — foi o
 * defeito que só apareceu com a medição do dashboard real.
 */
function medidaEscala(alturaMundo: number): number {
  return Math.min(1, Math.max(0.45, alturaMundo / 1.2));
}

function tela(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function caminhoArredondado(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
  const raio = Math.min(r, w / 2, h / 2);
  x.beginPath();
  x.moveTo(px + raio, py);
  x.lineTo(px + w - raio, py);
  x.quadraticCurveTo(px + w, py, px + w, py + raio);
  x.lineTo(px + w, py + h - raio);
  x.quadraticCurveTo(px + w, py + h, px + w - raio, py + h);
  x.lineTo(px + raio, py + h);
  x.quadraticCurveTo(px, py + h, px, py + h - raio);
  x.lineTo(px, py + raio);
  x.quadraticCurveTo(px, py, px + raio, py);
  x.closePath();
}

function faceTextura(b: BlocoEsqueleto, larguraMundo: number, alturaMundo: number): THREE.CanvasTexture {
  const res = Math.min(200, 2048 / Math.max(larguraMundo, alturaMundo));
  const u = (v: number) => v * res;
  const W = Math.max(8, Math.round(larguraMundo * res));
  const H = Math.max(8, Math.round(alturaMundo * res));
  const cn = tela(W, H);
  const x = cn.getContext("2d")!;

  caminhoArredondado(x, 0, 0, W, H, u(RAIO_MUNDO));
  const g = x.createLinearGradient(0, 0, W * 0.5, H);
  g.addColorStop(0, "rgba(255,255,255,.062)");
  g.addColorStop(1, "rgba(255,255,255,.014)");
  x.fillStyle = g;
  x.fill();
  x.strokeStyle = "rgba(232,228,220,.16)";
  x.lineWidth = u(ARTE.traco);
  x.stroke();

  /* ⚠️ Bloco baixo não cabe a arte em tamanho cheio: a faixa do topo tem
     ~0,4 unidade de altura e o rótulo sozinho já comia 0,285 — o valor subia
     por cima dele. Padding e corpo encolhem junto com o bloco. */
  const escala = medidaEscala(alturaMundo);
  const pad = u(ARTE.pad * escala);
  if (b.rotulo) {
    x.fillStyle = FRACO;
    x.font = `600 ${u(ARTE.rotulo * escala)}px ui-sans-serif,system-ui,sans-serif`;
    x.letterSpacing = `${u(ARTE.espaco * escala)}px`;
    x.textBaseline = "top";
    x.fillText(b.rotulo.toUpperCase(), pad, pad);
    x.letterSpacing = "0px";
  }

  if (b.pct !== undefined) {
    const bh = u(ARTE.barra);
    const by = H - pad - bh;
    x.fillStyle = "rgba(232,228,220,.10)";
    caminhoArredondado(x, pad, by, W - pad * 2, bh, bh / 2);
    x.fill();
    x.fillStyle = AMBAR;
    caminhoArredondado(x, pad, by, (W - pad * 2) * b.pct, bh, bh / 2);
    x.fill();
  } else if (b.valor === undefined) {
    // sem valor em cache: barras-esqueleto, que é o que o bloco realmente é
    const alt = u(ARTE.listaAlt);
    const gap = u(ARTE.listaGap);
    const topo = pad + (b.rotulo ? u(ARTE.rotulo) * 1.9 : 0);
    const n = Math.max(1, Math.min(4, Math.floor((H - topo - pad) / (alt + gap))));
    for (let i = 0; i < n; i++) {
      x.fillStyle = "rgba(232,228,220,.085)";
      const larg = (W - pad * 2) * (0.52 + ((i * 37) % 41) / 100);
      caminhoArredondado(x, pad, topo + i * (alt + gap), larg, alt, alt / 2);
      x.fill();
    }
  }

  const t = new THREE.CanvasTexture(cn);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** O valor: canvas próprio, repintado só enquanto o número está subindo. */
function criarValor() {
  const cn = tela(512, 160);
  const t = new THREE.CanvasTexture(cn);
  t.colorSpace = THREE.SRGBColorSpace;
  return { cn, t, ultimo: null as string | null };
}

function pintarValor(v: ReturnType<typeof criarValor>, texto: string, sufixo?: string) {
  if (v.ultimo === texto) return;
  v.ultimo = texto;
  const x = v.cn.getContext("2d")!;
  x.clearRect(0, 0, 512, 160);
  x.fillStyle = OSSO;
  x.font = "600 96px ui-sans-serif,system-ui,sans-serif";
  x.textBaseline = "middle";
  x.fillText(texto, 6, 84);
  if (sufixo) {
    x.fillStyle = FRACO;
    x.font = "600 40px ui-sans-serif,system-ui,sans-serif";
    x.fillText(sufixo, 12 + x.measureText(texto).width, 96);
  }
  v.t.needsUpdate = true;
}

/** Contorno como Line com drawRange animado — é isso que literalmente desenha. */
function geoContorno(w: number, h: number, r: number) {
  const raio = Math.min(r, w / 2, h / 2);
  const pts: THREE.Vector3[] = [];
  const arco = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * raio, cy + Math.sin(a) * raio, 0));
    }
  };
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  pts.push(new THREE.Vector3(x0 + raio, y0, 0), new THREE.Vector3(x1 - raio, y0, 0));
  arco(x1 - raio, y0 + raio, -Math.PI / 2);
  pts.push(new THREE.Vector3(x1, y1 - raio, 0));
  arco(x1 - raio, y1 - raio, 0);
  pts.push(new THREE.Vector3(x0 + raio, y1, 0));
  arco(x0 + raio, y1 - raio, Math.PI / 2);
  pts.push(new THREE.Vector3(x0, y0 + raio, 0));
  arco(x0 + raio, y0 + raio, Math.PI);
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  g.setDrawRange(0, 0);
  return g;
}

const sat = (v: number) => Math.min(1, Math.max(0, v));
const suave = (a: number, b: number, x: number) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const damp = (atual: number, alvo: number, lambda: number, dt: number) =>
  atual + (alvo - atual) * (1 - Math.exp(-lambda * dt));

/* ────────────────────────────────────────────── a cena */

interface PecaCartao {
  bloco: BlocoEsqueleto;
  grupo: THREE.Group;
  linha: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  face: THREE.Mesh;
  valor: ReturnType<typeof criarValor> | null;
  valorMesh: THREE.Mesh | null;
  pontos: number;
  i: number;
}

function Obra({
  pronto,
  aoTerminar,
  bateu,
  aoPrimeiroQuadro,
}: {
  pronto: boolean;
  aoTerminar: () => void;
  /** Marcado no primeiro quadro — é como o vigia lá fora sabe que a cena vive. */
  bateu: React.MutableRefObject<boolean>;
  /** Avisa que já há pixel na tela: o spinner de piso pode sair. */
  aoPrimeiroQuadro: () => void;
}) {
  const { camera, size, invalidate } = useThree();
  const reduzir = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const cache = useMemo(() => lerEsqueleto(), []);
  const estim = useMemo(() => estimativaMs(cache), [cache]);
  const blocos = useMemo(
    () => (cache && cache.blocos.length > 0 ? cache.blocos : esqueletoGenerico()),
    [cache]
  );

  // A "mesa": o plano onde o dashboard é desenhado, na proporção da janela.
  const LARG = 12;
  const ALT = useMemo(() => LARG * (size.height / Math.max(1, size.width)), [size.height, size.width]);

  const { raiz, cartoes, poeira } = useMemo(() => {
    const raiz = new THREE.Group();
    const cartoes: PecaCartao[] = [];

    blocos.forEach((b, idx) => {
      const w = Math.max(0.2, b.w * LARG - 0.12);
      const h = Math.max(0.2, b.h * ALT - 0.12);
      const cx = -LARG / 2 + (b.x + b.w / 2) * LARG;
      const cy = ALT / 2 - (b.y + b.h / 2) * ALT;

      const grupo = new THREE.Group();
      grupo.position.set(cx, cy, 0);
      raiz.add(grupo);

      const gLinha = geoContorno(w, h, RAIO_MUNDO);
      const linha = new THREE.Line(
        gLinha,
        new THREE.LineBasicMaterial({ color: AMBAR, transparent: true, opacity: 0.9 })
      );
      linha.position.z = 0.012;
      grupo.add(linha);

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: faceTextura(b, w, h),
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      grupo.add(face);

      let valor: ReturnType<typeof criarValor> | null = null;
      let valorMesh: THREE.Mesh | null = null;
      if (b.valor !== undefined) {
        valor = criarValor();
        // O valor ancora no RODAPÉ do bloco: o rótulo mora no topo e numa
        // faixa baixa os dois se atropelavam.
        const esc = medidaEscala(h);
        const padY = ARTE.pad * esc;
        const av = Math.min(h * 0.42, 0.62);
        const lv = av * (512 / 160);
        const geo = new THREE.PlaneGeometry(lv, av);
        geo.translate(lv / 2, 0, 0); // ancora à esquerda
        valorMesh = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ map: valor.t, transparent: true, opacity: 0, depthWrite: false })
        );
        // ancorado no rodapé, acima do padding — nunca numa fração da altura
        valorMesh.position.set(-w / 2 + padY, -h / 2 + padY + av * 0.5, 0.02);
        grupo.add(valorMesh);
      }

      cartoes.push({
        bloco: b,
        grupo,
        linha,
        face,
        valor,
        valorMesh,
        pontos: gLinha.attributes.position.count,
        i: idx,
      });
    });

    // Ordem de entrada: a leitura natural, cima → baixo, esquerda → direita.
    cartoes.sort((a, c) => a.bloco.y + a.bloco.x * 0.12 - (c.bloco.y + c.bloco.x * 0.12));
    cartoes.forEach((c, i) => (c.i = i));

    // Poeira de obra: o que mantém a cena viva enquanto o dado não chega.
    const N = 200;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * LARG * 1.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * ALT * 1.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      vel[i] = 0.04 + Math.random() * 0.1;
    }
    const gp = new THREE.BufferGeometry();
    gp.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const poeira = new THREE.Points(
      gp,
      new THREE.PointsMaterial({
        color: AMBAR,
        size: 0.028,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    poeira.userData.vel = vel;
    raiz.add(poeira);

    return { raiz, cartoes, poeira };
  }, [blocos, ALT]);

  /* ⚠️ O r3f descarta o que é declarativo; um `<primitive>` construído à mão
     é responsabilidade nossa. Sem isto, entrar e sair do portal cinco vezes
     queima cinco contextos — o navegador para de criar por volta de dezesseis. */
  useEffect(() => {
    return () => {
      raiz.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
          const qualquer = mat as THREE.MeshBasicMaterial;
          qualquer.map?.dispose();
          mat.dispose();
        });
      });
    };
  }, [raiz]);

  const M = useRef({ p: 0, t0: performance.now(), recuo: 1, saida: 0, fim: false, relogio: 0 });

  // Movimento reduzido: o esqueleto chega pronto, sem percurso.
  useEffect(() => {
    if (reduzir) M.current.p = TETO_ESPERA;
  }, [reduzir]);

  const posicionarCamera = (recuo: number) => {
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const base = ALT / 2 / Math.tan(fov / 2) * 1.04;
    const dist = base * (1 + recuo * 0.2);
    const inc = recuo * 0.3;
    camera.position.set(recuo * 0.55, Math.sin(inc) * dist, Math.cos(inc) * dist);
    camera.lookAt(0, 0, 0);
  };

  useFrame((_, dtBruto) => {
    const dt = Math.min(0.05, dtBruto);
    const m = M.current;
    if (!bateu.current) {
      bateu.current = true;
      aoPrimeiroQuadro();
    }
    if (m.fim) return;
    m.relogio += dt;

    /* ⚠️ O desenho tem TETO de duração, e não é detalhe de conforto.
       A estimativa real medida aqui é de ~22 s. Esticar a coreografia por 22 s
       faz cada traço levar segundos: aos 9 s só o primeiro bloco tinha face, e
       a tela lia como parada, não como obra. O desenho leva no máximo
       `RITMO_MAX`; quem ocupa o resto da espera é a fase `esperando`, que
       varre luz pelo esqueleto já construído. */
    const ritmo = Math.min(Math.max(estim, 1200), RITMO_MAX);
    const t = performance.now() - m.t0;
    const alvo = pronto ? 1 : Math.min(t / ritmo, TETO_ESPERA);

    /* A velocidade é limitada nos DOIS sentidos: o teto de 92% impede o fim
       prematuro, e o `FECHAMENTO_MS` impede o salto quando o dado chega cedo
       (medido: dado em 250 ms com estimativa de 3 s → entrega em ~1 s). */
    const restante = Math.max(0, alvo - m.p);
    const velMax = pronto ? 1 / (FECHAMENTO_MS / 1000) : (1 / (ritmo / 1000)) * 1.6;
    m.p = Math.min(alvo, m.p + Math.min(restante, velMax * dt));

    const esperando = !pronto && m.p >= TETO_ESPERA - 1e-3;
    const assentando = pronto && m.p >= 0.999;

    m.recuo = damp(m.recuo, assentando ? 0 : 1 - suave(0, 0.85, m.p) * 0.82, 3.2, dt);
    posicionarCamera(m.recuo);

    const N = cartoes.length;
    // a onda desce o esqueleto e recomeça; 0..1 sobre a lista de blocos
    const onda = esperando ? (m.relogio * 0.32) % 1.25 : -1;

    for (const C of cartoes) {
      const inicio = (C.i / N) * 0.78;
      const local = sat((m.p - inicio) / 0.22);

      // 1 · o traço desenha
      const traco = suave(0, 0.55, local);
      C.linha.geometry.setDrawRange(0, Math.max(2, Math.floor(C.pontos * traco)));
      C.linha.material.opacity = (traco < 1 ? 0.95 : 0.95 - suave(0.55, 1, local) * 0.72) * (1 - m.saida);

      // 2 · a face preenche
      const face = suave(0.42, 0.95, local);
      (C.face.material as THREE.MeshBasicMaterial).opacity = face * (1 - m.saida);
      const s = 0.965 + face * 0.035;
      C.grupo.scale.set(s, s, 1);
      C.grupo.position.z = (1 - face) * -0.55;

      // 3 · o valor sobe
      if (C.valor && C.valorMesh) {
        const conta = suave(0.62, 1, local);
        (C.valorMesh.material as THREE.MeshBasicMaterial).opacity = conta * (1 - m.saida);
        const v = C.bloco.valor;
        if (typeof v === "number") {
          pintarValor(C.valor, Math.round(v * conta).toLocaleString("pt-BR"), C.bloco.sufixo);
        } else if (typeof v === "string" && conta > 0) {
          pintarValor(C.valor, v.slice(0, Math.ceil(v.length * conta)) || " ", C.bloco.sufixo);
        }
      }

      /* 4 · na espera, uma luz VARRE o esqueleto pronto de cima a baixo.
         Antes era só o último bloco pulsando, e numa espera de 20 s isso lê
         como travado. A varredura diz "ainda estou trabalhando" sem prometer
         progresso que não existe. */
      if (esperando) {
        C.linha.geometry.setDrawRange(0, C.pontos);
        const dist = Math.abs(C.i / Math.max(1, N - 1) - onda);
        const brilho = Math.max(0, 1 - dist * 5.5);
        C.linha.material.opacity = (0.16 + brilho * 0.7) * (1 - m.saida);
      }
    }

    const pp = poeira.geometry.attributes.position as THREE.BufferAttribute;
    const vel = poeira.userData.vel as Float32Array;
    for (let i = 0; i < vel.length; i++) {
      const y = pp.getY(i) + vel[i] * dt;
      pp.setY(i, y > ALT * 0.62 ? -ALT * 0.62 : y);
    }
    pp.needsUpdate = true;
    (poeira.material as THREE.PointsMaterial).opacity = 0.3 * (1 - m.saida);

    // a entrega
    if (assentando) {
      m.saida = Math.min(1, m.saida + dt / (reduzir ? 0.12 : SAIDA_S));
      raiz.position.z = m.saida * 0.9;
      if (m.saida >= 1) {
        m.fim = true;
        aoTerminar();
      }
    }
    invalidate();

    /* Sonda de desenvolvimento: cena 3D que não aparece não diz por quê —
       o console fica limpo e a tela, preta. Isto deixa medir de fora. */
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __obra?: unknown }).__obra = {
        p: +m.p.toFixed(3),
        pronto,
        alvo: +alvo.toFixed(3),
        saida: +m.saida.toFixed(2),
        cartoes: cartoes.length,
        ALT: +ALT.toFixed(2),
        cam: camera.position.toArray().map((n) => +n.toFixed(2)),
        op0: cartoes[0] ? +(cartoes[0].face.material as THREE.MeshBasicMaterial).opacity.toFixed(2) : null,
        dr0: cartoes[0]?.linha.geometry.drawRange.count ?? null,
      };
    }
  });

  return <primitive object={raiz} />;
}

export function TransicaoConstrucao({
  pronto,
  aoTerminar,
}: {
  /** O dado real já chegou? A cena não faz fetch — ela só reage a isto. */
  pronto: boolean;
  /** Chamado quando o cross-fade termina e o DOM real pode assumir. */
  aoTerminar: () => void;
}) {
  /**
   * ⚠️ **O empurrão que faz a cena sair de 300×150.**
   *
   * Medido aqui, no portal: o `<Canvas>` montou durante um carregamento
   * pesado e o medidor do r3f não acordou — buffer **300×150** enquanto o
   * contêiner tinha 1931×1152. A cena desenhava fora de escala, o que na
   * prática é tela preta. É a mesma armadilha já documentada em
   * `Peca3D.tsx:87`, e a correção é a mesma: um `resize` de fora, em React
   * comum. `setSize` de dentro da cena não resolve — o r3f reconcilia pela
   * própria medição e sobrescreve no render seguinte.
   */
  useEffect(() => {
    const relogios = [60, 220, 500].map((ms) =>
      setTimeout(() => window.dispatchEvent(new Event("resize")), ms)
    );
    return () => relogios.forEach(clearTimeout);
  }, []);

  /**
   * O vigia — a parte que impede a tela preta.
   *
   * WebGL falha de verdade: GPU velha, driver na lista negra, abas demais
   * (o navegador para de criar contexto por volta de dezesseis e derruba os
   * antigos). Quando isso acontece o r3f simplesmente para o laço, e uma tela
   * de carregamento que depende dele vira uma tela preta **permanente** —
   * medido aqui no portal, com `THREE.WebGLRenderer: Context Lost` no console
   * e nada mais.
   *
   * Se nenhum quadro rodou em 3 s, a obra desiste e entrega. O aluno cai no
   * caminho antigo (o spinner) em vez de ficar preso. Enfeite que quebra não
   * pode levar o portal junto.
   *
   * ⚠️ O prazo já foi 1,2 s e era **curto demais**: em carga fria o pacote do
   * three ainda estava sendo interpretado, nenhum quadro tinha rodado, e a
   * transição desistia de si mesma antes de começar. Medido na build de
   * produção.
   */
  const bateu = useRef(false);
  const [vivo, setVivo] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      if (!bateu.current) aoTerminar();
    }, 3000);
    return () => clearTimeout(id);
  }, [aoTerminar]);

  return (
    <div className="fixed inset-0 z-50 bg-background" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando seu portal</span>
      {/* O piso: enquanto a cena não desenha um quadro sequer — pacote do
          three ainda carregando, GPU recusando contexto — o que aparece é o
          spinner de sempre, nunca uma tela preta. Quando a obra desenha, ela
          cobre isto. */}
      {!vivo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      )}
      {/* ⚠️ `[&_canvas]:!h-full [&_canvas]:!w-full` não é enfeite: o <Canvas>
          do r3f estica o DIV que ele cria, mas o <canvas> lá dentro nasce no
          tamanho padrão do HTML (300×150). */}
      {/* `relative z-10`: o piso do spinner é `absolute` e pintaria POR CIMA
          de um contêiner estático, por mais que venha antes no DOM. */}
      <div className="relative z-10 h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full">
        <Canvas
          camera={{ position: [0, 2, 12], fov: 30, near: 0.1, far: 120 }}
          // sem debounce: a transição vive 1–3 s, medir tarde é medir nunca
          resize={{ debounce: 0, scroll: false }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
          // Sem WebGL não há obra — entrega na hora, sem tela preta.
          fallback={null}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", () => aoTerminar(), { once: true });
          }}
        >
          <Obra
            pronto={pronto}
            aoTerminar={aoTerminar}
            bateu={bateu}
            aoPrimeiroQuadro={() => setVivo(true)}
          />
        </Canvas>
      </div>
    </div>
  );
}
