"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Mesh, Group, Object3D } from "three";
import { COR_REGIAO, getLugar, PAISES_COM_DADO, type Lugar } from "@/data/landing/radar-lugares";
import mundoGeo from "@/data/geo/mundo.json";
import regioesGeo from "@/data/geo/brasil-regioes.json";
import ufGeo from "@/data/geo/brasil-uf.json";

/**
 * O globo do Radar FayAI.
 *
 * Não é uma esfera de pontos decorativa: é a Terra, com mapa político de
 * verdade, e o mapa é o controle. Clicar no Sudeste voa até o Sudeste e o que
 * está do lado muda para o que está em alta ali.
 *
 * **Por que o globo é desenhado à mão e não com `three-globe`/`r3f-globe`:**
 * as duas bibliotecas montam sem erro nenhum neste projeto e não desenham coisa
 * alguma — verificado no build de produção, com props mínimas, com cor berrante,
 * por `<primitive>` e por `scene.add`, numa cena onde uma esfera comum aparece
 * normalmente. Em vez de continuar caçando, o globo virou geometria própria:
 * uma esfera e as fronteiras do GeoJSON convertidas em linhas. É menos código
 * do que parece, roda, e não depende de ninguém.
 *
 * Três decisões que definem a sensação:
 *
 * 1. **A viagem é em coordenadas esféricas, não cartesianas.** Interpolar x/y/z
 *    faz a câmera atravessar o planeta; interpolar lat/lng faz ela contornar a
 *    superfície, que é o que o olho espera de um globo.
 * 2. **A viagem tem arco.** No meio do caminho a câmera sobe — quanto mais
 *    longe o destino, mais alto o arco. É o que transforma "trocou de estado"
 *    em "voou até o estado".
 * 3. **A deriva parada não é uma rotação em um eixo.** São dois senos de
 *    períodos que não fecham entre si mais uma respiração de altitude: o
 *    movimento nunca se repete igual e nunca chama atenção para si.
 */

// three-globe trabalha com raio 100. Toda distância aqui é em raios de globo.
const R = 100;
const NAVY = "#0c0e1d";

export type Camada = "mundo" | "ia";

export interface AlvoGlobo {
  lat: number;
  lng: number;
  alt: number;
  /** Altitude mínima do meio da viagem — o "sobe, atravessa, desce". */
  pico?: number;
}

interface Poligono {
  type: "Feature";
  properties: Record<string, string>;
  // `coordinates` fica com o tipo frouxo que o three-globe declara; a forma
  // real é aninhada (Polygon/MultiPolygon) e ele trata as duas.
  geometry: { type: string; coordinates: number[] };
}

/**
 * Extrai as feições do GeoJSON aceitando as duas formas que um bundler pode
 * entregar um `import` de JSON: o objeto direto ou embrulhado em `default`.
 */
function feicoes(mod: unknown): Poligono[] {
  const o = mod as { features?: Poligono[]; default?: { features?: Poligono[] } };
  return o?.features ?? o?.default?.features ?? [];
}

const MUNDO = feicoes(mundoGeo);
const REGIOES = feicoes(regioesGeo);
const UFS = feicoes(ufGeo);

/**
 * Variação sutil sobre a cor da região.
 *
 * Cinco estados do Nordeste todos no mesmo ouro exato leem como uma mancha
 * chapada. Um desvio pequeno e determinístico de luminosidade por sigla dá
 * textura — o olho percebe que são peças distintas sem que a região perca
 * unidade. Determinístico porque a mesma UF tem que ter a mesma cor sempre.
 */
function variar(hex: string, chave: string): string {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) h = Math.imul(h ^ chave.charCodeAt(i), 16777619);
  const desvio = (((h >>> 0) % 1000) / 1000 - 0.5) * 0.52; // ±26%
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  // Além da luminosidade, um giro pequeno de matiz: dois estados podem ter a
  // mesma luz e ainda assim se distinguir. Ambos pequenos o bastante para a
  // região continuar lendo como uma só.
  const giro = ((((h >>> 7) % 1000) / 1000 - 0.5) * 0.035 + 1) % 1;
  c.setHSL((hsl.h + giro) % 1, hsl.s, Math.min(0.92, Math.max(0.16, hsl.l * (1 + desvio))));
  return `#${c.getHexString()}`;
}

/**
 * O que o globo desenha depende do degrau em que estamos — e é isso que faz o
 * mapa virar navegação: no mundo, países; no Brasil, as cinco regiões; dentro
 * de uma região, os estados dela.
 */
function camadaDoLugar(lugar: Lugar): {
  poligonos: Poligono[];
  chave: string;
  corDe: (p: Record<string, string>) => string;
  /** Quem está em foco. O resto continua desenhado, só que esmaecido — é o
   *  que permite ver que um assunto também acontece fora daqui sem precisar
   *  navegar até lá. */
  emFoco: (p: Record<string, string>) => boolean;
} {
  if (lugar.id === "BR") {
    return {
      poligonos: REGIOES,
      chave: "regiao",
      corDe: (p) => COR_REGIAO[p.regiao] ?? "#38bdf8",
      emFoco: () => true,
    };
  }
  if (lugar.degrau === "regiao" || lugar.degrau === "estado") {
    const sigla =
      lugar.degrau === "regiao"
        ? lugar.id.replace("BR-r-", "")
        : getLugar(lugar.pai).id.replace("BR-r-", "");
    // O Brasil INTEIRO por estado — não só a região. O contexto é metade da
    // informação: sem ele, "isto também está em alta no Sul" é invisível.
    return {
      poligonos: UFS,
      chave: "uf",
      corDe: (p) => variar(COR_REGIAO[p.regiao] ?? "#38bdf8", p.uf),
      emFoco: (p) => p.regiao === sigla,
    };
  }
  return {
    poligonos: MUNDO,
    chave: "iso",
    corDe: (p) =>
      p.iso === "BR" ? "#f5c04e" : PAISES_COM_DADO.has(p.iso) ? "#38bdf8" : "#3d4470",
    emFoco: () => true,
  };
}

