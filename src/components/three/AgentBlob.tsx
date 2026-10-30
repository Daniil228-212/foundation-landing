"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { easing } from "maath";
import type { Agent } from "@/content/agents";
import { useFoundation } from "@/store/foundation";
import { anchorToWorld } from "./stage";

/**
 * Мини-агент: та же семья, что и Фундик (желейная сфера, висячие ушки, большие глаза),
 * свой цвет и аксессуар. Позиция — DOM-слот [data-agent-slot]. По наведению «просыпается».
 */
export function AgentBlob({ agent }: { agent: Agent }) {
  const g = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Mesh[]>([]);
  const el = useRef<Element | null>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const live = useRef({ wake: 0, s: 0, ready: false });

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: agent.gated ? "#77736c" : agent.color,
        roughness: 0.38,
        metalness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.25,
        sheen: 0.8,
        sheenColor: new THREE.Color("#ffffff"),
      }),
    [agent],
  );

  useFrame((state, dt) => {
    const grp = g.current;
    if (!grp) return;
    const s = useFoundation.getState();
    if (!el.current) el.current = document.querySelector(`[data-agent-slot="${agent.id}"]`);
    if (!el.current || s.phase === "gate" || s.phase === "intro") {
      grp.visible = false;
      return;
    }
    const rect = state.gl.domElement.getBoundingClientRect();
    // плоскость ближе к камере: лента на мобильном не уходит «под» глянцевый пол
    const a = anchorToWorld(el.current, rect, state.camera, pos, 4);
    grp.visible = a.visible;
    if (!a.visible) return;

    const L = live.current;
    const hovered = s.hoveredAgent === agent.id;
    easing.damp(L, "wake", hovered && !agent.gated ? 1 : 0, 0.18, dt);
    // проявление: из «сдутого» состояния 0.6, а не из нуля
    easing.damp(L, "s", 1, 0.6, dt);
    const t = state.clock.elapsedTime + agent.id.length;
    const bob = Math.sin(t * (1.2 + L.wake * 2.2)) * a.radius * (0.04 + L.wake * 0.06);
    grp.position.set(a.center.x, a.center.y + bob, 4);
    grp.scale.setScalar(a.radius * 0.78 * (0.6 + 0.4 * L.s) * (1 + L.wake * 0.14));
    grp.rotation.set(-0.08, Math.sin(t * 0.5) * 0.25 + state.pointer.x * 0.3, Math.sin(t * 0.7) * 0.05);
    // сонные веки: открываются по наведению; заблокированный агент спит
    const lid = agent.gated ? 1.45 : 0.75 - L.wake * 0.95;
    lids.current.forEach((m) => m && (m.rotation.x = lid));
  });

  const eye = (x: number, i: number) => (
    <group key={x} position={[x, 0.18, 0.86]} scale={[1, 1.1, 0.7]}>
      <mesh>
        <sphereGeometry args={[0.27, 24, 20]} />
        <meshPhysicalMaterial color="#fbf8f1" roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.02, 0.2]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.15, 18, 14]} />
        <meshStandardMaterial color="#120b05" />
      </mesh>
      <mesh position={[0.06, 0.06, 0.27]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
      <mesh
        ref={(m) => {
          if (m) lids.current[i] = m;
        }}
        material={mat}
      >
        <sphereGeometry args={[0.285, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );

  return (
    <group ref={g} visible={false}>
      <mesh material={mat}>
        <sphereGeometry args={[1, 48, 40]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} material={mat} position={[sd * 0.78, 0.5, -0.1]} rotation={[0.1, 0, sd * -1.2]} scale={[0.22, 0.55, 0.1]}>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
      ))}
      {eye(-0.34, 0)}
      {eye(0.34, 1)}
      <mesh position={[0, -0.38, 0.9]} rotation={[0.35, 0, Math.PI]}>
        <torusGeometry args={[0.2, 0.04, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#3a160a" />
      </mesh>

      {agent.id === "designer" && (
        <mesh position={[0.1, 0.92, 0]} rotation={[0, 0, -0.25]} scale={[0.82, 0.22, 0.82]}>
          <sphereGeometry args={[1, 28, 16]} />
          <meshStandardMaterial color="#2b2340" roughness={0.8} />
        </mesh>
      )}
      {agent.id === "marketer" && (
        <mesh position={[1.05, 0.05, 0.25]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.24, 0.5, 20, 1, true]} />
          <meshStandardMaterial color="#ece8e1" side={THREE.DoubleSide} />
        </mesh>
      )}
      {agent.id === "analyst" &&
        [-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.18, 1.06]}>
            <torusGeometry args={[0.3, 0.035, 8, 32]} />
            <meshStandardMaterial color="#1c2b2a" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      {agent.id === "interviewer" && (
        <>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[1.06, 0.05, 8, 40, Math.PI]} />
            <meshStandardMaterial color="#1f2a1c" />
          </mesh>
          <mesh position={[0.82, -0.62, 0.55]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color="#1f2a1c" />
          </mesh>
        </>
      )}
      {agent.id === "developer" && (
        <mesh position={[0, 0.62, 0.3]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.85, 0.08, 10, 40]} />
          <meshStandardMaterial color="#2a2118" metalness={0.5} roughness={0.35} />
        </mesh>
      )}
    </group>
  );
}
