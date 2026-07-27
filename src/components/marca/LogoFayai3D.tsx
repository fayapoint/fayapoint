"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RECEITAS, VARIANTE_ATUAL, type VarianteLogo } from "@/components/marca/logo3d-variantes";

/**
 * O logo em 3D de verdade — WebGL, extrudado a partir dos contornos da fonte.
 *
 * **Por que não uma malha gerada por IA:** o Hunyuan3D é excelente para
 * objetos, mas erra letra, e logo com letra errada não é logo. Aqui os
 * contornos vêm da **própria fonte** (`scripts/logo-svg.py` extrai os glifos
 * com fontTools), então a forma é exatamente a que o navegador desenha em 2D.
 * O 3D só acrescenta profundidade e material — nunca reinterpreta a marca.
 *
 * **Por que só no hover:** WebGL num header custa caro e o header existe em
 * toda página. O canvas é montado quando o cursor chega e desmontado quando
 * sai, então quem nunca passa por cima não paga nada. É o mesmo princípio do
 * globo pausando fora da tela.
 */

const CAMINHO_SVG = "/3d/logo-fayai.svg";

/** Geometria por cor — o "Fay" claro e o "Ai" dourado viram dois grupos. */
interface PecaLogo {
  geo: THREE.BufferGeometry;
  cor: string;
}

/** Uma malha por variante: a extrusão faz parte da leitura, não é só material. */
const cachePecas: Partial<Record<VarianteLogo, PecaLogo[]>> = {};
/** Largura do logo com altura normalizada em 1 — usada para enquadrar. */
let cacheProporcao = 2.8;

function usarLogo(variante: VarianteLogo): PecaLogo[] | null {
  const [pecas, setPecas] = useState<PecaLogo[] | null>(cachePecas[variante] ?? null);

  useEffect(() => {
    const pronto = cachePecas[variante];
    if (pronto) {
      setPecas(pronto);
      return;
    }
    const { extrusao } = RECEITAS[variante];
    new SVGLoader().load(CAMINHO_SVG, (dados) => {
      const brutas: PecaLogo[] = [];
      for (const caminho of dados.paths) {
        const cor = (caminho.userData?.style?.fill as string) ?? "#f3f1ff";
        const formas = SVGLoader.createShapes(caminho);
        for (const forma of formas) {
          const geo = new THREE.ExtrudeGeometry(forma, {
            ...extrusao,
            bevelEnabled: true,
            curveSegments: 6,
          });
          brutas.push({ geo, cor });
        }
      }
      if (!brutas.length) return;

      // O SVG nasce em unidades de fonte e com Y para baixo. Normalizamos uma
      // vez: centro na origem, altura 1, Y para cima — a partir daí a peça se
      // comporta como qualquer primitiva.
      const caixa = new THREE.Box3();
      for (const p of brutas) {
        p.geo.computeBoundingBox();
        caixa.union(p.geo.boundingBox!);
      }
      const tam = new THREE.Vector3();
      caixa.getSize(tam);
      const centro = new THREE.Vector3();
      caixa.getCenter(centro);
      const k = 1 / Math.max(tam.y, 1e-6);
      for (const p of brutas) {
        p.geo.translate(-centro.x, -centro.y, -centro.z);
        p.geo.scale(k, -k, k); // -Y: SVG desce, three sobe
        p.geo.computeVertexNormals();
      }

      cacheProporcao = Math.max(0.5, tam.x / Math.max(tam.y, 1e-6));
      cachePecas[variante] = brutas;
      setPecas(brutas);
    });
  }, [variante]);

  return pecas;
}

