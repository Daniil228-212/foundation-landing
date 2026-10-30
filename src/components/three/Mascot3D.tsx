"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { useFoundation, type MascotState } from "@/store/foundation";
import { makeSquishy } from "./shaders";
import { stage } from "./stage";

/**
 * «Фундик» — процедурный 3D-маскот. Никаких .gltf: всё геометрией в коде.
 * Локальные единицы: радиус головы = 1. Корневая группа масштабируется под кольцо.
 */

type Pose = {
  lid: number; // 0 открыт … 1 закрыт
  lidTilt: number; // >0 — внутренние углы век опущены (нахмурен)
  mouth: number; // раскрытие улыбки
  lean: number; // наклон вперёд к пользователю
  tilt: number; // наклон головы вбок
  ears: number; // подъём ушей
  gx: number; // взгляд
  gy: number;
  hand: "rim" | "wave" | "scratch" | "stop" | "rest";
};

const POSES: Record<MascotState, Pose> = {
  idle: { lid: 0.12, lidTilt: 0, mouth: 0.85, lean: 0.04, tilt: 0, ears: 0, gx: 0, gy: 0, hand: "rim" },
  listening: { lid: 0.02, lidTilt: -0.08, mouth: 0.7, lean: 0.26, tilt: 0.14, ears: 0.35, gx: 0, gy: -0.7, hand: "rim" },
  thinking: { lid: 0.3, lidTilt: 0, mouth: 0.35, lean: 0.02, tilt: -0.16, ears: 0.1, gx: 0.7, gy: 0.75, hand: "scratch" },
  challenging: { lid: 0.42, lidTilt: 0.32, mouth: 0.18, lean: 0.3, tilt: 0, ears: -0.25, gx: 0, gy: -0.1, hand: "rim" },
  approving: { lid: 0.32, lidTilt: -0.2, mouth: 1.25, lean: 0.12, tilt: 0.08, ears: 0.45, gx: 0, gy: 0, hand: "rim" },
  blocking: { lid: 0.3, lidTilt: 0.26, mouth: 0.2, lean: 0.2, tilt: 0, ears: -0.15, gx: 0, gy: 0, hand: "stop" },
  greeting: { lid: 0.02, lidTilt: -0.15, mouth: 1.3, lean: 0.05, tilt: 0.12, ears: 0.5, gx: 0, gy: 0, hand: "wave" },
};

const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function surface(x: number, y: number) {
  return new THREE.Vector3(x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))).normalize();
}

type EyeRefs = { iris: THREE.Group; lid: THREE.Mesh; lidPivot: THREE.Group };

