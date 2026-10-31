"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { easing } from "maath";
import { useFoundation, type MentorState } from "@/store/foundation";
import { anchorToWorld, stage } from "./stage";

const PIGMENTS = ["#ffd54f", "#8fb5ae", "#a99fc6", "#d29f98", "#a9bb93", "#cfa874", "#fff3d1"];

/* ---------------- якорь кольца: DOM → мир ---------------- */
function RingAnchor() {
  const el = useRef<Element | null>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!el.current) el.current = document.querySelector("[data-ring]");
    if (!el.current) return;
    const a = anchorToWorld(el.current, state.gl.domElement.getBoundingClientRect(), state.camera, v);
    stage.ring.center.copy(a.center);
    stage.ring.radius = a.radius;
    stage.ring.valid = true;
  });
  return null;
}

/* ---------------- лёгкий параллакс камеры ---------------- */
function CameraRig() {
  useFrame((state, dt) => {
    easing.damp3(state.camera.position, [stage.pointer.x * 0.35, stage.pointer.y * 0.2, 12], 0.8, dt);
    state.camera.lookAt(0, -0.2, 0);
  });
  return null;
}

/* ---------------- тёмная глянцевая поверхность ---------------- */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, stage.floorY, 0]}>
      <planeGeometry args={[80, 80]} />
      {stage.tier === "high" ? (
        <MeshReflectorMaterial
          resolution={512}
          blur={[400, 120]}
          mixBlur={1}
          mixStrength={22}
          mirror={0.6}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0d0d0c"
          metalness={0.55}
        />
      ) : (
        <meshPhysicalMaterial color="#0e0e0d" roughness={0.22} metalness={0.6} clearcoat={1} />
      )}
    </mesh>
  );
}

