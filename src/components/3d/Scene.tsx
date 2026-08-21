"use client";

import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";

import { useContextoWebGL } from "@/components/3d/contexto-webgl";

interface SceneProps {
  children: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov: number };
}

export function Scene({
  children,
  className = "",
  camera = { position: [0, 0, 5], fov: 75 },
}: SceneProps) {
  // Perda de contexto tratada (deixa o navegador restaurar) e contexto
  // devolvido no desmonte — sem isso cada cena que sai de cena deixa um
  // contexto pendurado até o teto do navegador estourar. Ver `contexto-webgl`.
  const onCreated = useContextoWebGL();

  return (
    <Canvas
      className={className}
      camera={camera}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={onCreated}
    >
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
