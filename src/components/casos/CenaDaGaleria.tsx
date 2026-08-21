"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import { useContextoWebGL } from "@/components/3d/contexto-webgl";
import { lerInstante, usePrefereCalma } from "./estado";

/**
 * A cena de fundo da galeria: uma TIRA DE FILME que se desenrola pela página.
 *
 * ── A ideia ────────────────────────────────────────────────────────────────
 *
 * A régua do tempo e o 3D são a MESMA coisa. A tira é a carreira: 34 anos de
 * filme correndo, com um quadro aceso por trabalho. Rolar a página é puxar o
 * filme pela moviola — e a cor da tira é a cor do ato em que se está.
 *
 * ── As decisões de custo, que não são estéticas ────────────────────────────
 *
 * • UM contexto WebGL na página inteira. O navegador guarda ~16 por aba e mata
 *   os mais velhos ao estourar — ver `contexto-webgl.ts`. Por isso a cena é
 *   fixa no fundo e as 32 estações são DOM por cima, e não 32 telas.
 * • Os furos da película são desenhados no FRAGMENT SHADER, não em geometria.
 *   Uma tira com 600 furos vazados custaria milhares de triângulos; em shader
 *   custa uma conta por pixel.
 * • A rolagem entra por `ref` (`lerInstante`), nunca por estado do React: a
 *   cena lê a 60 fps e o React não re-renderiza nada.
 */

// ── as seis cores dos seis atos ─────────────────────────────────────────────
/** a tira, em unidades de mundo — a razão entra no shader para o furo sair redondo */
const LARGURA = 2.5;
const ALTURA = 120;