/* ---------------- стеклянный диск окна (за ним прячется маскот) ---------------- */
function Disc() {
  const m = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uOpacity; uniform float uTime;
          void main(){
            vec2 p = vUv - 0.5; float r = length(p) * 2.0;
            // линейные значения: ~#1b1a18 в центре → графит к краю
            vec3 base = mix(vec3(0.0125,0.0118,0.0105), vec3(0.0068,0.0066,0.0064), smoothstep(0.0,1.0,r));
            float sheen = smoothstep(0.6, 0.0, length(p - vec2(-0.16, 0.24))) * 0.012;
            float rim = smoothstep(0.88, 1.0, r) * 0.02;
            vec3 col = base + vec3(1.0,0.9,0.7) * (sheen + rim);
            gl_FragColor = vec4(col, uOpacity * 0.985);
          }`,
      }),
    [],
  );
  useFrame((state) => {
    if (!m.current) return;
    const c = stage.ring.center;
    m.current.position.set(c.x, c.y, 0);
    m.current.scale.setScalar(stage.ring.radius);
    mat.uniforms.uOpacity.value = stage.intro.disc;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    m.current.visible = stage.intro.disc > 0.001;
  });
  return (
    <mesh ref={m} material={mat} renderOrder={2}>
      <circleGeometry args={[1, 96]} />
    </mesh>
  );
}

/* ---------------- Радиант: кристалл-логотип и «присутствие» Ментора ---------------- */
const MOOD: Record<MentorState, { color: string; glow: number; spin: number }> = {
  idle: { color: "#ffd54f", glow: 2.2, spin: 1 },
  listening: { color: "#ffe08a", glow: 3, spin: 0.6 },
  thinking: { color: "#fff1c4", glow: 3.4, spin: 4 },
  challenging: { color: "#ffa43a", glow: 3.2, spin: 1.6 },
  approving: { color: "#d9f08a", glow: 5, spin: 2.4 },
  blocking: { color: "#ff7a6a", glow: 3.4, spin: 0.3 },
};

function Radiant() {
  const g = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const lines = useMemo(() => {
    const a = new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.62));
    const b = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.86, 1));
    return { a, b };
  }, []);
  const lineMatA = useMemo(() => new THREE.LineBasicMaterial({ color: "#fff1c4", transparent: true, toneMapped: false }), []);
  const lineMatB = useMemo(() => new THREE.LineBasicMaterial({ color: "#c9c2e6", transparent: true, opacity: 0.55 }), []);
  const live = useRef({ glow: 2.2, spin: 1, color: new THREE.Color("#ffd54f"), angle: 0, lean: 0 });
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const I = stage.intro;
    if (!g.current || !shell.current || !core.current || !inner.current) return;
    dt = Math.min(dt, 1 / 20);
    const t = state.clock.elapsedTime;
    const mentor = useFoundation.getState().mentor;
    const L = live.current;

    if (I.mode === "hover") {
      // собирается и парит над кольцом
      const c = stage.ring.center;
      const R = stage.ring.radius;
      const ty = c.y + R + 0.42 * R + Math.sin(t * 0.9) * 0.04 * R;
      I.radX = THREE.MathUtils.damp(I.radX, c.x, 3, dt);
      I.radY = THREE.MathUtils.damp(I.radY, ty, 3, dt);
      I.radZ = THREE.MathUtils.damp(I.radZ, 0, 3, dt);
      I.radScale = THREE.MathUtils.damp(I.radScale, 0.3 * R, 3, dt);
      I.radOpen = THREE.MathUtils.damp(I.radOpen, mentor === "approving" ? 0.18 : 0, 4, dt);
    }

    const m = MOOD[mentor];
    L.glow = THREE.MathUtils.damp(L.glow, m.glow, 4, dt);
    L.spin = THREE.MathUtils.damp(L.spin, m.spin, 3, dt);
    L.color.lerp(target.set(m.color), 1 - Math.exp(-4 * dt));
    L.angle += dt * 0.5 * L.spin;
    L.lean = THREE.MathUtils.damp(L.lean, mentor === "listening" ? 0.45 : 0, 3, dt);

    g.current.visible = I.radY < 20;
    g.current.position.set(I.radX, I.radY, I.radZ);
    g.current.scale.setScalar(I.radScale);
    g.current.rotation.x = L.lean + stage.pointer.y * -0.2;
    g.current.rotation.y = stage.pointer.x * 0.35;

    shell.current.rotation.set(L.angle * 0.8, L.angle * 1.2, 0);
    inner.current.rotation.set(-L.angle, L.angle * 0.6, L.angle * 0.3);
    shell.current.scale.setScalar(1 + I.radOpen * 2.4);
    lineMatA.opacity = 1 - I.radOpen * 0.85;
    lineMatB.opacity = 0.55 * (1 - I.radOpen * 0.85);
    lineMatA.color.copy(L.color).lerp(target.set("#ffffff"), 0.55);

    const cm = core.current.material as THREE.MeshStandardMaterial;
    const pulse = mentor === "thinking" ? Math.sin(t * 8) * 0.8 : Math.sin(t * 2.2) * 0.25;
    cm.emissive.copy(L.color);
    cm.emissiveIntensity = L.glow + I.radOpen * 6 + pulse;
    core.current.rotation.y += dt * 0.8 * L.spin;
    if (light.current) {
      light.current.color.copy(L.color);
      light.current.intensity = 4 + L.glow;
    }
  });

  return (
    <group ref={g}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffd54f" emissiveIntensity={2.2} toneMapped={false} flatShading />
      </mesh>
      <group ref={shell}>
        <lineSegments geometry={lines.a} material={lineMatA} />
      </group>
      <group ref={inner}>
        <lineSegments geometry={lines.b} material={lineMatB} />
      </group>
      <pointLight ref={light} color="#ffd54f" intensity={6} distance={8} />
    </group>
  );
}

/* ---------------- волна на полу в момент удара ---------------- */
function Ripple() {
  const m = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!m.current) return;
    const r = stage.intro.ripple;
    m.current.visible = r > 0 && r < 1;
    m.current.scale.setScalar(0.4 + r * 7);
    (m.current.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.7;
  });
  return (
    <mesh ref={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, stage.floorY + 0.01, -2]}>
      <ringGeometry args={[0.92, 1, 96]} />
      <meshBasicMaterial color="#ffe08a" transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ---------------- луч ---------------- */
function Beam() {
  const m = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uBeam: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uBeam; uniform float uTime;
          vec3 pal(float t){ return 0.55 + 0.45*cos(6.2831*(t + vec3(0.0,0.33,0.67))); }
          void main(){
            float fade = pow(1.0 - vUv.y, 1.6);
            float edge = pow(sin(vUv.x * 3.14159), 0.6);
            vec3 col = mix(vec3(1.0,0.86,0.45), pal(vUv.x*2.0 + uTime*0.25 + vUv.y), 0.45);
            gl_FragColor = vec4(col * 1.1, fade * edge * uBeam * 0.55);
          }`,
      }),
    [],
  );
  useFrame((state) => {
    if (!m.current) return;
    const I = stage.intro;
    m.current.visible = I.beam > 0.001;
    m.current.position.set(I.radX, I.radY + 7, I.radZ);
    m.current.scale.set(1 + I.beam * 0.6, I.beam, 1 + I.beam * 0.6);
    mat.uniforms.uBeam.value = I.beam;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh ref={m} material={mat}>
      <cylinderGeometry args={[0.35, 1.1, 14, 48, 1, true]} />
    </mesh>
  );
}

