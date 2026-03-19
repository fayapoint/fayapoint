"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Mesh, Group } from "three";
import * as THREE from "three";

// =============================================================================
// Anti-Gravity Floating Objects
// Objects drift in zero-g and react to mouse with force-field push
// Uses only basic Three.js geometries to avoid drei HMR issues
// =============================================================================

interface AntiGravityProps {
  position: [number, number, number];
  scale?: number;
  rotSpeed?: number;
  driftSpeed?: number;
  driftRadius?: number;
  mouseForce?: number;
  children: React.ReactNode;
}

function AntiGravity({
  position,
  scale = 1,
  rotSpeed = 0.1,
  driftSpeed = 0.3,
  driftRadius = 0.5,
  mouseForce = 1,
  children,
}: AntiGravityProps) {
  const group = useRef<Group>(null);
  const vel = useRef(new THREE.Vector3());
  const orig = useRef(new THREE.Vector3(...position));
  const { pointer } = useThree();

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Lissajous drift
    const dx = Math.sin(t * driftSpeed + position[0]) * driftRadius;
    const dy = Math.cos(t * driftSpeed * 0.7 + position[1] * 2) * driftRadius * 0.8;
    const dz = Math.sin(t * driftSpeed * 0.5 + position[2]) * driftRadius * 0.4;

    // Mouse repulsion
    const mx = pointer.x * 5;
    const my = pointer.y * 3;
    const distX = group.current.position.x - mx;
    const distY = group.current.position.y - my;
    const dist = Math.sqrt(distX * distX + distY * distY);
    const push = Math.max(0, 1 - dist / 4) * mouseForce * 0.15;
    if (dist > 0.1) {
      vel.current.x += (distX / dist) * push * delta * 60;
      vel.current.y += (distY / dist) * push * delta * 60;
    }
    vel.current.multiplyScalar(0.95);

    group.current.position.set(
      orig.current.x + dx + vel.current.x,
      orig.current.y + dy + vel.current.y,
      orig.current.z + dz + vel.current.z
    );

    group.current.rotation.x += rotSpeed * 0.3 * delta;
    group.current.rotation.y += rotSpeed * 0.4 * delta;
    group.current.rotation.z += rotSpeed * 0.15 * delta;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {children}
    </group>
  );
}

// --- Glass Sphere ---
function GlassSphere({ position, scale = 1, color = "#a855f7" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <AntiGravity position={position} scale={scale} rotSpeed={0.08} driftSpeed={0.25} driftRadius={0.6} mouseForce={1.2}>
      <mesh>
        <icosahedronGeometry args={[1, 4]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
    </AntiGravity>
  );
}

// --- Metallic Cube with rounded look ---
function MetalCube({ position, scale = 1, color = "#ec4899" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <AntiGravity position={position} scale={scale} rotSpeed={0.12} driftSpeed={0.2} driftRadius={0.5} mouseForce={0.8}>
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
    </AntiGravity>
  );
}

// --- Glass Torus ---
function GlassTorus({ position, scale = 1, color = "#06b6d4" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <AntiGravity position={position} scale={scale} rotSpeed={0.15} driftSpeed={0.35} driftRadius={0.4} mouseForce={1}>
      <mesh>
        <torusGeometry args={[1, 0.4, 32, 64]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0.05}
          transmission={0.85}
          thickness={0.4}
          ior={1.4}
          envMapIntensity={1.5}
          clearcoat={1}
        />
      </mesh>
    </AntiGravity>
  );
}

// --- Wireframe Hologram ---
function HologramShape({ position, scale = 1, color = "#a855f7" }: { position: [number, number, number]; scale?: number; color?: string }) {
  const mesh = useRef<Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
  });

  return (
    <AntiGravity position={position} scale={scale} rotSpeed={0.2} driftSpeed={0.4} driftRadius={0.3} mouseForce={1.5}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>
      <mesh scale={0.85}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </AntiGravity>
  );
}

// --- Capsule ---
function GlassPill({ position, scale = 1, color = "#f472b6" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <AntiGravity position={position} scale={scale} rotSpeed={0.1} driftSpeed={0.3} driftRadius={0.55} mouseForce={1}>
      <mesh>
        <capsuleGeometry args={[0.5, 1.2, 16, 32]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.3}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
          ior={1.5}
          envMapIntensity={1.5}
          clearcoat={1}
        />
      </mesh>
    </AntiGravity>
  );
}

// --- Micro floating orbs ---
function FloatingOrbs() {
  const count = 20;
  const orbData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      pos: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2,
      ] as [number, number, number],
      s: 0.03 + Math.random() * 0.08,
      speed: 0.1 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
      color: ["#a855f7", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"][i % 5],
    }));
  }, []);

  return (
    <group>
      {orbData.map((orb, i) => (
        <AntiGravity key={i} position={orb.pos} scale={orb.s} driftSpeed={orb.speed} driftRadius={0.3} mouseForce={0.5} rotSpeed={0}>
          <mesh>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={orb.color} transparent opacity={0.7} />
          </mesh>
        </AntiGravity>
      ))}
    </group>
  );
}

// --- Orbital Ring ---
function OrbitalRing({ radius = 3, color = "#a855f7", speed = 0.15, tilt = 0 }: { radius?: number; color?: string; speed?: number; tilt?: number }) {
  const ring = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z = state.clock.elapsedTime * speed;
    ring.current.rotation.x = tilt + Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <mesh ref={ring}>
      <torusGeometry args={[radius, 0.008, 8, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} />
    </mesh>
  );
}

// =============================================================================
// Main Scene
// =============================================================================

export function FloatingGeometry() {
  return (
    <group>
      {/* Primary — large */}
      <GlassSphere position={[-2.8, 1.2, -1.5]} scale={0.9} color="#a855f7" />
      <MetalCube position={[3.2, -0.5, -2]} scale={0.55} color="#ec4899" />
      <GlassTorus position={[0.5, 2, -2.5]} scale={0.5} color="#06b6d4" />

      {/* Secondary — medium */}
      <GlassSphere position={[3.5, 1.8, -3.5]} scale={0.45} color="#f472b6" />
      <HologramShape position={[-1.5, -1.8, -1]} scale={0.55} color="#06b6d4" />
      <GlassPill position={[-3.5, -0.8, -2.8]} scale={0.5} color="#a855f7" />
      <MetalCube position={[-0.8, -2.5, -3]} scale={0.35} color="#f59e0b" />

      {/* Tertiary — small */}
      <GlassSphere position={[2, -2, -4]} scale={0.3} color="#10b981" />
      <HologramShape position={[4, 0.5, -4.5]} scale={0.35} color="#ec4899" />
      <GlassPill position={[-4, 2, -3.5]} scale={0.3} color="#06b6d4" />

      {/* Orbital rings */}
      <OrbitalRing radius={3.5} color="#a855f7" speed={0.12} tilt={0.3} />
      <OrbitalRing radius={4.5} color="#ec4899" speed={-0.08} tilt={-0.5} />
      <OrbitalRing radius={2.5} color="#06b6d4" speed={0.15} tilt={1.2} />

      {/* Micro debris */}
      <FloatingOrbs />
    </group>
  );
}
