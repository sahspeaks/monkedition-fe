// Monk Studio's own components: dark, glassy, springy. Separate from the
// dashboard's ui.jsx on purpose (see docs/STUDIO_PLAN.md §4).
import { forwardRef, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

export const spring = { type: "spring", stiffness: 320, damping: 30 };

export const Glass = ({ as: Tag = "div", strong = false, className = "", ...props }) => (
  <Tag className={`${strong ? "glass-strong" : "glass"} rounded-2xl ${className}`} {...props} />
);

/** Primary action: aurora gradient, leans toward the pointer (magnetic). */
export const AuroraButton = ({ children, className = "", disabled, size = "md", ...props }) => {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });
  const onMove = (e) => {
    if (reduce || disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.18);
    y.set((e.clientY - r.top - r.height / 2) * 0.25);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-8 py-4 text-base" };
  return (
    <motion.button
      type="button"
      style={{ x: sx, y: sy }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-aurora shadow-[0_10px_40px_-12px_rgba(255,92,138,0.7)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const GhostButton = forwardRef(({ children, className = "", active = false, size = "md", ...props }, ref) => {
  const sizes = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${active ? "border-[#ff5c8a]/60 bg-white/10 text-white" : "border-white/10 bg-white/[0.04] text-[var(--text-2)] hover:bg-white/[0.08] hover:text-white"} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
GhostButton.displayName = "GhostButton";

export const Chip = ({ children, tone = "default", className = "" }) => {
  const tones = {
    default: "bg-white/[0.06] text-[var(--text-2)] border-white/10",
    success: "bg-[#3ddc97]/10 text-[var(--success)] border-[#3ddc97]/25",
    warning: "bg-[#ffb547]/10 text-[var(--warning)] border-[#ffb547]/25",
    error: "bg-[#ff5c6c]/10 text-[var(--error)] border-[#ff5c6c]/25",
    accent: "bg-[#7c5cff]/15 text-[#c4b5fd] border-[#7c5cff]/30",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]} ${className}`}>{children}</span>;
};

export const Label = ({ children, hint, className = "" }) => (
  <div className={`mb-1.5 flex items-baseline justify-between gap-2 ${className}`}>
    <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">{children}</span>
    {hint && <span className="text-[11px] text-[var(--text-3)]">{hint}</span>}
  </div>
);

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-3)] transition focus:border-[#7c5cff]/60 focus:bg-white/[0.06] focus:outline-none";

export const TextInput = ({ label, hint, error, className = "", ...props }) => (
  <label className={`block ${className}`}>
    {label && <Label hint={hint}>{label}</Label>}
    <input className={`${fieldClass} ${error ? "border-[#ff5c6c]/60" : ""}`} {...props} />
    {error && <span className="mt-1 block text-xs text-[var(--error)]">{error}</span>}
  </label>
);

export const TextArea = ({ label, hint, className = "", ...props }) => (
  <label className={`block ${className}`}>
    {label && <Label hint={hint}>{label}</Label>}
    <textarea rows={3} className={`${fieldClass} resize-none`} {...props} />
  </label>
);

export const SelectInput = ({ label, children, className = "", ...props }) => (
  <label className={`block ${className}`}>
    {label && <Label>{label}</Label>}
    <select className={`${fieldClass} appearance-none`} {...props}>
      {children}
    </select>
  </label>
);

export const Kbd = ({ children }) => (
  <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-2)]">{children}</kbd>
);

/** Card that tilts toward the pointer with a moving spotlight. */
export const TiltCard = ({ children, className = "", selected = false, onClick, ...props }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 });
  const light = useTransform([px, py], ([x, y]) => `radial-gradient(260px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.10), transparent 60%)`);
  const onMove = (e) => {
    if (reduce) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };
  return (
    <motion.div style={{ perspective: 900 }} className={className}>
      <motion.div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick()) : undefined}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        className={`group relative h-full overflow-hidden rounded-2xl glass ${selected ? "ring-aurora" : ""} ${onClick ? "cursor-pointer" : ""}`}
        {...props}
      >
        {children}
        {!reduce && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: light }} />}
      </motion.div>
    </motion.div>
  );
};

/** Words rise in one after another (step titles). */
export const KineticTitle = ({ text, className = "" }) => {
  const reduce = useReducedMotion();
  return (
    <h1 className={`font-display ${className}`} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="mr-[0.25em] inline-block"
          initial={reduce ? false : { y: "0.6em", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ ...spring, delay: i * 0.05 }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
};

export const ProgressRing = ({ value, size = 36, stroke = 3 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-label={`${Math.round(value * 100)}%`}>
      <defs>
        <linearGradient id="ring-aurora" x1="0" x2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.55" stopColor="#ff5c8a" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ring-aurora)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={spring}
      />
    </svg>
  );
};
