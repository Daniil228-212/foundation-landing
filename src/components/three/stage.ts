import * as THREE from "three";

/**
 * Общее мутабельное состояние сцены (не React-стейт — читается в useFrame каждый кадр).
 * DOM-якоря (кольцо, слоты агентов) переводятся в мировые координаты на плоскости z = 0.
 */
export type IntroMode = "hidden" | "intro" | "peek";

export const stage = {
  ring: { center: new THREE.Vector3(0, -0.4, 0), radius: 1.6, valid: false },
  pointer: new THREE.Vector2(0, 0),
  floorY: -2.6,
  tier: "high" as "high" | "low",
  /** прокси, который анимирует GSAP-таймлайн заставки */
  intro: {
    mode: "hidden" as IntroMode,
    // радиант
    radX: 0,
    radY: 9,
    radZ: -40,
    radScale: 1,
    radOpen: 0, // 0 — цельный кристалл, 1 — раскрыт
    radFade: 1,
    ripple: 0,
    beam: 0,
    burstT: -1, // секунды с момента взрыва, -1 — не было
    disc: 0, // проявление стеклянного диска окна
    // маскот
    mX: 0,
    mY: -2,
    mZ: 0,
    mScale: 0.05,
    squash: 0, // >0 — сплющен, <0 — вытянут
    wave: 0,
  },
};

const _v = new THREE.Vector3();
const _d = new THREE.Vector3();

/** Экранная точка (clientX/Y) → точка на плоскости z = planeZ */
export function screenToPlane(
  x: number,
  y: number,
  rect: DOMRect,
  camera: THREE.Camera,
  planeZ: number,
  out: THREE.Vector3,
) {
  const nx = ((x - rect.left) / rect.width) * 2 - 1;
  const ny = -((y - rect.top) / rect.height) * 2 + 1;
  _v.set(nx, ny, 0.5).unproject(camera);
  _d.copy(_v).sub(camera.position).normalize();
  const t = (planeZ - camera.position.z) / _d.z;
  return out.copy(camera.position).addScaledVector(_d, t);
}

/** Центр и «радиус» DOM-элемента в мировых координатах */
export function anchorToWorld(el: Element, rect: DOMRect, camera: THREE.Camera, out: THREE.Vector3, planeZ = 0) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  screenToPlane(cx, cy, rect, camera, planeZ, out);
  const edge = screenToPlane(r.right, cy, rect, camera, planeZ, _v.clone());
  return { center: out, radius: edge.distanceTo(out), visible: r.bottom > rect.top && r.top < rect.bottom && r.width > 0 };
}
