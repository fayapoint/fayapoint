"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LayoutDashboard, BookOpen, Trophy, Gift, Crown } from "lucide-react";
import { ICONES_3D } from "@/data/icones3d";
import { IconeMenu3D } from "@/components/portal/IconeMenu3D";

/**
 * As 17 peças escolhidas, na grade — com UMA tela WebGL para todas.
 *
 * A primeira versão montava um `<Canvas>` por cartão e **isso quebrou de
 * verdade**: medido nesta página, 5 dos 11 contextos vinham com
 * `isContextLost() === true` e os cartões apareciam vazios. Não é precaução
 * teórica — o navegador despeja os contextos mais antigos por volta de
 * dezesseis, e uma varrida de cursor pelo menu de exemplo bastava para
 * estourar.
 *
 * A solução é a que o dashboard vai precisar sempre que quiser 3D em
 * quantidade: **uma tela só, fixa na janela**, com as peças posicionadas em
 * pixels sobre os cartões HTML. Câmera ortográfica com zoom 1 dá unidade de
 * mundo = pixel de tela, então "onde o cartão está" e "onde a peça está" são a
 * mesma conta. Cartão fora da janela simplesmente não desenha.
 */

const GOLD = "#f5c04e";
const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;

/** Onde cada cartão está agora — preenchido pelos próprios cartões. */
type Caixas = Map<string, HTMLElement>;

function Peca({
  url,
  slug,
  caixas,
  aceso,
}: {
  url: string;
  slug: string;
  caixas: React.RefObject<Caixas>;
  aceso: boolean;
}) {
  const gltf = useLoader(GLTFLoader, url);
  const grupo = useRef<THREE.Group>(null);
  const { size } = useThree();

  const cena = useMemo(() => {
    const c = gltf.scene.clone(true);
    const caixa = new THREE.Box3().setFromObject(c);
    const tam = new THREE.Vector3();
    const centro = new THREE.Vector3();
    caixa.getSize(tam);
    caixa.getCenter(centro);
    const k = 1 / Math.max(tam.x, tam.y, tam.z, 1e-6);
    c.position.set(-centro.x * k, -centro.y * k, -centro.z * k);
    c.scale.setScalar(k);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // Navy chapado sobre fundo escuro empasta e a forma some — que é
      // exatamente o que se está tentando julgar aqui.
      m.material = new THREE.MeshStandardMaterial({
        color: "#f6d68a",
        metalness: 0.42,
        roughness: 0.34,
        emissive: "#8a6414",
        emissiveIntensity: 0.2,
      });
    });
    return c;
  }, [gltf]);

  useFrame((estado, dt) => {
    const g = grupo.current;
    if (!g) return;
    const el = caixas.current?.get(slug);
    if (!el) {
      g.visible = false;
      return;
    }
    const r = el.getBoundingClientRect();
    // Fora da janela não desenha: com 17 peças é a diferença entre desenhar
    // quatro e desenhar dezessete a cada quadro.
    if (r.bottom < -40 || r.top > size.height + 40) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(
      r.left + r.width / 2 - size.width / 2,
      size.height / 2 - (r.top + r.height / 2),
      0
    );

    const lado = Math.min(r.width, r.height) * (aceso ? 0.92 : 0.76);
    g.scale.setScalar(g.scale.x + (lado - g.scale.x) * Math.min(1, dt * 9));

    // Balanço, não giro completo: uma peça chata passaria metade do tempo de
    // perfil, e uma lasca na tela lê como falha, não como 3D.
    const t = estado.clock.elapsedTime;
    g.rotation.y = Math.sin(t * (aceso ? 0.85 : 0.42)) * (aceso ? 0.95 : 0.7);
    g.rotation.x = Math.sin(t * 0.31) * 0.12;
  });

  return (
    <group ref={grupo} scale={0}>
      <primitive object={cena} />
    </group>
  );
}