// ---------------------------------------------------------------------------
// Curvas
// ---------------------------------------------------------------------------

/** Bézier cúbica com controles (0.22, 0) e (0.68, 1), resolvida por Newton —
 *  saída firme e chegada pousada, em vez de freada. */
function bezier(t: number): number {
  const p1 = 0.22;
  const p2 = 0.68;
  const x = (u: number) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3;
  const dx = (u: number) =>
    3 * p1 * (1 - 4 * u + 3 * u * u) + 3 * p2 * (2 * u - 3 * u * u) + 3 * u * u;
  let u = t;
  for (let i = 0; i < 5; i++) {
    const d = dx(u);
    if (Math.abs(d) < 1e-6) break;
    u -= (x(u) - t) / d;
  }
  u = Math.min(1, Math.max(0, u));
  return 3 * (1 - u) * u * u + u ** 3;
}

/** Interpola longitude pelo caminho curto (evita a volta ao mundo no ±180°). */
function lerpLng(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

function paraCartesiano(lat: number, lng: number, alt: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const r = R * (1 + alt);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Distância angular entre dois pontos, em graus — dá o tamanho do arco. */
function separacao(a: AlvoGlobo, b: AlvoGlobo): number {
  const r = Math.PI / 180;
  const c =
    Math.sin(a.lat * r) * Math.sin(b.lat * r) +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lng - b.lng) * r);
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

// ---------------------------------------------------------------------------
// Câmera
// ---------------------------------------------------------------------------

function Camera({
  alvo,
  arrastando,
  desviado,
  onPosicao,
}: {
  alvo: AlvoGlobo;
  arrastando: React.RefObject<{ lat: number; lng: number } | null>;
  /** Quando o painel de detalhe abre, o mundo sai do centro para dar lugar a
   *  ele — como o mapa de pista das transmissões de F1, que se reacomoda em
   *  vez de ser coberto. */
  desviado: boolean;
  onPosicao: (p: AlvoGlobo) => void;
}) {
  const { camera, size } = useThree();
  const desvio = useRef(0);
  const atual = useRef<AlvoGlobo>({ ...alvo });
  const de = useRef<AlvoGlobo>({ ...alvo });
  const para = useRef<AlvoGlobo>({ ...alvo });
  const t = useRef(1);
  const duracao = useRef(1);
  const arco = useRef(0);
  /** Instante em que o arrasto/viagem terminou — a deriva parte daqui. */
  const soltouEm = useRef<number | null>(null);

  useEffect(() => {
    de.current = { ...atual.current };
    para.current = { ...alvo };
    soltouEm.current = null;
    const sep = separacao(de.current, para.current);
    // Viagem curta é rápida e rasa; travessia de continente é longa e alta.
    // Bullet time: a viagem é deliberadamente lenta. O que se ganha não é
    // tempo, é a leitura do caminho — dá para ver de onde saiu e para onde vai.
    duracao.current = Math.min(3.4, 1.5 + sep / 60);
    arco.current = Math.min(1.1, sep / 130) * Math.max(0.4, para.current.alt);
    t.current = 0;
  }, [alvo]);

  useFrame((state, dt) => {
    const a = atual.current;

    if (t.current < 1) {
      t.current = Math.min(1, t.current + dt / duracao.current);
      const e = bezier(t.current);
      a.lat = de.current.lat + (para.current.lat - de.current.lat) * e;
      a.lng = lerpLng(de.current.lng, para.current.lng, e);
      a.alt =
        de.current.alt +
        (para.current.alt - de.current.alt) * e +
        Math.sin(Math.PI * e) * arco.current;
    } else {
      const puxao = arrastando.current;
      if (puxao) {
        a.lat = Math.max(-78, Math.min(78, puxao.lat));
        a.lng = puxao.lng;
        a.alt = para.current.alt;
        para.current.lat = a.lat;
        para.current.lng = a.lng;
        soltouEm.current = null; // enquanto arrasta, a deriva não conta
      } else {
        // Deriva parada: dois senos de períodos que não fecham entre si, mais
        // uma respiração de altitude — nunca repete o mesmo quadro.
        //
        // ⚠️ A deriva é medida como DIFERENÇA desde o instante em que o dedo
        // soltou. Usar o valor absoluto do seno fazia o globo dar um pulo de
        // até 8° no release e parar fora do lugar onde foi largado.
        const s = state.clock.elapsedTime;
        if (soltouEm.current === null) soltouEm.current = s;
        const s0 = soltouEm.current;
        const d = (f: number, amp: number) => (Math.sin(s * f) - Math.sin(s0 * f)) * amp;
        a.lng = para.current.lng + d(0.05, 1.6) + d(0.018, 0.9);
        a.lat = para.current.lat + d(0.035, 0.7);
        a.alt = para.current.alt * (1 + d(0.026, 0.012));
      }
    }

    const p = paraCartesiano(a.lat, a.lng, a.alt);
    camera.position.set(p.x, p.y, p.z);
    camera.lookAt(0, 0, 0);

    // O desvio é feito no FRUSTUM, não movendo o objeto: `setViewOffset`
    // desloca a janela de projeção, então a região sai do centro sem que nada
    // seja escalado, distorcido ou recortado. É o que mantém o mapa "em foco"
    // enquanto o painel ocupa o canto.
    const alvoDesvio = desviado ? 1 : 0;
    desvio.current += (alvoDesvio - desvio.current) * Math.min(1, dt * 3.4);
    const cam = camera as THREE.PerspectiveCamera;
    if (desvio.current > 0.002) {
      cam.setViewOffset(
        size.width,
        size.height,
        size.width * 0.17 * desvio.current,
        size.height * 0.14 * desvio.current,
        size.width,
        size.height
      );
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }

    onPosicao(a);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Casca de wireframe — a assinatura visual da aba IA
// ---------------------------------------------------------------------------

function CascaIA({ ligada, cor }: { ligada: boolean; cor: string }) {
  const grupo = useRef<Group>(null);
  const forca = useRef(0);

  /**
   * Meridianos e paralelos, não um icosaedro.
   *
   * O icosaedro dava triângulos grandes e irregulares atravessando o planeta —
   * lia como "poliedro flutuando", não como camada de dados sobre a Terra. Uma
   * grade que segue a geometria do globo acompanha o giro e é a metáfora certa:
   * o mundo coberto por uma malha.
   */
  const linhas = useMemo(() => {
    const raio = R * 1.012;
    const geos: THREE.BufferGeometry[] = [];

    // meridianos (de polo a polo)
    for (let lng = -180; lng < 180; lng += 10) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -88; lat <= 88; lat += 4) pts.push(naEsfera(lat, lng, raio));
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    // paralelos
    for (let lat = -80; lat <= 80; lat += 10) {
      const pts: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 4) pts.push(naEsfera(lat, lng, raio));
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return geos;
  }, []);

  useEffect(() => () => linhas.forEach((g) => g.dispose()), [linhas]);

  useFrame((state, dt) => {
    forca.current += ((ligada ? 1 : 0) - forca.current) * Math.min(1, dt * 3.2);
    const g = grupo.current;
    if (!g) return;
    g.visible = forca.current > 0.01;
    // Cresce de dentro para fora: a leitura é "uma camada brotando sobre o
    // mundo", não "uma bola apareceu".
    g.scale.setScalar(0.995 + 0.012 * forca.current);
    // Giro lento e contrário ao da câmera — dá profundidade sem competir.
    g.rotation.y += dt * 0.03;
    for (const filho of g.children) {
      const m = (filho as THREE.Line).material as THREE.LineBasicMaterial;
      // Pulso suave percorrendo a malha, para não ficar estática.
      const fase = Math.sin(state.clock.elapsedTime * 0.7 + filho.id * 0.35) * 0.5 + 0.5;
      m.opacity = forca.current * (0.05 + fase * 0.13);
    }
  });

  return (
    <group ref={grupo}>
      {linhas.map((geo, i) => (
        <line key={i}>
          <primitive object={geo} attach="geometry" />
          <lineBasicMaterial color={cor} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </line>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// O globo
// ---------------------------------------------------------------------------

/** three-globe pendura o dado da feição no objeto 3D; é assim que voltamos do
 *  clique para "que região é essa". */
function dadoDoObjeto(o: Object3D | null): Poligono | null {
  let atual: Object3D | null = o;
  for (let i = 0; atual && i < 5; i++) {
    const d = (atual as unknown as { __data?: Poligono }).__data;
    if (d?.properties) return d;
    atual = atual.parent;
  }
  return null;
}

/** lat/lng em graus → ponto na esfera de raio `r`. */
/**
 * lat/lng em graus → ponto na esfera de raio `r`.
 *
 * `theta = 90 − lng` é a convenção de globo (a mesma do three-globe/globe.gl):
 * o leste cresce no sentido horário visto do polo norte. Trocar por `90 + lng`
 * espelha o planeta e inverte o arrasto — foi o bug que o Ricardo pegou de
 * olho em 26/07.
 */
function naEsfera(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Todos os anéis externos de um polígono (Polygon ou MultiPolygon). */
function aneisDe(g: Poligono["geometry"]): number[][][] {
  const c = g.coordinates as unknown;
  if (g.type === "Polygon") return c as number[][][];
  if (g.type === "MultiPolygon") return (c as number[][][][]).map((poli) => poli[0]);
  return [];
}

/**
 * Triangula um anel em lat/lng e projeta os vértices na esfera.
 *
 * Cada triângulo é subdividido uma vez antes de projetar: um triângulo grande
 * projetado direto vira uma corda reta que afunda dentro do planeta, e a
 * região aparece mordida nas bordas. Uma subdivisão já cola a face na
 * superfície na escala de um estado.
 */
function preencher(anel: number[][], raio = R * 1.0015): THREE.BufferGeometry | null {
  const contorno = anel.slice(0, -1).map(([lng, lat]) => new THREE.Vector2(lng, lat));
  if (contorno.length < 3) return null;

  let faces: number[][];
  try {
    faces = THREE.ShapeUtils.triangulateShape(contorno, []);
  } catch {
    return null;
  }
  if (!faces.length) return null;

  const pos: number[] = [];
  const emite = (v: THREE.Vector2) => {
    const p = naEsfera(v.y, v.x, raio);
    pos.push(p.x, p.y, p.z);
  };
  const sub = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, nivel: number) => {
    if (nivel === 0) {
      emite(a);
      emite(b);
      emite(c);
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5);
    const bc = b.clone().add(c).multiplyScalar(0.5);
    const ca = c.clone().add(a).multiplyScalar(0.5);
    sub(a, ab, ca, nivel - 1);
    sub(ab, b, bc, nivel - 1);
    sub(ca, bc, c, nivel - 1);
    sub(ab, bc, ca, nivel - 1);
  };

  for (const [ia, ib, ic] of faces) {
    sub(contorno[ia], contorno[ib], contorno[ic], 1);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  return g;
}

/** Centro aproximado de uma feição: média do maior anel. Suficiente para
 *  ancorar um rótulo — centroide exato não muda nada nessa escala. */
function centroDe(f: Poligono): { lat: number; lng: number } {
  const aneis = aneisDe(f.geometry);
  if (!aneis.length) return { lat: 0, lng: 0 };
  const maior = aneis.reduce((a, b) => (b.length > a.length ? b : a));
  let sx = 0;
  let sy = 0;
  for (const [lng, lat] of maior) {
    sx += lng;
    sy += lat;
  }
  return { lng: sx / maior.length, lat: sy / maior.length };
}

/** Ponto-em-polígono clássico (ray casting 2D em lat/lng). */
function dentroDoAnel(lng: number, lat: number, anel: number[][]): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Anel + sua caixa envolvente. A caixa é o que torna a busca barata. */
interface AnelIndexado {
  anel: number[][];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  f: Poligono;
}

/**
 * Pré-indexa os anéis com caixa envolvente.
 *
 * Sem isso, achar o polígono sob o cursor percorre **todos** os anéis de todos
 * os polígonos ponto a ponto — no degrau do mundo são 173 países, e o custo
 * disso a cada quadro é exatamente o travamento que aparecia ao navegar.
 * A caixa descarta quase tudo com quatro comparações.
 */
function indexar(poligonos: Poligono[]): AnelIndexado[] {
  const out: AnelIndexado[] = [];
  for (const f of poligonos) {
    for (const anel of aneisDe(f.geometry)) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [x, y] of anel) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      out.push({ anel, minX, maxX, minY, maxY, f });
    }
  }
  return out;
}

function qualPoligono(indice: AnelIndexado[], lat: number, lng: number): Poligono | null {
  for (const a of indice) {
    if (lng < a.minX || lng > a.maxX || lat < a.minY || lat > a.maxY) continue;
    if (dentroDoAnel(lng, lat, a.anel)) return a.f;
  }
  return null;
}

/**
 * As siglas dos estados, em HTML por cima do canvas.
 *
 * Projetar em HTML em vez de texto 3D: fica nítido em qualquer resolução, é
 * selecionável e acessível, e não custa carregar uma fonte para a GPU. O
 * `useFrame` só escreve `transform` e `opacity` em nós que já existem — não
 * recria nada por quadro.
 */
function Siglas({
  poligonos,
  chave,
  acesos,
  refs,
}: {
  poligonos: Poligono[];
  chave: string;
  acesos: Set<string>;
  refs: React.RefObject<Map<string, HTMLSpanElement>>;
}) {
  const { camera, size } = useThree();

  const ancoras = useMemo(
    () =>
      poligonos.map((f) => {
        const c = centroDe(f);
        return { id: f.properties[chave], v: naEsfera(c.lat, c.lng, R * 1.045) };
      }),
    [poligonos, chave]
  );

  useFrame(() => {
    const mapa = refs.current;
    if (!mapa) return;
    for (const a of ancoras) {
      const el = mapa.get(a.id);
      if (!el) continue;
      // De costas para a câmera? O rótulo some — senão a sigla do outro lado
      // do planeta aparece flutuando no meio do oceano.
      const paraCamera = camera.position.clone().sub(a.v);
      const deFrente = a.v.clone().normalize().dot(paraCamera.normalize()) > 0.12;
      if (!deFrente) {
        el.style.opacity = "0";
        continue;
      }
      const p = a.v.clone().project(camera);
      const x = (p.x * 0.5 + 0.5) * size.width;
      const y = (-p.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%,-50%) translate(${x}px, ${y}px)`;
      el.style.opacity = acesos.has(a.id) ? "1" : "0.42";
    }
  });

  return null;
}

/**
 * A geometria do pino, carregada uma vez para o módulo inteiro.
 *
 * O `.glb` sai do Hunyuan3D (imagem → malha, local, sem crédito) já decimado
 * de 236 mil para 2.840 triângulos — 8,5 MB viraram 30 KB. Carregamos à mão em
 * vez de `useGLTF`: sem Suspense, sem dependência de decoder externo, e se o
 * arquivo faltar o globo continua funcionando com a forma procedural.
 *
 * A malha chega com escala e centro arbitrários (é o que o modelo gera), então
 * normalizamos: centro na origem, altura 1, base no zero. A partir daí ela se
 * comporta como qualquer primitiva.
 */
let geoPino: THREE.BufferGeometry | null = null;
let pinoPedido = false;

function usarPino(): THREE.BufferGeometry | null {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(geoPino);

  useEffect(() => {
    if (geoPino) return;
    if (pinoPedido) return;
    pinoPedido = true;
    new GLTFLoader().load(
      "/3d/pino-radar.glb",
      (gltf) => {
        let achada: THREE.BufferGeometry | null = null;
        gltf.scene.traverse((o) => {
          if (!achada && (o as THREE.Mesh).isMesh) achada = (o as THREE.Mesh).geometry.clone();
        });
        if (!achada) return;
        const g = achada as THREE.BufferGeometry;
        g.computeBoundingBox();
        const bb = g.boundingBox!;
        const tam = new THREE.Vector3();
        bb.getSize(tam);
        const centro = new THREE.Vector3();
        bb.getCenter(centro);
        const alt = Math.max(tam.y, 1e-6);
        // centro na origem em X/Z, base no zero em Y, altura 1
        g.translate(-centro.x, -bb.min.y, -centro.z);
        g.scale(1 / alt, 1 / alt, 1 / alt);
        g.computeVertexNormals();
        geoPino = g;
        setGeo(g);
      },
      undefined,
      () => {
        // Sem o arquivo, os marcadores caem na forma procedural. O radar não
        // depende do ícone para funcionar.
      }
    );
  }, []);

  return geo;
}

/**
 * Os marcadores do radar: um ícone 3D erguido sobre cada lugar com sinal.
 *
 * São geometria, não imagem — e isso é a decisão, não um detalhe. Um ícone
 * desenhado aqui gira, pega luz, reage ao destaque e pesa alguns kilobytes;
 * uma arte gerada seria mais um PNG competindo com o mapa por atenção. O
 * conjunto (haste + anel girando + núcleo pulsando) é o que dá cara de radar,
 * em vez de cara de mapa com bolinhas.
 *
 * ⚠️ A altura é CONSTANTE, de propósito. Até 26/07/2026 ela era proporcional ao
 * volume somado do lugar, o que parecia informação e não era: o feed do Google
 * devolve no máximo 10 assuntos por geo e o volume é relativo à linha de base
 * de cada um, então o marcador do Nordeste subia por ter 9 estados e o de São
 * Paulo afundava apesar dos 44 milhões de habitantes (ver R6 no MASTERPLAN).
 * O marcador diz "há sinal aqui" — que é verdade — e nada além disso.
 */
const ALTURA_PINO = 19;

function Marcadores({
  poligonos,
  chave,
  corDe,
  comSinal,
  acesos,
}: {
  poligonos: Poligono[];
  chave: string;
  corDe: (p: Record<string, string>) => string;
  comSinal: Set<string>;
  acesos: Set<string>;
}) {
  const grupo = useRef<Group>(null);
  const pino = usarPino();

  const pinos = useMemo(
    () =>
      poligonos
        .map((f) => {
          const id = f.properties[chave];
          if (!comSinal.has(id)) return null;
          const c = centroDe(f);
          const normal = naEsfera(c.lat, c.lng, 1).normalize();
          const altura = ALTURA_PINO;
          return {
            id,
            cor: corDe(f.properties),
            altura,
            // Âncora na superfície. Rotação e posição ficam no grupo EXTERNO,
            // que nunca é escalado; tudo que cresce vive em coordenadas locais
            // dentro dele.
            base: normal.clone().multiplyScalar(R * 1.005),
            rot: new THREE.Euler().setFromQuaternion(
              new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
            ),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [poligonos, chave, corDe, comSinal]
  );

  useFrame((state, dt) => {
    const g = grupo.current;
    if (!g) return;

    // Tamanho ANGULAR constante: o marcador tem que ocupar o mesmo espaço na
    // tela de longe e de perto. Sem isso ele fica proporcional ao mundo e, ao
    // aproximar de um estado, um anel de 3 unidades vira um arco que cobre o
    // mapa inteiro — foi exatamente o que apareceu no zoom do Maranhão.
    const escala = state.camera.position.length() / 320;

    for (const ancora of g.children) {
      const aceso = acesos.has(ancora.userData.id as string);

      // ⚠️ Escala vai no grupo INTERNO. Escalar o externo escalaria também a
      // POSIÇÃO dos filhos — com fator 0,7 o marcador ancorado no raio 103
      // ia parar no raio 72, ou seja, dentro do planeta. Foi por isso que os
      // ícones sumiram sem deixar rastro.
      const corpo = ancora.children[0];
      if (!corpo) continue;
      const alvo = escala * (aceso ? 1.45 : 0.9);
      corpo.scale.setScalar(corpo.scale.x + (alvo - corpo.scale.x) * Math.min(1, dt * 6));

      // O anel só varre quando está aceso — movimento perpétuo em 27 estados
      // ao mesmo tempo cansa a vista.
      const anel = corpo.children[1];
      if (anel) anel.rotation.y += dt * (aceso ? 1.6 : 0.18);

      const icone = corpo.children[2];
      if (icone) {
        const b = aceso ? 1.18 + Math.sin(state.clock.elapsedTime * 3.4) * 0.07 : 1;
        icone.scale.setScalar(icone.scale.x + (b - icone.scale.x) * Math.min(1, dt * 8));
        icone.rotation.y += dt * (aceso ? 0.9 : 0.22);
      }
    }
  });

  return (
    <group ref={grupo}>
      {pinos.map((p) => (
        // Externo: ancora e orienta. Nunca escala.
        <group key={p.id} position={p.base} rotation={p.rot} userData={{ id: p.id }}>
          {/* Interno: é o que cresce e encolhe, sempre a partir da superfície. */}
          <group>
            {/* haste */}
            <mesh position={[0, p.altura / 2, 0]}>
              <cylinderGeometry args={[0.18, 0.34, p.altura, 6]} />
              <meshBasicMaterial
                color={p.cor}
                transparent
                opacity={acesos.has(p.id) ? 0.9 : 0.4}
                toneMapped={false}
              />
            </mesh>

            {/* anel de varredura */}
            <mesh position={[0, p.altura, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.35, 0.12, 6, 22]} />
              <meshBasicMaterial
                color={p.cor}
                toneMapped={false}
                transparent
                opacity={acesos.has(p.id) ? 0.95 : 0.5}
              />
            </mesh>

            {/* O ícone: malha própria quando carregada, primitiva enquanto não. */}
            {pino ? (
              <mesh position={[0, p.altura, 0]} geometry={pino} scale={6}>
                <meshStandardMaterial
                  color={p.cor}
                  emissive={p.cor}
                  emissiveIntensity={acesos.has(p.id) ? 0.6 : 0.28}
                  roughness={0.35}
                  metalness={0.45}
                />
              </mesh>
            ) : (
              <mesh position={[0, p.altura, 0]}>
                <icosahedronGeometry args={[0.62, 0]} />
                <meshBasicMaterial color={p.cor} toneMapped={false} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  );
}

function Globo({
  poligonos,
  chave,
  corDe,
  acesos,
  emFoco,
  onEscolher,
  onDestacar,
}: {
  poligonos: Poligono[];
  chave: string;
  corDe: (p: Record<string, string>) => string;
  camada: Camada;
  acesos: Set<string>;
  emFoco: (p: Record<string, string>) => boolean;
  onEscolher: (p: Record<string, string>) => void;
  onDestacar: (p: Record<string, string> | null) => void;
}) {
  const { raycaster, camera } = useThree();
  const esfera = useRef<Mesh>(null);
  const ultimo = useRef<string | null>(null);
  const ultimoPonteiro = useRef({ x: 9, y: 9 });

  const indice = useMemo(() => indexar(poligonos), [poligonos]);

  // As fronteiras viram linhas uma vez por conjunto de polígonos. Ficam
  // ligeiramente acima da superfície para não brigar com ela no z-buffer.
  const fronteiras = useMemo(
    () =>
      poligonos.flatMap((f, iF) =>
        aneisDe(f.geometry).map((anel, iA) => {
          const pontos = anel.map(([lng, lat]) => naEsfera(lat, lng, R * 1.004));
          return {
            chaveReact: `${f.properties[chave] ?? iF}-${iA}`,
            linha: new THREE.BufferGeometry().setFromPoints(pontos),
            face: preencher(anel),
            props: f.properties,
            normal: naEsfera(
              anel.reduce((a, [, la]) => a + la, 0) / anel.length,
              anel.reduce((a, [lo]) => a + lo, 0) / anel.length,
              1
            ).normalize(),
          };
        })
      ),
    [poligonos, chave]
  );

  useEffect(
    () => () =>
      fronteiras.forEach((f) => {
        f.linha.dispose();
        f.face?.dispose();
      }),
    [fronteiras]
  );

  // Hover: raycast contra a esfera (barato e sempre acerta), converte o ponto
  // em lat/lng e descobre o polígono por ponto-em-polígono. Muito mais estável
  // do que tentar acertar uma linha de 1px com o cursor.
  useFrame((state) => {
    const alvo = esfera.current;
    if (!alvo) return;

    // O cursor parado não muda a resposta. Refazer o raycast a cada quadro é
    // trabalho jogado fora — e é trabalho caro.
    const dx = state.pointer.x - ultimoPonteiro.current.x;
    const dy = state.pointer.y - ultimoPonteiro.current.y;
    if (dx * dx + dy * dy < 0.00002) return;
    ultimoPonteiro.current = { x: state.pointer.x, y: state.pointer.y };

    raycaster.setFromCamera(state.pointer, camera);
    const hit = raycaster.intersectObject(alvo, false)[0];
    let id: string | null = null;
    let props: Record<string, string> | null = null;
    if (hit) {
      // Inversa exata de naEsfera(): phi = acos(y), theta = atan2(z, x),
      // com theta = 90 − lng (a convenção de globo: leste cresce no sentido
      // horário visto do polo norte). Usar 90 + lng espelha o planeta inteiro
      // no eixo leste-oeste e faz o arrasto responder ao contrário.
      const p = hit.point.clone().normalize();
      const lat = 90 - (Math.acos(Math.min(1, Math.max(-1, p.y))) * 180) / Math.PI;
      const theta = (Math.atan2(p.z, p.x) * 180) / Math.PI;
      const lng = ((90 - theta + 540) % 360) - 180;
      const f = qualPoligono(indice, lat, lng);
      if (f) {
        props = f.properties;
        id = f.properties[chave];
      }
    }
    if (id !== ultimo.current) {
      ultimo.current = id;
      onDestacar(props);
    }
  });

  // Extrude animado: a feição em foco (ou sob o cursor) sobe alguns décimos de
  // raio. É o gesto que separa "onde estou" de "o resto do país", sem precisar
  // apagar o resto — e é o que faz o hover de um assunto revelar, de relance,
  // que ele também acontece lá longe.
  const grupos = useRef<Map<string, THREE.Group>>(new Map());

  // ⚠️ A elevação vive em `userData.el` de cada grupo. Sem zerar isto na troca
  // de conjunto, um grupo reaproveitado pelo React herda a altura do anterior
  // e o mapa vai "subindo" a cada ida e volta — foi o afastamento progressivo
  // que o Ricardo notou.
  useEffect(() => {
    for (const g of grupos.current.values()) {
      g.userData.el = 0;
      g.position.set(0, 0, 0);
    }
    grupos.current.clear();
  }, [fronteiras]);

  useFrame((_, dt) => {
    for (const f of fronteiras) {
      const g = grupos.current.get(f.chaveReact);
      if (!g) continue;
      const aceso = acesos.has(f.props[chave]);
      const foco = emFoco(f.props);
      const alvo = aceso ? 2.6 : foco ? 0.9 : 0;
      const atualEl = g.userData.el ?? 0;
      const novo = atualEl + (alvo - atualEl) * Math.min(1, dt * 7);
      g.userData.el = novo;
      g.position.copy(f.normal).multiplyScalar(novo);
    }
  });

  return (
    <group>
      {/* O planeta */}
      <mesh
        ref={esfera}
        onClick={() => {
          const f = poligonos.find((x) => x.properties[chave] === ultimo.current);
          if (f) onEscolher(f.properties);
        }}
      >
        <sphereGeometry args={[R, 64, 48]} />
        <meshPhongMaterial
          color="#131a3f"
          emissive="#05070f"
          specular="#243268"
          shininess={10}
        />
      </mesh>

      {/* Atmosfera — casca por trás, vista de dentro, que dá o halo */}
      <mesh>
        <sphereGeometry args={[R * 1.16, 48, 36]} />
        <meshBasicMaterial
          color="#5b7cf5"
          transparent
          opacity={0.075}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* O mapa político: cada região preenchida na sua cor, com o contorno
          por cima. O preenchimento é discreto de propósito — ele precisa dizer
          "aqui é o Sudeste" sem apagar o planeta por baixo. */}
      {fronteiras.map((f) => {
        const aceso = acesos.has(f.props[chave]);
        const foco = emFoco(f.props);
        const cor = corDe(f.props);
        // Fora de foco continua desenhado, só que apagado — presença de
        // contexto, não competição por atenção.
        const opFace = aceso ? 0.62 : foco ? 0.3 : 0.07;
        const opLinha = aceso ? 1 : foco ? 0.85 : 0.22;
        return (
          <group
            key={f.chaveReact}
            ref={(el) => {
              if (el) grupos.current.set(f.chaveReact, el);
              else grupos.current.delete(f.chaveReact);
            }}
          >
            {f.face && (
              <mesh geometry={f.face}>
                <meshBasicMaterial
                  color={cor}
                  transparent
                  opacity={opFace}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}
            <lineLoop geometry={f.linha}>
              <lineBasicMaterial
                color={aceso ? "#ffffff" : cor}
                transparent
                opacity={opLinha}
                toneMapped={false}
              />
            </lineLoop>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Cena
// ---------------------------------------------------------------------------

function Cena(props: {
  poligonos: Poligono[];
  chave: string;
  refsSiglas: React.RefObject<Map<string, HTMLSpanElement>>;
  mostrarSiglas: boolean;
  comSinal: Set<string>;
  corDe: (p: Record<string, string>) => string;
  camada: Camada;
  acesos: Set<string>;
  emFoco: (p: Record<string, string>) => boolean;
  desviado: boolean;
  alvo: AlvoGlobo;
  arrastando: React.RefObject<{ lat: number; lng: number } | null>;
  onEscolher: (p: Record<string, string>) => void;
  onDestacar: (p: Record<string, string> | null) => void;
  onPosicao: (p: AlvoGlobo) => void;
}) {
  return (
    <>
      {/* ⚠️ A câmera vem PRIMEIRO. `useFrame` executa na ordem de montagem, e
          as siglas projetam a posição usando a câmera — se ela for atualizada
          depois, os rótulos ficam um quadro atrasados e "descolam" dos estados
          durante o movimento. Foi o que o Ricardo viu como erro de
          posicionamento no zoom. */}
      <Camera
        alvo={props.alvo}
        arrastando={props.arrastando}
        desviado={props.desviado}
        onPosicao={props.onPosicao}
      />

      {/* Luz baixa de propósito: o globo é um palco escuro para os polígonos,
          e qualquer excesso aqui estoura no Bloom e vira um borrão claro. */}
      <ambientLight intensity={0.42} />
      <directionalLight position={[-260, 180, 300]} intensity={0.9} color="#c7d2fe" />
      <directionalLight position={[300, -140, -180]} intensity={0.35} color="#38bdf8" />

      <Globo
        poligonos={props.poligonos}
        chave={props.chave}
        corDe={props.corDe}
        camada={props.camada}
        acesos={props.acesos}
        emFoco={props.emFoco}
        onEscolher={props.onEscolher}
        onDestacar={props.onDestacar}
      />

      <Marcadores
        poligonos={props.poligonos}
        chave={props.chave}
        corDe={props.corDe}
        comSinal={props.comSinal}
        acesos={props.acesos}
      />

      {props.mostrarSiglas && (
        <Siglas
          poligonos={props.poligonos}
          chave={props.chave}
          acesos={props.acesos}
          refs={props.refsSiglas}
        />
      )}

      <CascaIA ligada={props.camada === "ia"} cor="#a78bfa" />


      <EffectComposer>
        <Bloom intensity={0.42} luminanceThreshold={0.78} luminanceSmoothing={0.35} mipmapBlur />
      </EffectComposer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente público
// ---------------------------------------------------------------------------

export interface RadarGloboProps {
  /** Lugar em foco — define sozinho o que é desenhado */
  lugar: Lugar;
  camada: Camada;
  onEscolher: (props: Record<string, string>) => void;
  /** Tira o mundo do centro para o painel de detalhe entrar ao lado. */
  desviado?: boolean;
  /** Lugares onde há sinal medido — ganham marcador. Presença, não quantidade:
   *  o volume do Google não é comparável entre lugares (R6). */
  comSinal?: Set<string>;
  /** Destaque controlado de fora — é o que liga o globo à lista ao lado.
   *  Aceita vários porque um assunto em alta pode estar em muitos estados. */
  destacado?: string | string[] | null;
  onDestacar?: (props: Record<string, string> | null) => void;
  /** Zoom externo (botões + e −): multiplicador aplicado à altitude */
  zoom: number;
  parado?: boolean;
}

export function RadarGlobo({
  lugar,
  camada,
  onEscolher,
  zoom,
  parado = false,
  destacado = null,
  comSinal = new Set<string>(),
  desviado = false,
  onDestacar,
}: RadarGloboProps) {
  const acesos = useMemo(
    () => new Set(destacado == null ? [] : Array.isArray(destacado) ? destacado : [destacado]),
    [destacado]
  );
  const { poligonos, chave, corDe, emFoco } = useMemo(() => camadaDoLugar(lugar), [lugar]);
  const [nomeSob, setNomeSob] = useState<string | null>(null);
  const refsSiglas = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Sigla no Brasil (regiões) e dentro de uma região (estados). No mundo
  // inteiro, 173 rótulos viram sujeira e escondem o mapa.
  const mostrarSiglas = chave === "uf" || chave === "regiao";
  const arrastando = useRef<{ lat: number; lng: number } | null>(null);
  const posicao = useRef<AlvoGlobo>({ lat: lugar.lat, lng: lugar.lng, alt: lugar.alt });
  const inicio = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);

  const alvo = useMemo<AlvoGlobo>(
    () => ({
      lat: lugar.lat,
      lng: lugar.lng,
      alt: lugar.alt * zoom,
      // O pico da viagem é a vista do lugar-pai: trocar de região passa por
      // uma vista do Brasil, trocar de estado passa por uma da região.
      pico: lugar.pai ? getLugar(lugar.pai).alt : undefined,
    }),
    [lugar, zoom]
  );

  // Um globo que continua girando fora da tela é GPU queimada de graça — e é
  // o que fazia a home travar ao rolar. Fora da viewport, o laço para; ao
  // voltar, volta de onde estava.
  const caixa = useRef<HTMLDivElement>(null);
  const [naTela, setNaTela] = useState(true);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const aoDestacar = (p: Record<string, string> | null) => {
    setNomeSob(p ? (p.nome ?? null) : null);
    onDestacar?.(p);
  };

  // Arrastar: pixels viram graus. A sensibilidade cai com a altitude — perto do
  // chão o mesmo gesto anda menos, como num mapa de verdade.
  const grausPorPixel = () => 0.11 * Math.max(0.25, posicao.current.alt);

  return (
    <div
      ref={caixa}
      className="absolute inset-0 select-none"
      style={{ cursor: "grab", touchAction: "pan-y" }}
      onPointerDown={(e) => {
        inicio.current = {
          x: e.clientX,
          y: e.clientY,
          lat: posicao.current.lat,
          lng: posicao.current.lng,
        };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const i = inicio.current;
        if (!i) return;
        const g = grausPorPixel();
        arrastando.current = {
          lat: i.lat + (e.clientY - i.y) * g,
          lng: i.lng - (e.clientX - i.x) * g,
        };
      }}
      onPointerUp={() => {
        inicio.current = null;
        arrastando.current = null;
      }}
      onPointerLeave={() => {
        inicio.current = null;
        arrastando.current = null;
        aoDestacar(null);
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 320], fov: 42, near: 1, far: 3000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop={parado || !naTela ? "demand" : "always"}
      >
        <color attach="background" args={[NAVY]} />
        <Cena
          poligonos={poligonos}
          chave={chave}
          corDe={corDe}
          camada={camada}
          acesos={acesos}
          desviado={desviado}
          emFoco={emFoco}
          refsSiglas={refsSiglas}
          mostrarSiglas={mostrarSiglas}
          comSinal={comSinal}
          alvo={alvo}
          arrastando={arrastando}
          onEscolher={onEscolher}
          onDestacar={aoDestacar}
          onPosicao={(p) => {
            posicao.current = p;
          }}
        />
      </Canvas>

      {/* As siglas: HTML posicionado pelo `useFrame`. `pointer-events-none`
          para não roubar o clique do globo. */}
      {mostrarSiglas && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {poligonos.map((f) => {
            const id = f.properties[chave];
            return (
              <span
                key={id}
                ref={(el) => {
                  if (el) refsSiglas.current.set(id, el);
                  else refsSiglas.current.delete(id);
                }}
                className="absolute left-0 top-0 text-[10px] font-extrabold tracking-widest text-white"
                style={{ opacity: 0, textShadow: "0 1px 3px rgba(0,0,0,.85)" }}
              >
                {id}
              </span>
            );
          })}
        </div>
      )}

      {/* Nome do lugar sob o cursor — HTML, não textura 3D: sempre legível,
          sempre acessível, e não custa uma fonte extra. */}
      {nomeSob && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 rounded-full px-3 py-1 text-[11px] font-bold bg-black/55 backdrop-blur-sm text-white/90">
          {nomeSob}
        </div>
      )}
    </div>
  );
}
