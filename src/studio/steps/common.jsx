// Shared pieces for the step screens.
import { motion, useReducedMotion } from "framer-motion";
import { KineticTitle, spring } from "../ui/primitives";

export const StageHeader = ({ step, index, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-3)]">
        Step {index + 1} / 8 · {step.label}
      </p>
      <KineticTitle text={step.title} className="text-3xl font-semibold text-white md:text-4xl" />
      <p className="mt-2 max-w-xl text-sm text-[var(--text-2)]">{step.subtitle}</p>
    </div>
    {children}
  </div>
);

/** Children enter one after another. */
export const Stagger = ({ children, className = "", as = "div" }) => {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </Tag>
  );
};

export const StaggerItem = ({ children, className = "", ...props }) => (
  <motion.div
    className={className}
    variants={{ hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: spring } }}
    {...props}
  >
    {children}
  </motion.div>
);

/** A photo that "develops" in: blur and exposure settle. */
export const Develop = ({ children, className = "", delay = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, filter: "blur(14px) brightness(1.8) saturate(0)" }}
      animate={{ opacity: 1, filter: "blur(0px) brightness(1) saturate(1)" }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const Segmented = ({ options, value, onChange, className = "" }) => (
  <div className={`relative grid rounded-xl border border-white/10 bg-white/[0.03] p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map(([key, label]) => (
      <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key} className="relative rounded-lg px-2 py-1.5 text-xs font-medium">
        {value === key && <motion.span layoutId={`seg-${options.map((o) => o[0]).join("")}`} className="absolute inset-0 rounded-lg bg-white/10" transition={spring} />}
        <span className={`relative ${value === key ? "text-white" : "text-[var(--text-2)]"}`}>{label}</span>
      </button>
    ))}
  </div>
);

export const Slider = ({ label, value, min, max, step, onChange }) => (
  <label className="block">
    <span className="mb-1 flex justify-between text-xs text-[var(--text-2)]">
      {label} <b className="font-mono font-medium text-white">{Number(value).toFixed(2)}</b>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#ff5c8a]" />
  </label>
);