function Letras({
  mouse,
  recolhendo,
  demonstrando,
  semente,
  variante,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
  recolhendo: boolean;
  demonstrando: boolean;
  /** Desloca a fase do giro — cada aparição começa de um ângulo diferente. */
  semente: number;
  variante: VarianteLogo;
}) {
  const pecas = usarLogo(variante);
  const grupo = useRef<THREE.Group>(null);
  const entrada = useRef(0);
  const { viewport } = useThree();

  useFrame((state, dt) => {
    const g = grupo.current;
    if (!g) return;

    // `presenca` sobe na entrada e desce no recolhimento — é a mesma curva nos
    // dois sentidos, e é o que faz a saída deixar de ser um corte seco.
    const destino = recolhendo ? 0 : 1;
    entrada.current += (destino - entrada.current) * Math.min(1, dt * (recolhendo ? 6.5 : 3.4));
    const e = recolhendo ? entrada.current : 1 - Math.pow(1 - entrada.current, 3);

    let alvoX: number;
    let alvoY: number;
    if (recolhendo) {
      // Volta ao neutro antes de sumir. Sem isto o logo desaparecia girado
      // para um lado e reaparecia chapado — o pulo que o Ricardo viu.
      alvoX = 0;
      alvoY = 0;
    } else if (demonstrando) {
      // A demonstração: uma volta lenta que mostra o volume por conta própria.
      // A semente desloca a fase: duas aparições seguidas nunca começam do
      // mesmo ângulo, então o giro não lê como um laço.
      const t = state.clock.elapsedTime + semente;
      alvoX = Math.sin(t * 0.9) * 0.16;
      alvoY = Math.sin(t * 1.15) * 0.62;
    } else {
      alvoX = (mouse.current?.y ?? 0) * 0.42;
      alvoY = (mouse.current?.x ?? 0) * 0.75 + (1 - e) * 1.15;
    }

    const vel = recolhendo ? 9 : demonstrando ? 3.2 : 7;
    g.rotation.x += (alvoX - g.rotation.x) * Math.min(1, dt * vel);
    g.rotation.y += (alvoY - g.rotation.y) * Math.min(1, dt * vel);
    // Encolhe um pouco ao sair, em vez de sumir do mesmo tamanho.
    g.scale.setScalar(recolhendo ? 0.82 + e * 0.18 : e);

    for (const filho of g.children) {
      filho.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (m && "opacity" in m) {
          m.transparent = true;
          m.opacity = e;
        }
      });
    }
  });

  // ⚠️ `viewport` (unidades de mundo), não `size` (pixels). A geometria está
  // normalizada para altura 1; medir em pixels aqui joga o logo para uma
  // escala dezenas de vezes maior e o que aparece é o interior de uma letra.
  const escala = useMemo(
    () => Math.min(viewport.height * 0.82, (viewport.width * 0.88) / cacheProporcao),
    [viewport, pecas]
  );

  if (!pecas) return null;

  return (
    <group ref={grupo} scale={0}>
      <group scale={escala}>
        {pecas.map((p, i) => {
          const dourado = p.cor.toLowerCase() === "#f5c04e";

          if (variante === "vidro") {
            // O ouro fica sólido de propósito: se as duas metades virassem
            // vidro, o logo perderia o contraste que o torna legível de longe.
            return dourado ? (
              <mesh key={i} geometry={p.geo}>
                <meshStandardMaterial color={p.cor} metalness={0.95} roughness={0.14} emissive={p.cor} emissiveIntensity={0.18} />
              </mesh>
            ) : (
              <mesh key={i} geometry={p.geo}>
                <meshPhysicalMaterial
                  color="#dfe6ff"
                  transmission={0.92}
                  thickness={1.1}
                  ior={1.46}
                  roughness={0.08}
                  metalness={0}
                  // Sem espessura óptica o vidro vira plástico leitoso.
                  attenuationColor="#7f9cff"
                  attenuationDistance={2.4}
                  clearcoat={1}
                  clearcoatRoughness={0.06}
                />
              </mesh>
            );
          }

          if (variante === "contorno") {
            // Duas passagens: o corpo escuro engole a luz, e uma casca um
            // pouco maior desenhada por dentro (BackSide) escapa só na
            // silhueta — é isso que acende a aresta sem post-processing.
            return (
              <group key={i}>
                <mesh geometry={p.geo} scale={1.035}>
                  <meshBasicMaterial color={dourado ? "#f5c04e" : "#8ab4ff"} side={THREE.BackSide} />
                </mesh>
                <mesh geometry={p.geo}>
                  <meshStandardMaterial color="#0b0f1f" metalness={0.6} roughness={0.85} emissive={dourado ? "#f5c04e" : "#6d8cff"} emissiveIntensity={0.16} />
                </mesh>
              </group>
            );
          }

          return (
            <mesh key={i} geometry={p.geo}>
              <meshStandardMaterial
                color={p.cor}
                metalness={dourado ? 0.85 : 0.35}
                roughness={dourado ? 0.22 : 0.4}
                emissive={p.cor}
                emissiveIntensity={0.12}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function LogoFayai3D({
  mouse,
  recolhendo = false,
  demonstrando = false,
  semente = 0,
  variante = VARIANTE_ATUAL,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
  recolhendo?: boolean;
  demonstrando?: boolean;
  semente?: number;
  variante?: VarianteLogo;
}) {
  return (
    <Canvas
      className="pointer-events-none"
      camera={{ position: [0, 0, 3.2], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      {/* Luz de estúdio curta: o dourado precisa de um brilho especular
          definido para ler como metal, não como amarelo chapado. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.4, 2.2, 3]} intensity={2.1} color="#fff6e2" />
      <directionalLight position={[-2.6, -1.2, 1.6]} intensity={0.8} color="#8ab4ff" />
      <Letras mouse={mouse} recolhendo={recolhendo} demonstrando={demonstrando} semente={semente} variante={variante} />
    </Canvas>
  );
}
