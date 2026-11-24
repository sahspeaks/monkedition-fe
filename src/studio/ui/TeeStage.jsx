// Stand-in for the three.js tee viewer (docs/STUDIO_PLAN.md §4.6) until the
// .glb tee exists: a two-faced tee in CSS 3D. Drag to spin, front/back/side
// buttons, a ripple when the colour changes.
import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { isDark } from "../data/sample";
import { GhostButton } from "./primitives";

const TEE = "M60 30 Q100 18 140 30 L188 62 L172 98 L148 86 L150 190 H50 L52 86 L28 98 L12 62 Z";

const TeeFace = ({ colour, print, back }) => {
  const uid = useId().replace(/:/g, "");
  const ink = isDark(colour) ? "#f5f5f7" : "#111113";
  const zone = back ? [64, 52, 72, 88] : [72, 56, 56, 62];
  return (
    <svg viewBox="0 0 200 210" className="h-full w-full">
      <defs>
        <linearGradient id={`s${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`p${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.55" stopColor="#ff5c8a" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <motion.path d={TEE} animate={{ fill: colour }} transition={{ duration: 0.5 }} />
      <path d={TEE} fill={`url(#s${uid})`} />
      {!back && <path d="M84 27 Q100 40 116 27" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" />}
      {print && (
        <g>
          <rect x={zone[0]} y={zone[1]} width={zone[2]} height={zone[3]} rx="4" fill={`url(#p${uid})`} opacity="0.95" />
          <rect x={zone[0] + 8} y={zone[1] + zone[3] - 16} width={zone[2] - 16} height="4" rx="2" fill={ink} opacity="0.85" />
          <rect x={zone[0] + 8} y={zone[1] + zone[3] - 9} width={(zone[2] - 16) * 0.6} height="3" rx="1.5" fill={ink} opacity="0.6" />
        </g>
      )}
    </svg>
  );
};

const TeeStage = ({ colour, front = true, backPrint = true, className = "" }) => {
  const reduce = useReducedMotion();
  const rotate = useMotionValue(-18);
  const shadow = useTransform(rotate, (r) => `${Math.sin((r * Math.PI) / 180) * 30}px`);
  const [ripples, setRipples] = useState([]);
  const last = useRef(colour);
  const idle = useRef(null);

  useEffect(() => {
    if (reduce) return undefined;
    idle.current = animate(rotate, [rotate.get(), rotate.get() + 24, rotate.get()], { duration: 6, repeat: Infinity, ease: "easeInOut" });
    return () => idle.current?.stop();
  }, [reduce, rotate]);

  useEffect(() => {
    if (colour === last.current) return;
    last.current = colour;
    const id = Date.now();
    setRipples((r) => [...r, { id, colour }]);
    const t = setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 900);
    return () => clearTimeout(t);
  }, [colour]);

  const turnTo = (deg) => {
    idle.current?.stop();
    animate(rotate, deg, { type: "spring", stiffness: 120, damping: 18 });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative mx-auto aspect-square max-h-[46vh] w-full" style={{ perspective: 1200 }}>
        {/* stage floor glow */}
        <div aria-hidden="true" className="absolute inset-x-[15%] bottom-[4%] h-8 rounded-[50%] bg-black/60 blur-xl" />
        <div aria-hidden="true" className="absolute inset-[18%] rounded-full bg-aurora opacity-[0.12] blur-3xl" />
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: r.colour }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-[8%] cursor-grab active:cursor-grabbing"
          style={{ rotateY: rotate, transformStyle: "preserve-3d" }}
          onPanStart={() => idle.current?.stop()}
          onPan={(_, info) => rotate.set(rotate.get() + info.delta.x * 0.6)}
          onDoubleClick={() => turnTo(0)}
          aria-label="Tee preview. Drag to spin."
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <TeeFace colour={colour} print={front} />
          </div>
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <TeeFace colour={colour} print={backPrint} back />
          </div>
        </motion.div>
        <motion.div aria-hidden="true" className="absolute bottom-[3%] left-1/2 h-3 w-1/2 -translate-x-1/2 rounded-[50%] bg-black/50 blur-md" style={{ x: shadow }} />
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <GhostButton size="xs" onClick={() => turnTo(0)}>Front</GhostButton>
        <GhostButton size="xs" onClick={() => turnTo(90)}>Side</GhostButton>
        <GhostButton size="xs" onClick={() => turnTo(180)}>Back</GhostButton>
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--text-3)]">3D preview placeholder · the real tee model arrives in phase 4b</p>
    </div>
  );
};

export default TeeStage;