const CORES_ATO = [
  new THREE.Color("#7c4dff"), // I   — A Oficina
  new THREE.Color("#26a69a"), // II  — A Ilha
  new THREE.Color("#d81b60"), // III — O Chefe de Corte
  new THREE.Color("#039be5"), // IV  — O Ar
  new THREE.Color("#1565c0"), // V   — A Rede Global
  new THREE.Color("#2979ff"), // VI  — O Renascimento
];

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vFade;
  uniform float uTempo;
  uniform float uProgresso;
  void main() {
    vUv = uv;
    vec3 p = position;
    // ondulação: a tira respira e torce, mais forte no meio do vão
    float onda = sin(p.y * 0.28 + uTempo * 0.35) * 0.55
               + sin(p.y * 0.11 - uTempo * 0.22) * 0.9;
    p.x += onda;
    p.z += cos(p.y * 0.19 + uTempo * 0.27) * 0.7;
    vFade = smoothstep(0.0, 6.0, abs(p.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying float vFade;
  uniform vec3  uCor;
  uniform vec3  uCorSec;
  uniform float uTempo;
  uniform float uAceso;      // 0..1 — quanto o quadro atual brilha
  uniform float uVelocidade;
  uniform float uRazao;      // altura / largura da tira, em unidades de mundo

  /*
   * ⚠️ A conta tem de ser feita em unidades de LARGURA DA TIRA, não em UV.
   *
   * O plano é 3,4 × 120: uv.y percorre 35 vezes mais mundo que uv.x. Na
   * primeira versão os furos foram desenhados em espaço UV com um fator de
   * correção chutado — e saíram elipses pretas gigantes no meio da película,
   * do tamanho de um quadro. Aqui "v" é medido em larguras de tira, então
   * um furo redondo é redondo de verdade.
   */
  void main() {
    vec2 uv = vUv;
    float v = uv.y * uRazao;                 // 0 → 35,3 (larguras de tira)

    float bordaEsq = step(uv.x, 0.135);
    float bordaDir = step(0.865, uv.x);
    float borda = bordaEsq + bordaDir;
    float janela = 1.0 - borda;

    // ── furos de arrasto: 4 por largura de tira, dos dois lados ──
    float cy = fract(v * 4.0) - 0.5;         // -0,5 → 0,5 (em larguras)
    float cx = bordaEsq > 0.5 ? uv.x - 0.068 : uv.x - 0.932;
    float d = length(vec2(cx * 1.6, cy * 0.9));
    float furo = borda * smoothstep(0.040, 0.030, d);

    /*
     * ── a linha que separa um quadro do outro ──
     * ⚠️ A ordem das bordas do smoothstep importa e já saiu trocada uma vez:
     * com smoothstep(0.5, 0.47, q) o valor é 1 em 94% da janela — ou seja,
     * a "risca fina" pintava a película inteira e a tira virava uma prancha
     * roxa. A risca é onde q está PERTO de 0,5.
     */
    float indice = floor(v * 1.35);
    float q = abs(fract(v * 1.35) - 0.5);
    float quadro = smoothstep(0.47, 0.5, q) * janela;

    /*
     * Cada quadro tem a SUA exposição. Sem isto a janela vira uma prancha
     * roxa lisa atravessando a tela — que foi como saiu na primeira tentativa
     * e não parecia filme nenhum. Película de verdade tem imagem diferente em
     * cada quadro, e é a variação que faz o olho reconhecer o material.
     */
    float exposicao = fract(sin(indice * 12.9898) * 43758.5453);
    float miolo = janela * (0.25 + exposicao * 0.75)
                * (0.55 + 0.45 * sin(v * 9.0 + exposicao * 6.28));

    // ── o clarão que corre pela tira quando se rola depressa ──
    float corrida = exp(-abs(fract(uv.y * 2.0 - uTempo * 0.28) - 0.5) * 11.0)
                  * clamp(abs(uVelocidade) * 1.6, 0.0, 1.0);

    vec3 cor = mix(uCorSec * 0.5, uCor * 0.55, janela);
    cor += uCor * corrida * 0.7;
    cor += uCorSec * quadro * 0.9;
    cor = mix(cor, vec3(1.0), uAceso * 0.05 * quadro);

    // a borda perfurada é quem carrega a leitura; o miolo é quase vidro
    float alfa = (borda * 0.55 + miolo * 0.16 + quadro * 0.75 + corrida * 0.7)
               * (0.30 + vFade * 0.70);
    alfa *= (1.0 - furo);
    if (alfa < 0.004) discard;

    /*
     * ⚠️⚠️ ALFA PRÉ-MULTIPLICADO — a armadilha que custou três rodadas.
     *
     * O contexto do three nasce com premultipliedAlpha: true, e a equação de
     * mistura vira  src*1 + dst*(1-a).  Devolver vec4(cor, a) com a cor CRUA
     * faz a cor entrar INTEIRA, com o alfa servindo só para apagar o fundo —
     * ou seja, alfa 0,05 pintava igual a alfa 1,0. Foi por isso que a tira
     * saía como uma prancha roxa sólida por mais que eu baixasse o número.
     * A cor tem de ser multiplicada pelo alfa aqui, à mão.
     */
    gl_FragColor = vec4(cor * alfa, alfa);
  }
`;

function TiraDeFilme({ calma }: { calma: React.RefObject<boolean> }) {
  const malha = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const corAtual = useRef(CORES_ATO[0].clone());
  const corSecAtual = useRef(new THREE.Color("#00e5c0"));

  const uniforms = useMemo(
    () => ({
      uTempo: { value: 0 },
      uProgresso: { value: 0 },
      uCor: { value: CORES_ATO[0].clone() },
      uCorSec: { value: new THREE.Color("#00e5c0") },
      uAceso: { value: 0 },
      uVelocidade: { value: 0 },
      uRazao: { value: ALTURA / LARGURA },
    }),
    []
  );

  // a tira: um plano MUITO alto, subdividido só no eixo que ondula
  const geo = useMemo(() => new THREE.PlaneGeometry(LARGURA, ALTURA, 1, 240), []);

  useFrame((estado, dt) => {
    const m = material.current;
    const g = malha.current;
    if (!m || !g) return;
    const { progresso, velocidade } = lerInstante();

    const parado = calma.current;
    m.uniforms.uTempo.value += parado ? dt * 0.15 : dt;
    m.uniforms.uProgresso.value = progresso;
    m.uniforms.uVelocidade.value = parado ? 0 : velocidade;

    // a cor do ato, interpolada — a virada de ato é sentida, não vista
    const pos = progresso * (CORES_ATO.length - 1);
    const i = Math.min(CORES_ATO.length - 2, Math.floor(pos));
    const alvo = CORES_ATO[i].clone().lerp(CORES_ATO[i + 1], pos - i);
    corAtual.current.lerp(alvo, 0.03);
    corSecAtual.current.lerp(
      new THREE.Color().setHSL((0.5 + pos * 0.09) % 1, 0.72, 0.62),
      0.03
    );
    m.uniforms.uCor.value.copy(corAtual.current);
    m.uniforms.uCorSec.value.copy(corSecAtual.current);
    m.uniforms.uAceso.value = 0.5 + Math.sin(m.uniforms.uTempo.value * 1.6) * 0.5;

    // a tira desliza: rolar a página é puxar o filme
    g.position.y = -6 + progresso * 96;
    g.rotation.z = Math.sin(progresso * 5.2) * 0.16;
    g.rotation.y = -0.42 + Math.sin(progresso * 3.1) * 0.28;
  });

  return (
    <mesh ref={malha} geometry={geo} position={[5.4, 0, -6]} rotation={[0, -0.42, 0]}>
      {/*
       * ⚠️ Mistura NORMAL, não aditiva. Com aditiva + Bloom a tira virou uma
       * faixa roxa estourada por cima do texto do herói — bonito de longe,
       * ilegível de perto. Fundo é fundo.
       */}
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Poeira de projetor: o feixe de luz de uma sala de exibição.
 * Um `Points` só, com movimento no shader — nada de laço em JS por partícula.
 */
function PoeiraDeProjetor({ n = 700 }: { n?: number }) {
  const pontos = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const fase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
      fase[i] = Math.random() * Math.PI * 2;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("fase", new THREE.BufferAttribute(fase, 1));
    return g;
  }, [n]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTempo: { value: 0 }, uCor: { value: new THREE.Color("#ffd9a0") } },
        vertexShader: /* glsl */ `
          attribute float fase;
          uniform float uTempo;
          varying float vA;
          void main() {
            vec3 p = position;
            p.y += sin(uTempo * 0.22 + fase) * 0.7;
            p.x += cos(uTempo * 0.15 + fase * 1.7) * 0.5;
            vA = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTempo * 0.9 + fase * 3.0));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.2 + 2.0 * vA) * (18.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uCor;
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(uCor, vA * smoothstep(0.5, 0.0, d) * 0.5);
          }
        `,
      }),
    []
  );

  /* o material é lido do próprio objeto, não da variável do `useMemo`:
     mutar o valor memoizado é o que a regra react-hooks/immutability barra */
  useFrame((_, dt) => {
    const p = pontos.current;
    if (!p) return;
    (p.material as THREE.ShaderMaterial).uniforms.uTempo.value += dt;
    p.rotation.y += dt * 0.006;
  });

  return <points ref={pontos} geometry={geo} material={mat} />;
}

/**
 * O aparelho da época — o objeto que representa o ato em cena.
 *
 * Seis aparelhos, um por ato, porque cada era tinha o seu corpo físico: o
 * monitor de tubo, a ilha de fita, o rolo de filme, o drone, a bancada de
 * monitores, o núcleo de silício. Só um fica visível de cada vez, e a troca é
 * uma dissolvência — é a mesma gramática de corte que o dono da página usa.
 */
function Aparelho({ ato, calma }: { ato: number; calma: React.RefObject<boolean> }) {
  const grupo = useRef<THREE.Group>(null);
  /* o ato entra por efeito, não durante a renderização: escrever em ref no
     corpo do componente é o que a regra react-hooks/refs barra — e aqui o
     valor só é lido dentro do useFrame, que roda depois do commit */
  const alvoAto = useRef(ato);
  useEffect(() => {
    alvoAto.current = ato;
  }, [ato]);

  useFrame((estado, dt) => {
    const g = grupo.current;
    if (!g) return;
    const t = estado.clock.elapsedTime;
    const v = calma.current ? 0.15 : 1;
    g.rotation.y += dt * 0.18 * v;
    g.position.y = Math.sin(t * 0.5) * 0.22 * v;
    g.children.forEach((filho, i) => {
      const querVisivel = i === alvoAto.current - 1;
      const alvo = querVisivel ? 1 : 0;
      const s = THREE.MathUtils.lerp(filho.scale.x, alvo, 0.06);
      filho.scale.setScalar(Math.max(0.0001, s));
      filho.visible = s > 0.02;
      filho.rotation.z = Math.sin(t * 0.4 + i) * 0.08;
    });
  });

  const luz = (cor: string) => new THREE.Color(cor);

  return (
    <group ref={grupo} position={[-3.1, 0, -1.6]} scale={0.0001}>
      {/* I — o monitor de tubo de 1992 */}
      <group scale={0.0001}>
        <mesh>
          <boxGeometry args={[1.7, 1.35, 1.5]} />
          <meshStandardMaterial color="#2a2438" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.06, 0.78]}>
          <planeGeometry args={[1.28, 0.94]} />
          <meshBasicMaterial color={luz("#ffb457")} toneMapped={false} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* II — a ilha de fita: dois carretéis girando */}
      <group scale={0.0001}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-0.62, 0, 0]}>
          <torusGeometry args={[0.55, 0.09, 10, 40]} />
          <meshStandardMaterial color="#1f4f4a" emissive={luz("#26a69a")} emissiveIntensity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.62, 0, 0]}>
          <torusGeometry args={[0.55, 0.09, 10, 40]} />
          <meshStandardMaterial color="#1f4f4a" emissive={luz("#26a69a")} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, -0.72, 0]}>
          <boxGeometry args={[2.1, 0.24, 0.9]} />
          <meshStandardMaterial color="#20302f" roughness={0.6} />
        </mesh>
      </group>

      {/* III — o rolo de filme */}
      <group scale={0.0001}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.16, 12, 56]} />
          <meshStandardMaterial color="#5b1030" emissive={luz("#d81b60")} emissiveIntensity={0.6} metalness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 2.5]}>
            <boxGeometry args={[1.7, 0.06, 0.1]} />
            <meshStandardMaterial color="#8d1b46" emissive={luz("#ffd54f")} emissiveIntensity={0.22} />
          </mesh>
        ))}
      </group>

      {/* IV — o drone de 2013: quatro braços, quatro hélices */}
      <group scale={0.0001}>
        <mesh>
          <boxGeometry args={[0.72, 0.26, 0.72]} />
          <meshStandardMaterial color="#eceff1" roughness={0.35} metalness={0.15} />
        </mesh>
        {[
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ].map(([x, z], i) => (
          <group key={i} position={[x * 0.72, 0.06, z * 0.72]}>
            <mesh rotation={[0, (Math.atan2(z, x) * 180) / Math.PI, 0]}>
              <boxGeometry args={[0.62, 0.08, 0.1]} />
              <meshStandardMaterial color="#cfd8dc" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
              <torusGeometry args={[0.34, 0.015, 6, 26]} />
              <meshBasicMaterial color={luz("#4fc3f7")} toneMapped={false} transparent opacity={0.55} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.22, 0.16]}>
          <boxGeometry args={[0.26, 0.2, 0.26]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
      </group>

      {/* V — a bancada de monitores da emissora */}
      <group scale={0.0001}>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * 1.12, 0, -Math.abs(i) * 0.3]} rotation={[0, -i * 0.42, 0]}>
            <planeGeometry args={[1.02, 0.62]} />
            <meshBasicMaterial
              color={luz(i === 0 ? "#ffd600" : "#1565c0")}
              toneMapped={false}
              transparent
              opacity={i === 0 ? 0.8 : 0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[3.3, 0.12, 0.7]} />
          <meshStandardMaterial color="#101a26" />
        </mesh>
      </group>

      {/* VI — o núcleo: a rede que substituiu a ilha */}
      <group scale={0.0001}>
        <mesh>
          <icosahedronGeometry args={[0.92, 1]} />
          <meshBasicMaterial color={luz("#2979ff")} wireframe transparent opacity={0.65} toneMapped={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color={luz("#ffc400")} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Luzes() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 6, 4]} intensity={0.7} color="#ffd9a0" />
      <directionalLight position={[-6, -2, -3]} intensity={0.45} color="#4fc3f7" />
      <pointLight position={[-3, 1, 1]} intensity={1.4} distance={10} decay={2} color="#ffb457" />
    </>
  );
}

export function CenaDaGaleria({ ato }: { ato: number }) {
  const aoCriar = useContextoWebGL();
  const calma = usePrefereCalma();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={aoCriar}
      >
        <color attach="background" args={["#0a0910"]} />
        <fog attach="fog" args={["#0a0910", 9, 26]} />
        <Luzes />
        <TiraDeFilme calma={calma} />
        <PoeiraDeProjetor />
        <Aparelho ato={ato} calma={calma} />
        <EffectComposer>
          <Bloom intensity={0.34} luminanceThreshold={0.72} luminanceSmoothing={0.35} mipmapBlur />
          <Vignette eskil={false} offset={0.24} darkness={0.78} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
