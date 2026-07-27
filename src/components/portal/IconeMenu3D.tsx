"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ICONES_3D } from "@/data/icones3d";

/**
 * O ícone do menu vira 3D quando o cursor chega.
 *
 * Regra do Ricardo, e ela é a razão de isto funcionar: **2D primeiro, 3D no
 * hover**. A primeira leitura continua sendo o ícone vetorial de sempre —
 * instantâneo, nítido em qualquer tamanho, legível por leitor de tela. O 3D é
 * recompensa, não estado padrão.
 *
 * **Um contexto WebGL no menu inteiro, nunca dezessete.** Quem decide quem
 * desenha é a barra lateral (`hover3d`), não cada item: o cursor só está sobre
 * um item de cada vez, então só um `<Canvas>` existe. Sem esse controle, uma
 * varrida rápida pela lista empilharia canvases enquanto os anteriores ainda
 * saem — e o navegador para de criar contexto por volta de dezesseis.
 *
 * A malha vem do Hunyuan3D sem textura, de propósito: a cor é material daqui,
 * na paleta do portal, então acompanha o tema em vez de vir pintada no arquivo.
 */

const CAMINHOS = new Map(ICONES_3D.map((i) => [i.slug, i.opcoes[0]?.arquivo]).filter(([, a]) => !!a) as [string, string][]);

/** Existe peça 3D para este item de menu? */
export function temIcone3D(slug: string) {
  return CAMINHOS.has(slug);
}

function Peca({ url, aceso }: { url: string; aceso: boolean }) {
  const gltf = useLoader(GLTFLoader, url);
  const grupo = useRef<THREE.Group>(null);
  const entrada = useRef(0);

  // Normaliza para caber num cubo de lado 1 e centra na origem: as malhas
  // saem do Hunyuan3D em escalas e posições soltas.
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
      m.material = new THREE.MeshStandardMaterial({
        color: "#f6d68a",
        metalness: 0.42,
        roughness: 0.34,
        emissive: "#8a6414",
        emissiveIntensity: 0.22,
      });
    });
    return c;
  }, [gltf]);

  useFrame((estado, dt) => {
    const g = grupo.current;
    if (!g) return;
    entrada.current += ((aceso ? 1 : 0) - entrada.current) * Math.min(1, dt * 9);
    const e = 1 - Math.pow(1 - entrada.current, 3);

    // Balanço, não giro completo: girando 360° a peça passa parte do tempo de
    // perfil e some — num quadrado de 40px isso lê como falha, não como 3D.
    const t = estado.clock.elapsedTime;
    g.rotation.y = Math.sin(t * 1.15) * 0.75;
    g.rotation.x = Math.sin(t * 0.42) * 0.14;
    g.scale.setScalar(e);
  });

  return (
    <group ref={grupo} scale={0}>
      <primitive object={cena} />
    </group>
  );
}

export function IconeMenu3D({ slug, aceso }: { slug: string; aceso: boolean }) {
  const url = CAMINHOS.get(slug);
  if (!url) return null;

  return (
    <span
      aria-hidden
      // Maior que o ícone 2D e transbordando a caixa dele: em 20px um volume
      // não se vê, e o ganho do 3D é justamente o volume.
      className="pointer-events-none absolute -inset-[11px] block"
    >
      <Canvas
        camera={{ position: [0, 0.2, 2.5], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 2.5, 3]} intensity={2.3} color="#fff3d8" />
        <directionalLight position={[-2.5, -1, 2]} intensity={0.9} color="#8ab4ff" />
        {/* Luz de trás: dá contorno para a peça não afundar no fundo escuro. */}
        <directionalLight position={[0, 1, -3]} intensity={1.4} color="#f5c04e" />
        <Suspense fallback={null}>
          <Peca url={url} aceso={aceso} />
        </Suspense>
      </Canvas>
    </span>
  );
}