/* ---------------- взрыв красок: частицы на GPU ---------------- */
function Burst() {
  const count = stage.tier === "high" ? 2400 : 900;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const up = Math.random() ** 0.6;
      const sp = 2 + Math.random() * 6;
      vel.set([Math.cos(th) * sp * (1 - up * 0.6), up * sp * 1.1, Math.sin(th) * sp * (1 - up * 0.6)], i * 3);
      c.set(PIGMENTS[i % PIGMENTS.length]);
      col.set([c.r, c.g, c.b], i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: -1 }, uOrigin: { value: new THREE.Vector3() }, uPx: { value: 1 } },
        vertexShader: `
          attribute vec3 aVel; attribute vec3 aColor; attribute float aSeed;
          uniform float uT; uniform vec3 uOrigin; uniform float uPx;
          varying vec3 vColor; varying float vA;
          void main(){
            float t = max(uT, 0.0);
            float drag = 1.0 - exp(-t * 1.6);
            vec3 p = uOrigin + aVel * drag / 1.6 + vec3(0.0, -0.9, 0.0) * t * t * 0.5;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            vA = (uT < 0.0) ? 0.0 : smoothstep(2.6 + aSeed, 0.2, t);
            gl_PointSize = (8.0 + aSeed * 18.0) * uPx / -mv.z;
            vColor = aColor;
          }`,
        fragmentShader: `
          varying vec3 vColor; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vColor * 1.8, a * vA);
          }`,
      }),
    [],
  );
  useFrame((state, dt) => {
    const I = stage.intro;
    if (I.burstT >= 0) I.burstT += dt;
    mat.uniforms.uT.value = I.burstT;
    mat.uniforms.uOrigin.value.set(I.radX, I.radY, I.radZ);
    mat.uniforms.uPx.value = state.gl.getPixelRatio() * 6;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ---------------- таймлайн заставки ---------------- */
function IntroTimeline() {
  const phase = useFoundation((s) => s.phase);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => () => void tlRef.current?.kill(), []);

  useEffect(() => {
    const I = stage.intro;
    const { finishIntro, revealUI } = useFoundation.getState();
    if (phase === "ready") {
      // пропуск / повторный визит / reduced-motion / штатный финал
      if (tlRef.current && tlRef.current.progress() < 1) tlRef.current.kill();
      if (I.mode !== "hover") Object.assign(I, { mode: "hover", radY: stage.ring.center.y + 2, radX: 0, radZ: 0, radScale: 0.4 });
      Object.assign(I, { disc: 1, beam: 0, ripple: 0, burstT: -1 });
      return;
    }
    if (phase !== "intro" || tlRef.current) return;
    const f = stage.floorY;
    Object.assign(I, { mode: "intro", radX: 2.2, radY: 10, radZ: -46, radScale: 0.7, radOpen: 0, ripple: 0, beam: 0, burstT: -1, disc: 0 });
    const tl = gsap.timeline();
    tlRef.current = tl;
    // падение из космоса
    tl.to(I, { radX: 0, radY: f + 0.62, radZ: -2, radScale: 1.15, duration: 1.3, ease: "power2.in" });
    // удар о глянец + отскок
    tl.to(I, { ripple: 1, duration: 1.4, ease: "power2.out" }, 1.3);
    tl.to(I, { radY: f + 3.4, duration: 0.6, ease: "power2.out" }, 1.3);
    // раскрытие: луч и краски, из него проявляется интерфейс
    tl.add(() => {
      I.burstT = 0;
      revealUI();
    }, 1.85);
    tl.to(I, { radOpen: 1, duration: 0.7, ease: "power3.out" }, 1.85);
    tl.to(I, { beam: 1, duration: 0.35, ease: "power2.out" }, 1.85);
    tl.to(I, { beam: 0, duration: 1.6, ease: "power2.inOut" }, 2.3);
    tl.to(I, { disc: 1, duration: 1.6, ease: "power2.out" }, 2.2);
    // собирается обратно и встаёт над кольцом
    tl.add(() => (I.mode = "hover"), 2.9);
    tl.add(() => finishIntro(), 4.4);
  }, [phase]);
  return null;
}

/* ---------------- свет и окружение без внешних HDR ---------------- */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[-8, 3, 6]} intensity={0.9} color="#fff8ec" />
      <directionalLight position={[3, 5, 6]} intensity={1.6} color="#fff4e0" />
      <directionalLight position={[-6, 2, -4]} intensity={1.2} color="#a99fc6" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff3dc" position={[0, 5, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1} color="#a99fc6" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#8fb5ae" position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="circle" intensity={1.6} color="#ffd54f" position={[0, -3, 4]} scale={3} />
      </Environment>
    </>
  );
}

function PointerTracker() {
  const { size } = useThree();
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      stage.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [size]);
  return null;
}

export default function Scene({ active }: { active: boolean }) {
  const [tier] = useState(() => {
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    const t = cores >= 8 && !coarse ? "high" : "low";
    stage.tier = t;
    return t;
  });

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, tier === "high" ? 2 : 1.5]}
      camera={{ position: [0, 0, 12], fov: 30, near: 0.1, far: 120 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      aria-hidden
    >
      <color attach="background" args={["#121212"]} />
      <fog attach="fog" args={["#121212", 14, 40]} />
      <Lighting />
      <PointerTracker />
      <CameraRig />
      <RingAnchor />
      <Floor />
      <Ripple />
      <Radiant />
      <Beam />
      <Burst />
      <Disc />
      <IntroTimeline />
      <EffectComposer multisampling={tier === "high" ? 4 : 0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
        <Noise opacity={0.035} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
