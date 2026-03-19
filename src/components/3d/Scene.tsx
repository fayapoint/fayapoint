"use client";

import { Suspense, useCallback, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import type { WebGLRenderer } from "three";

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
  // Handle WebGL context loss gracefully (happens during Fast Refresh)
  const onCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("[Scene] WebGL context lost — will auto-restore");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.log("[Scene] WebGL context restored");
    });
  }, []);

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
