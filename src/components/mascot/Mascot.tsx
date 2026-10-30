/**
 * «Фундик» — маскот Foundation. Оригинальный силуэт: тело-фасолина,
 * хохолок из трёх завитков, круглые ушки, крупные тёплые глаза.
 *
 * SVG разбит на независимые слои (data-part), чтобы каждую часть можно было
 * анимировать отдельно: body · ears · tuft · eyes(iris/pupil/glint) · lids ·
 * brows · mouth · paws. Лапы рендерятся отдельным компонентом <MascotPaws/>
 * с тем же viewBox — так они ложатся ПОВЕРХ кромки окна-портала.
 *
 * Фаза 1: статичное состояние idle. Анимации состояний — фаза 3.
 */

export const MASCOT_VIEWBOX = "0 0 400 400";

/** Y-координата лап в системе viewBox — по ней выравниваем маскота на кромку окна */
export const PAW_Y = 362;

const C = {
  body: "#ffcb3d",
  bodyDeep: "#f2a200",
  outline: "#d98a00",
  light: "#ffe7a1",
  tuft: "#ffb000",
  iris: "#5b3410",
  irisRing: "#b8741c",
  pupil: "#140a02",
  brow: "#a86400",
  mouth: "#4f2600",
  blush: "#ff8f7a",
  earInner: "#ffa96b",
};

type Props = {
  className?: string;
  /** смещение зрачков в долях (-1..1) */
  gaze?: { x: number; y: number };
  title?: string;
};

export function MascotDefs() {
  return (
    <defs>
      <radialGradient id="fd-body" cx="42%" cy="34%" r="70%">
        <stop offset="0%" stopColor="#ffe27a" />
        <stop offset="55%" stopColor={C.body} />
        <stop offset="100%" stopColor={C.bodyDeep} />
      </radialGradient>
      <radialGradient id="fd-iris" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor={C.irisRing} />
        <stop offset="70%" stopColor={C.iris} />
        <stop offset="100%" stopColor="#2a1606" />
      </radialGradient>
      <linearGradient id="fd-rimlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8fe9ff" stopOpacity="0.55" />
        <stop offset="18%" stopColor="#8fe9ff" stopOpacity="0" />
        <stop offset="82%" stopColor="#c4b8ff" stopOpacity="0" />
        <stop offset="100%" stopColor="#c4b8ff" stopOpacity="0.45" />
      </linearGradient>
      <clipPath id="fd-eye-l">
        <ellipse cx="150" cy="200" rx="44" ry="50" />
      </clipPath>
      <clipPath id="fd-eye-r">
        <ellipse cx="250" cy="200" rx="44" ry="50" />
      </clipPath>
    </defs>
  );
}

function Eye({ cx, side, gaze }: { cx: number; side: "l" | "r"; gaze: { x: number; y: number } }) {
  const gx = gaze.x * 12;
  const gy = gaze.y * 10;
  return (
    <g data-part={`eye-${side}`}>
      <ellipse cx={cx} cy={200} rx={44} ry={50} fill="#fffdf6" stroke={C.outline} strokeWidth={3} />
      <g clipPath={`url(#fd-eye-${side})`}>
        <g data-part="iris" transform={`translate(${gx} ${gy})`}>
          <circle cx={cx} cy={206} r={30} fill="url(#fd-iris)" />
          <circle data-part="pupil" cx={cx} cy={208} r={15} fill={C.pupil} />
          <circle data-part="glint" cx={cx + 11} cy={193} r={9} fill="#fff" />
          <circle cx={cx - 9} cy={219} r={4} fill="#fff" opacity={0.85} />
        </g>
        {/* верхнее веко: scaleY 0 — открыт, 1 — закрыт */}
        <rect
          data-part={`lid-${side}`}
          x={cx - 46}
          y={148}
          width={92}
          height={104}
          fill={C.body}
          style={{ transformBox: "fill-box", transformOrigin: "top", transform: "scaleY(0.1)" }}
        />
      </g>
    </g>
  );
}

