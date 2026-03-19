"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScrollCameraProps {
  scrollProgress: { current: number };
}

export function ScrollCamera({ scrollProgress }: ScrollCameraProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const t = scrollProgress.current;

    // Camera path: starts front-center, drifts right and down as user scrolls
    targetPos.current.set(
      Math.sin(t * Math.PI * 0.5) * 2,
      -t * 1.5,
      5 - t * 2
    );

    targetLookAt.current.set(
      Math.sin(t * Math.PI * 0.3) * 0.5,
      -t * 1,
      0
    );

    camera.position.lerp(targetPos.current, 0.05);
    const lookTarget = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 0, 0),
      targetLookAt.current,
      0.05
    );
    camera.lookAt(targetLookAt.current);
  });

  return null;
}
