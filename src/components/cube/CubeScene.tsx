"use client";

import { FACES } from "./cube-data";
import { CubeFace } from "./CubeFace";
import s from "./cube.module.css";

interface CubeSceneProps {
  rx: number;
  ry: number;
}

export function CubeScene({ rx, ry }: CubeSceneProps) {
  return (
    <div className={s.scene}>
      <div
        className={s.cube}
        style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}
      >
        {FACES.map((config) => (
          <CubeFace key={config.face} config={config} />
        ))}
      </div>
    </div>
  );
}