export function Mascot({ className, gaze = { x: 0, y: 0 }, title = "Фундик — маскот Foundation" }: Props) {
  return (
    <svg viewBox={MASCOT_VIEWBOX} className={className} role="img" aria-label={title} overflow="visible">
      <MascotDefs />

      {/* уши */}
      <g data-part="ears">
        <g data-part="ear-l" style={{ transformBox: "fill-box", transformOrigin: "80% 90%" }}>
          <ellipse cx={92} cy={132} rx={26} ry={34} transform="rotate(-28 92 132)" fill="url(#fd-body)" stroke={C.outline} strokeWidth={3} />
          <ellipse cx={94} cy={136} rx={12} ry={18} transform="rotate(-28 94 136)" fill={C.earInner} opacity={0.7} />
        </g>
        <g data-part="ear-r" style={{ transformBox: "fill-box", transformOrigin: "20% 90%" }}>
          <ellipse cx={308} cy={132} rx={26} ry={34} transform="rotate(28 308 132)" fill="url(#fd-body)" stroke={C.outline} strokeWidth={3} />
          <ellipse cx={306} cy={136} rx={12} ry={18} transform="rotate(28 306 136)" fill={C.earInner} opacity={0.7} />
        </g>
      </g>

      {/* тело + руки (руки уходят за кромку, кисти — в MascotPaws) */}
      <g data-part="body">
        <path
          d="M118 330 C 104 344, 104 356, 112 366 L 150 366 C 146 352, 140 340, 136 326 Z"
          fill={C.bodyDeep}
        />
        <path
          d="M282 330 C 296 344, 296 356, 288 366 L 250 366 C 254 352, 260 340, 264 326 Z"
          fill={C.bodyDeep}
        />
        <path
          d="M200 78
             C 286 78, 338 140, 340 226
             C 342 300, 316 370, 290 410
             L 110 410
             C 84 370, 58 300, 60 226
             C 62 140, 114 78, 200 78 Z"
          fill="url(#fd-body)"
          stroke={C.outline}
          strokeWidth={3}
        />
        {/* контровой свет от космоса */}
        <path
          d="M200 78 C 286 78, 338 140, 340 226 C 342 300, 316 370, 290 410 L 110 410 C 84 370, 58 300, 60 226 C 62 140, 114 78, 200 78 Z"
          fill="url(#fd-rimlight)"
        />
        {/* мордочка и животик */}
        <ellipse cx={200} cy={282} rx={58} ry={38} fill={C.light} opacity={0.9} />
        <ellipse cx={200} cy={392} rx={92} ry={60} fill={C.light} opacity={0.55} />
        {/* румянец */}
        <ellipse data-part="blush-l" cx={108} cy={266} rx={22} ry={13} fill={C.blush} opacity={0.42} />
        <ellipse data-part="blush-r" cx={292} cy={266} rx={22} ry={13} fill={C.blush} opacity={0.42} />
      </g>

      {/* глаза + веки */}
      <g data-part="eyes">
        <Eye cx={150} side="l" gaze={gaze} />
        <Eye cx={250} side="r" gaze={gaze} />
      </g>

      {/* брови */}
      <g data-part="brows" fill="none" stroke={C.brow} strokeWidth={7} strokeLinecap="round">
        <path data-part="brow-l" d="M118 134 Q 148 120 178 130" />
        <path data-part="brow-r" d="M222 130 Q 252 120 282 134" />
      </g>

      {/* рот */}
      <g data-part="mouth">
        <path d="M178 276 Q 200 296 222 276" fill="none" stroke={C.mouth} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={200} cy={265} rx={7} ry={5} fill={C.outline} opacity={0.75} />
      </g>
    </svg>
  );
}

/** Лапы — отдельный слой, рендерится поверх кромки окна */
export function MascotPaws({ className }: { className?: string }) {
  const paw = (cx: number) => (
    <g>
      <path
        d={`M${cx - 42} ${PAW_Y + 6} C ${cx - 44} ${PAW_Y - 22}, ${cx + 44} ${PAW_Y - 22}, ${cx + 42} ${PAW_Y + 6} C ${cx + 40} ${PAW_Y + 22}, ${cx - 40} ${PAW_Y + 22}, ${cx - 42} ${PAW_Y + 6} Z`}
        fill="url(#fd-body)"
        stroke={C.outline}
        strokeWidth={3}
      />
      <path d={`M${cx - 14} ${PAW_Y + 2} v 14 M${cx + 14} ${PAW_Y + 2} v 14`} stroke={C.outline} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={cx - 18} cy={PAW_Y - 6} rx={10} ry={4} fill="#fff" opacity={0.35} />
    </g>
  );
  return (
    <svg viewBox={MASCOT_VIEWBOX} className={className} aria-hidden overflow="visible">
      <MascotDefs />
      <g data-part="paws">
        <g data-part="paw-l">{paw(128)}</g>
        <g data-part="paw-r">{paw(272)}</g>
      </g>
    </svg>
  );
}