function TelaCompartilhada({
  aceso,
  caixas,
}: {
  aceso: string | null;
  caixas: React.RefObject<Caixas>;
}) {
  return (
    <Canvas
      className="pointer-events-none"
      orthographic
      camera={{ zoom: 1, position: [0, 0, 600], near: 0.1, far: 2000 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "fixed", inset: 0, zIndex: 5, background: "transparent" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[300, 400, 600]} intensity={2.3} color="#fff3d8" />
      <directionalLight position={[-400, -150, 400]} intensity={0.9} color="#8ab4ff" />
      {/* Luz de trás na cor da marca: dá contorno sem clarear a face. */}
      <directionalLight position={[0, 200, -500]} intensity={1.5} color={GOLD} />
      {ICONES_3D.map((i) => (
        <Peca key={i.slug} url={i.opcoes[0].arquivo} slug={i.slug} caixas={caixas} aceso={aceso === i.slug} />
      ))}
    </Canvas>
  );
}

/**
 * O menu do portal, aqui fora.
 *
 * Existe porque o portal fica atrás de login: sem esta faixa não haveria como
 * verificar o comportamento sem entrar na conta de alguém. Usa o MESMO
 * componente e a MESMA regra de um-por-vez da barra lateral.
 */
const AMOSTRA = [
  { id: "dashboard", icone: LayoutDashboard, label: "Dashboard" },
  { id: "courses", icone: BookOpen, label: "Meus Cursos" },
  { id: "achievements", icone: Trophy, label: "Conquistas" },
  { id: "profile", icone: Crown, label: "Meu Perfil" },
  { id: "rewards", icone: Gift, label: "Recompensas" },
];

function MenuDeExemplo() {
  const T = useT();
  const [hover3d, setHover3d] = useState<string | null>(null);

  return (
    <div
      className="rounded-2xl p-2 w-full max-w-[260px]"
      style={{ border: "1px solid rgba(255,255,255,.1)", background: "rgba(10,13,28,.75)" }}
    >
      {AMOSTRA.map((item) => (
        <button
          key={item.id}
          onMouseEnter={() => setHover3d(item.id)}
          onMouseLeave={() => setHover3d((a) => (a === item.id ? null : a))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-white/55 hover:bg-white/[0.06] hover:text-white cursor-pointer"
        >
          <span className="relative shrink-0 block w-5 h-5">
            <item.icone
              size={20}
              className={`transition-all duration-200 ${hover3d === item.id ? "opacity-0 scale-90" : ""}`}
            />
            {hover3d === item.id && <IconeMenu3D slug={item.id} aceso />}
          </span>
          <span className="flex-1 text-left text-sm font-medium">{T(item.label)}</span>
        </button>
      ))}
    </div>
  );
}

export function IconesLab() {
  const T = useT();
  const caixas = useRef<Caixas>(new Map());
  const [aceso, setAceso] = useState<string | null>(null);
  // A tela compartilhada só monta depois dos cartões: sem os retângulos ela
  // não teria onde colocar nada.
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);

  if (ICONES_3D.length === 0) {
    return (
      <p className="text-sm text-white/45">
        
        {T("Nenhuma malha publicada ainda — rode")} <code>scripts/icones3d/publicar.py</code>.
      </p>
    );
  }

  const total = ICONES_3D.reduce((a, i) => a + i.opcoes.reduce((b, o) => b + o.kb, 0), 0);

  return (
    <div>
      <p className="text-sm text-white/55 max-w-2xl mb-4">
        
        {T("As peças que estão no menu do portal — família")}{" "}
        <strong className="text-white/75">{T("sólida")}</strong>{T(", escolhida por ser a única em que nenhuma\n        das dezessete passa de 120 KB (o facetado tinha uma de 340, o emblema uma de 207). No portal\n        elas aparecem")} <strong className="text-white/75">no hover</strong>{T(": a leitura padrão continua\n        sendo o ícone vetorial.")}
      </p>

      <div className="mb-5 flex flex-wrap items-start gap-4">
        <MenuDeExemplo />
        <p className="text-[12px] text-white/45 leading-relaxed max-w-xs pt-1">
          
          {T("É assim que aparece no portal: passe o cursor e o vetorial dá lugar à peça. Só um item\n          desenha por vez — o cursor está sobre um só, e é isso que mantém")}{" "}
          <strong className="text-white/70">um contexto WebGL</strong> no menu inteiro em vez de
          dezessete.
        </p>
      </div>

      {pronto && <TelaCompartilhada aceso={aceso} caixas={caixas} />}

      <div className="relative grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {ICONES_3D.map((icone) => (
          <div
            key={icone.slug}
            onMouseEnter={() => setAceso(icone.slug)}
            onMouseLeave={() => setAceso((a) => (a === icone.slug ? null : a))}
            className="rounded-2xl p-3"
            style={{ border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm tracking-wide" style={bebas}>
                {T(icone.slug)}
              </span>
              <span className="text-[10px] text-white/25">{icone.opcoes[0].kb} KB</span>
            </div>
            {/* A caixa vazia é o ALVO: a peça é desenhada por cima dela, na
                tela compartilhada, e não dentro deste nó. */}
            <div
              ref={(el) => {
                if (el) caixas.current.set(icone.slug, el);
                else caixas.current.delete(icone.slug);
              }}
              className="mt-2 h-[110px] rounded-xl"
              style={{ background: "rgba(0,0,0,.3)" }}
            />
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-white/35">
        {ICONES_3D.length}  {T("peças ·")} {total} KB no total. A grade inteira usa{" "}
        <strong className="text-white/55">{T("uma única tela WebGL")}</strong>{T(", com as peças posicionadas\n        em pixels sobre os cartões — com uma tela por cartão, medido aqui, 5 dos 11 contextos vinham\n        perdidos e os cartões apareciam vazios.")}
      </p>
    </div>
  );
}