function Eye({ side, target }: { side: -1 | 1; target: React.MutableRefObject<EyeRefs | null> }) {
  const p = useMemo(() => surface(0.38 * side, 0.2), [side]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(Z, p), [p]);
  const iris = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Mesh>(null);
  const lidPivot = useRef<THREE.Group>(null);
  useEffect(() => {
    if (iris.current && lid.current && lidPivot.current)
      target.current = { iris: iris.current, lid: lid.current, lidPivot: lidPivot.current };
  }, [target]);
  return (
    <group position={p.clone().multiplyScalar(0.9)} quaternion={q}>
      <group scale={[1, 1.12, 0.78]}>
        <mesh>
          <sphereGeometry args={[0.34, 40, 32]} />
          <meshPhysicalMaterial color="#fbf8f1" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <group ref={iris}>
          <mesh position={[0, 0, 0.27]} scale={[1, 1, 0.42]}>
            <sphereGeometry args={[0.2, 32, 24]} />
            <meshStandardMaterial color="#6b4512" roughness={0.35} emissive="#3a2205" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.335]} scale={[1, 1, 0.4]}>
            <sphereGeometry args={[0.105, 24, 16]} />
            <meshStandardMaterial color="#0b0603" roughness={0.2} />
          </mesh>
          <mesh position={[0.07, 0.08, 0.36]}>
            <sphereGeometry args={[0.042, 12, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[-0.06, -0.07, 0.35]}>
            <sphereGeometry args={[0.02, 10, 8]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
        {/* верхнее веко: полусфера цвета тела, вращается вокруг X */}
        <group ref={lidPivot}>
          <mesh ref={lid} rotation={[-0.5, 0, 0]}>
            <sphereGeometry args={[0.355, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#ffcf3f" roughness={0.45} clearcoat={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function Mascot3D() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lower = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const handL = useRef<THREE.Group>(null);
  const handR = useRef<THREE.Group>(null);
  const eyeL = useRef<EyeRefs | null>(null);
  const eyeR = useRef<EyeRefs | null>(null);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0.035 } }), []);
  const skin = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#FFD54F",
      roughness: 0.4,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.32,
      sheen: 1,
      sheenColor: new THREE.Color("#fff2c2"),
      sheenRoughness: 0.55,
      transmission: stage.tier === "high" ? 0.3 : 0,
      thickness: 1.4,
      ior: 1.35,
      attenuationColor: new THREE.Color("#ffae00"),
      attenuationDistance: 2.2,
    });
    return makeSquishy(m, uniforms);
  }, [uniforms]);
  const limb = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: "#FFD54F",
      roughness: 0.42,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.32,
      sheen: 1,
      sheenColor: new THREE.Color("#fff2c2"),
      sheenRoughness: 0.55,
    });
  }, []);

  // живые значения (демпфируются каждый кадр)
  const live = useRef({
    lid: 0.1,
    lidTilt: 0,
    mouth: 0.8,
    lean: 0,
    tilt: 0,
    ears: 0,
    gx: 0,
    gy: 0,
    earVel: 0,
    earOff: 0,
    lastY: 0,
    nod: 0,
    blinkAt: 2,
    blinkT: 0,
    peek: new THREE.Vector3(),
    peekScale: 0.5,
    hL: new THREE.Vector3(-0.85, -1.55, 0.35),
    hR: new THREE.Vector3(0.85, -1.55, 0.35),
    prevState: "idle" as MascotState,
  });

  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), mid: new THREE.Vector3(), dir: new THREE.Vector3(), w: new THREE.Vector3() }),
    [],
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g || !body.current || !head.current) return;
    dt = Math.min(dt, 1 / 20);
    const t = state.clock.elapsedTime;
    const I = stage.intro;
    const L = live.current;
    const s = useFoundation.getState();
    const pose = POSES[s.mascot];

    g.visible = I.mode !== "hidden";
    if (!g.visible) return;

    uniforms.uTime.value = t;
    uniforms.uAmp.value = s.mascot === "thinking" ? 0.05 : 0.035;

    // ---------- позиция корня ----------
    const R = stage.ring.radius;
    const hR = R * 0.36;
    if (I.mode === "intro") {
      g.position.set(I.mX, I.mY, I.mZ);
      g.scale.setScalar(I.mScale);
      L.peek.copy(g.position);
      L.peekScale = I.mScale;
    } else {
      const c = stage.ring.center;
      const float = Math.sin(t * 0.9) * 0.05 * hR;
      tmp.a.set(c.x, c.y + R + 0.6 * hR + float, -1.35 * hR);
      easing.damp3(L.peek, tmp.a, 0.55, dt);
      L.peekScale = THREE.MathUtils.damp(L.peekScale, hR, 4, dt);
      g.position.copy(L.peek);
      g.scale.setScalar(L.peekScale);
    }

    // squash & stretch (приземление, прыжок)
    const sq = I.mode === "intro" ? I.squash : 0;
    const breathe = 1 + Math.sin(t * ((2 * Math.PI) / 4)) * 0.015;
    body.current.scale.set((1 + sq * 0.5) * breathe, (1 - sq) * breathe, 1 + sq * 0.5);
    // туловище и ножки нужны только в заставке — за окном они не видны
    if (lower.current) lower.current.visible = I.mode === "intro";

    // ---------- позы ----------
    if (s.mascot !== L.prevState) {
      if (s.mascot === "approving") L.nod = 1;
      L.prevState = s.mascot;
    }
    L.nod = Math.max(0, L.nod - dt * 0.9);
    const nod = Math.sin(L.nod * Math.PI * 4) * 0.16 * L.nod;

    easing.damp(L, "lid", pose.lid, 0.12, dt);
    easing.damp(L, "lidTilt", pose.lidTilt, 0.15, dt);
    easing.damp(L, "mouth", pose.mouth, 0.14, dt);
    easing.damp(L, "lean", pose.lean, 0.35, dt);
    easing.damp(L, "tilt", pose.tilt, 0.35, dt);
    easing.damp(L, "ears", pose.ears, 0.3, dt);

    // взгляд: idle — за курсором, иначе — по позе
    const followPointer = s.mascot === "idle" || s.mascot === "greeting";
    const tgx = followPointer ? stage.pointer.x * 0.9 : pose.gx;
    const tgy = followPointer ? stage.pointer.y * 0.7 : pose.gy;
    easing.damp(L, "gx", tgx, 0.12, dt);
    easing.damp(L, "gy", tgy, 0.12, dt);

    head.current.rotation.set(L.lean + nod - L.gy * 0.08, L.gx * 0.22, L.tilt + Math.sin(t * 0.6) * 0.02);
    g.rotation.set(0, 0, 0);

    // моргание раз в 3–6 с
    L.blinkAt -= dt;
    if (L.blinkAt <= 0) {
      L.blinkT = 0.16;
      L.blinkAt = 3 + Math.random() * 3;
    }
    L.blinkT = Math.max(0, L.blinkT - dt);
    const blink = L.blinkT > 0 ? Math.sin((L.blinkT / 0.16) * Math.PI) : 0;

    [eyeL.current, eyeR.current].forEach((e, i) => {
      if (!e) return;
      const side = i === 0 ? -1 : 1;
      e.iris.position.set(L.gx * 0.075, L.gy * 0.07, 0);
      const lidAmt = Math.min(1, L.lid + blink * (1 - L.lid));
      e.lid.rotation.x = -1.15 + lidAmt * 2.55;
      e.lidPivot.rotation.z = side * -L.lidTilt;
    });

    if (mouth.current) mouth.current.scale.set(0.9 + L.mouth * 0.14, 0.35 + L.mouth * 0.65, 1);

    // уши: пружина + инерция от вертикального движения
    const vy = (g.position.y - L.lastY) / Math.max(dt, 1e-3) / Math.max(g.scale.x, 0.05);
    L.lastY = g.position.y;
    const force = -L.earOff * 60 - L.earVel * 7 - vy * 0.9;
    L.earVel += force * dt;
    L.earOff += L.earVel * dt;
    const droop = 1.95 - L.ears * 0.55 + THREE.MathUtils.clamp(L.earOff, -0.6, 0.6);
    if (earL.current) earL.current.rotation.set(0.15, 0, droop + Math.sin(t * 1.3) * 0.03);
    if (earR.current) earR.current.rotation.set(0.15, 0, -droop - Math.sin(t * 1.3 + 1) * 0.03);

    // ---------- руки (IK: плечо → цель кисти) ----------
    const hand = I.mode === "intro" ? (I.wave > 0.01 ? "wave" : "rest") : pose.hand;
    const targetFor = (side: -1 | 1, out: THREE.Vector3) => {
      const rimTarget = () => {
        const c = stage.ring.center;
        const x = c.x + side * 0.72 * hR;
        const y = c.y + Math.sqrt(Math.max(0, R * R - (x - c.x) ** 2)) - 0.02 * hR;
        tmp.w.set(x, y, 0.28 * hR);
        return g.worldToLocal(out.copy(tmp.w));
      };
      if (hand === "rest") return out.set(side * 0.9, -1.55, 0.35);
      if (hand === "rim") return rimTarget();
      if (hand === "wave") {
        if (side === 1) return out.set(1.2 + Math.sin(t * 9) * 0.16, 0.45 + Math.cos(t * 9) * 0.05, 0.5);
        return I.mode === "intro" ? out.set(-0.9, -1.55, 0.35) : rimTarget();
      }
      if (hand === "scratch") {
        if (side === 1) return out.set(0.78 + Math.sin(t * 14) * 0.04, 0.82 + Math.cos(t * 14) * 0.05, 0.25);
        return rimTarget();
      }
      // stop
      if (side === 1) return out.set(0.25, 0.05, 1.45);
      return rimTarget();
    };
    targetFor(-1, tmp.a);
    targetFor(1, tmp.b);
    easing.damp3(L.hL, tmp.a, 0.16, dt);
    easing.damp3(L.hR, tmp.b, 0.16, dt);

    const placeArm = (arm: THREE.Mesh | null, handG: THREE.Group | null, side: -1 | 1, h: THREE.Vector3) => {
      if (!arm || !handG) return;
      const sh = tmp.mid.set(side * 0.62, -0.95, 0.05);
      tmp.dir.copy(h).sub(sh);
      const len = tmp.dir.length();
      arm.position.copy(sh).addScaledVector(tmp.dir, 0.5);
      arm.quaternion.setFromUnitVectors(Y, tmp.dir.normalize());
      arm.scale.set(1, len, 1);
      handG.position.copy(h);
      handG.quaternion.copy(arm.quaternion);
    };
    placeArm(armL.current, handL.current, -1, L.hL);
    placeArm(armR.current, handR.current, 1, L.hR);
  });

  const mitten = (
    <>
      <mesh material={limb} scale={[1.15, 0.85, 1]}>
        <sphereGeometry args={[0.18, 24, 18]} />
      </mesh>
      <mesh material={limb} position={[0.13, -0.04, 0.05]}>
        <sphereGeometry args={[0.07, 12, 10]} />
      </mesh>
    </>
  );

  return (
    <group ref={root} visible={false}>
      <group ref={body}>
        {/* туловище и ножки — видны, пока маскот стоит на полу */}
        <group ref={lower}>
          <mesh material={skin} position={[0, -1.42, 0]}>
            <capsuleGeometry args={[0.6, 0.5, 12, 32]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} material={limb} position={[sd * 0.36, -2.05, 0.15]} scale={[1, 0.55, 1.3]}>
              <sphereGeometry args={[0.3, 20, 16]} />
            </mesh>
          ))}
        </group>

        <group ref={head}>
          <mesh material={skin} scale={[1.02, 0.97, 0.94]}>
            <sphereGeometry args={[1, 96, 80]} />
          </mesh>

          {/* уши: длинные, висячие, с пружинной инерцией */}
          <group ref={earL} position={[-0.7, 0.6, -0.12]}>
            <mesh material={skin} position={[0, 0.95, 0]} scale={[0.38, 1.05, 0.14]}>
              <sphereGeometry args={[1, 40, 28]} />
            </mesh>
          </group>
          <group ref={earR} position={[0.7, 0.6, -0.12]}>
            <mesh material={skin} position={[0, 0.95, 0]} scale={[0.38, 1.05, 0.14]}>
              <sphereGeometry args={[1, 40, 28]} />
            </mesh>
          </group>

          <Eye side={-1} target={eyeL} />
          <Eye side={1} target={eyeR} />

          {/* носик */}
          <mesh position={surface(0, -0.08).multiplyScalar(0.99)}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <meshPhysicalMaterial color="#f29a93" roughness={0.35} clearcoat={0.8} />
          </mesh>

          {/* улыбка с зубами */}
          <group
            ref={mouth}
            position={surface(0, -0.4).multiplyScalar(0.94)}
            quaternion={new THREE.Quaternion().setFromUnitVectors(Z, surface(0, -0.4))}
          >
            <mesh rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.34, 0.075, 14, 48, Math.PI]} />
              <meshStandardMaterial color="#4a1a0b" roughness={0.6} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI + 0.22]} position={[0, -0.005, 0.035]}>
              <torusGeometry args={[0.33, 0.042, 10, 40, Math.PI - 0.44]} />
              <meshPhysicalMaterial color="#fffaf0" roughness={0.2} clearcoat={1} />
            </mesh>
          </group>
        </group>
      </group>

      {/* руки */}
      <mesh ref={armL} material={limb}>
        <cylinderGeometry args={[0.085, 0.1, 1, 14]} />
      </mesh>
      <mesh ref={armR} material={limb}>
        <cylinderGeometry args={[0.085, 0.1, 1, 14]} />
      </mesh>
      <group ref={handL}>{mitten}</group>
      <group ref={handR}>{mitten}</group>
    </group>
  );
}
