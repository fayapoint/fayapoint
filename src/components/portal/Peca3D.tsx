"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Uma peça 3D numa tela WebGL própria — o tijolo compartilhado do portal.
 *
 * Extraído de `IconeMenu3D` em 27/07 quando o perfil social passou a precisar
 * do mesmo comportamento: a malha, a normalização, o material e o balanço são
 * idênticos; o que muda é o catálogo e o tamanho.
 *
 * ⚠️ **A regra que não pode ser quebrada por quem usar isto:** o navegador
 * para de criar contexto WebGL por volta de dezesseis. Quem monta este
 * componente é o CONTÊINER (a barra lateral, a grade de cartões), decidindo
 * qual único item está sob o cursor. Montar um por item significa uma varrida
 * de cursor derrubando a página — foi medido, com 5 de 11 contextos perdidos.
 */

function Malha({ url, aceso, balanco }: { url: string; aceso: boolean; balanco: number }) {
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
    // perfil e some — num quadrado pequeno isso lê como falha, não como 3D.
    const t = estado.clock.elapsedTime;
    g.rotation.y = Math.sin(t * 1.15) * balanco;
    g.rotation.x = Math.sin(t * 0.42) * 0.14;
    g.scale.setScalar(e);
  });

  return (
    <group ref={grupo} scale={0}>
      <primitive object={cena} />
    </group>
  );
}

export function Peca3D({
  url,
  aceso,
  balanco = 0.75,
  className,
}: {
  url: string;
  aceso: boolean;
  /** Amplitude do balanço em radianos. ±0,75 no menu; mais folgado em cartão grande. */
  balanco?: number;
  className?: string;
}) {
  /**
   * ⚠️ **O empurrão que faz a peça sair de 300x150.**
   *
   * O `<Canvas>` do r3f monta com o tamanho padrão do HTML e só se remede
   * quando o medidor dele acorda. Medido em produção: contêiner 89x80, buffer
   * **300x150** — a peça desenhava com o dobro da proporção e transbordava o
   * ícone. Um `resize` da janela disparado do console corrigia na hora.
   *
   * Duas tentativas que NÃO funcionaram, para ninguém repetir:
   * 1. `setSize` de dentro da cena — o r3f reconcilia o tamanho a partir da
   *    própria medição e sobrescreve no render seguinte.
   * 2. Um componente `useThree` dentro do `<Canvas>` — **o efeito não roda**
   *    (instrumentado: a marca global nunca aparecia). Filho de `<Canvas>` vive
   *    no reconciliador do three, e contar com o ciclo de vida do DOM ali é
   *    contar com a coisa errada.
   *
   * Então a correção mora aqui fora, em React comum. O custo de um `resize`
   * global seria remedir toda tela WebGL da página — mas o desenho garante **no
   * máximo uma** (quem decide qual peça desenha é o contêiner), então não há
   * outra para incomodar.
   */
  useEffect(() => {
    const relogios = [60, 220, 500].map((ms) =>
      setTimeout(() => window.dispatchEvent(new Event("resize")), ms)
    );
    return () => relogios.forEach(clearTimeout);
  }, [url]);

  return (
    // ⚠️ `[&_canvas]:!w-full [&_canvas]:!h-full` não é enfeite.
    //
    // O `<Canvas>` do r3f estica o DIV que ele cria, mas o elemento `<canvas>`
    // lá dentro fica no tamanho padrão do HTML — **300x150**. Medido: o
    // contêiner ia a 89x80 e a tela continuava 300x150, ou seja, a peça
    // desenhava fora de escala e transbordando a caixa do ícone.
    //
    // Isso vale para todo lugar que usar este componente, inclusive a barra
    // lateral do portal, onde o defeito passou despercebido porque o menu fica
    // atrás de login e a verificação da sessão anterior foi só por contagem de
    // contextos, não por medida de tamanho.
    <span aria-hidden className={`${className ?? ""} [&_canvas]:!h-full [&_canvas]:!w-full`}>
      <Canvas
        camera={{ position: [0, 0.2, 2.5], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 2.5, 3]} intensity={2.3} color="#fff3d8" />
        <directionalLight position={[-2.5, -1, 2]} intensity={0.9} color="#8ab4ff" />
        {/* Luz de trás: dá contorno para a peça não afundar no fundo escuro. */}
        <directionalLight position={[0, 1, -3]} intensity={1.4} color="#f5c04e" />
        <Suspense fallback={null}>
          <Malha url={url} aceso={aceso} balanco={balanco} />
        </Suspense>
      </Canvas>
    </span>
  );
}
