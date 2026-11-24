// The frame around every step: top bar, the stepper band and the action bar.
// Solid colours only: off-white = done, signal orange = current, dark = upcoming.
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Lock, Moon, PenLine, Sun } from "lucide-react";
import { STEPS } from "../steps";
import { useStudio } from "../context";

const ease = [0.22, 1, 0.36, 1];

export const Wordmark = ({ className = "" }) => (
  <Link to="/studio" className={`label !text-[12px] !tracking-[0.22em] text-[var(--text)] ${className}`} aria-label="Monk Studio home">
    Monk<span className="text-[var(--accent)]"> / </span>Studio
  </Link>
);

/** Sun / moon: the icon turns as it swaps; the theme change itself is a circular reveal (useTheme.js). */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useStudio();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-md border border-[var(--line-2)] text-[var(--text)] transition-colors hover:bg-[var(--panel-2)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          {dark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

export const Button = ({ variant = "outline", className = "", children, ...props }) => {
  const styles = {
    solid: "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--panel-2)] disabled:text-[var(--mute)]",
    outline: "border border-[var(--line-2)] text-[var(--text)] hover:bg-[var(--panel-2)] disabled:border-[var(--line)] disabled:text-[var(--mute)]",
    quiet: "text-[var(--text-2)] hover:text-[var(--text)] disabled:text-[var(--mute)]",
  };
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      className={`label inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/** Why a step is locked: the first earlier step that is not done. */
const lockReason = (isDone, i) => {
  const blocker = STEPS.slice(0, i).findIndex((_, j) => !isDone(j));
  return blocker >= 0 ? `Finish ${STEPS[blocker].label} first` : null;
};

export const Stepper = ({ current, isDone, onJump }) => {
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Steps" className="border-b border-[var(--line)]">
      <ol className="grid grid-cols-8">
        {STEPS.map((step, i) => {
          const done = isDone(i);
          const active = i === current;
          const reason = lockReason(isDone, i);
          const locked = Boolean(reason) && !active;
          const state = active ? "current" : done ? "done" : locked ? "locked" : "open";
          return (
            <li key={step.key} className={`relative ${i > 0 ? "border-l border-[var(--line)]" : ""}`}>
              <button
                type="button"
                onClick={() => !locked && onJump(i)}
                disabled={locked}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}, ${step.label}, ${state === "open" ? "not started" : state}`}
                title={locked ? reason : undefined}
                className={`group flex h-[4.5rem] w-full flex-col justify-between px-3 pb-0 pt-3 text-left transition-colors md:px-4 ${active ? "bg-[var(--panel)]" : locked ? "cursor-not-allowed" : "hover:bg-[var(--panel)]"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[11px] ${active ? "text-[var(--accent)]" : locked ? "text-[var(--mute)]" : "text-[var(--text-3)]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <AnimatePresence initial={false}>
                    {done && !active && (
                      <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.25, ease }}>
                        <Check className="h-3.5 w-3.5 text-[var(--text)]" aria-hidden="true" />
                      </motion.span>
                    )}
                    {locked && <Lock key="lock" className="h-3 w-3 text-[var(--mute)]" aria-hidden="true" />}
                  </AnimatePresence>
                </span>
                {/* icon + label: every label on desktop; on tablet only the current
                    step's label, the others show just their icon */}
                <span
                  className={`flex min-w-0 items-center gap-2 pb-3 ${active ? "text-[var(--text)]" : locked ? "text-[var(--mute)]" : done ? "text-[var(--text)]" : "text-[var(--text-2)] group-hover:text-[var(--text)]"}`}
                >
                  <motion.span
                    key={active ? "on" : "off"}
                    initial={active && !reduce ? { scale: 0.6, rotate: -12 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                    className={`shrink-0 ${active ? "text-[var(--accent)]" : ""}`}
                  >
                    <step.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </motion.span>
                  <span className={`label truncate ${active ? "" : "hidden lg:block"}`}>{step.label}</span>
                </span>
              </button>
              {/* the bar: solid fill per state; the current one fills in on arrival */}
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--line)]">
                <motion.span
                  className={`absolute inset-y-0 left-0 ${active ? "bg-[var(--accent)]" : "bg-[var(--text)]"}`}
                  initial={false}
                  animate={{ width: active || done ? "100%" : "0%" }}
                  transition={reduce ? { duration: 0 } : { duration: active ? 0.6 : 0.35, ease }}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export const TopBar = ({ draft, onRename, saving }) => {
  const [editing, setEditing] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--line)] px-4 md:px-6">
      <Wordmark className="shrink-0" />
      <span className="h-4 w-px bg-[var(--line-2)]" aria-hidden="true" />
      {editing ? (
        <input
          autoFocus
          defaultValue={draft.name}
          onBlur={(e) => {
            onRename(e.target.value.trim() || draft.name);
            setEditing(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          onFocus={(e) => e.currentTarget.select()}
          className="inline-edit w-64 border-0 border-b border-[var(--text-3)] bg-transparent px-0 py-1 text-sm text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--text-3)] focus:border-[var(--text)]"
          placeholder="Product name"
          aria-label="Draft name"
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="group flex min-w-0 items-center gap-2 py-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]" title="Rename draft">
          <span className="truncate">{draft.name}</span>
          <PenLine className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </button>
      )}
      <div className="ml-auto flex items-center gap-4">
        <span className="label hidden items-center gap-2 text-[var(--text-3)] md:flex" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${saving ? "bg-[var(--accent)]" : "bg-[var(--success)]"}`} />
          {saving ? "Saving" : "Saved"}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
};

export const ActionBar = ({ current, missing, onBack, onNext }) => {
  const last = current === STEPS.length - 1;
  return (
    <footer className="flex h-16 shrink-0 items-center gap-4 border-t border-[var(--line)] px-4 md:px-6">
      <Button variant="quiet" onClick={onBack} disabled={current === 0} className="!px-0">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <p className="flex flex-1 items-center justify-center gap-2 text-sm" aria-live="polite">
        <span className={`h-1.5 w-1.5 rounded-full ${missing ? "bg-[var(--accent)]" : "bg-[var(--success)]"}`} aria-hidden="true" />
        <span className="text-[var(--text-2)]">{missing ?? (last ? "All steps done" : "Ready for the next step")}</span>
      </p>
      <span className="font-mono text-xs text-[var(--text-3)]">
        <span className="text-[var(--text)]">{String(current + 1).padStart(2, "0")}</span> / {String(STEPS.length).padStart(2, "0")}
      </span>
      <Button variant="solid" onClick={onNext} disabled={Boolean(missing)} title={missing ?? undefined}>
        {last ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
      </Button>
    </footer>
  );
};
