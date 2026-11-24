// The stepper flow for one draft. This round builds only the stepper: each
// step shows a placeholder, and "Mark as done" stands in for the real step
// rules (steps.js) so every stepper state can be tried. The URL holds the step.
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { STEPS, stepIndex } from "./steps";
import { useStudio } from "./context";
import { ActionBar, Button, Stepper, TopBar } from "./ui/Shell";
import { BUILT_STEPS, stepDone } from "./draftStore";
import DesignStep from "./steps/DesignStep";
import ModelsStep from "./steps/ModelsStep";

/** Steps with a real screen; the others show a placeholder for now. */
const SCREENS = { design: DesignStep, models: ModelsStep };

const ease = [0.22, 1, 0.36, 1];

/** The step number rolls like an odometer when the step changes. */
const BigNumber = ({ value, direction }) => {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block h-[0.82em] overflow-hidden align-top leading-[0.82]" aria-hidden="true">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.span
          key={value}
          custom={direction}
          className="block"
          initial={reduce ? false : { y: `${direction * 100}%` }}
          animate={{ y: "0%" }}
          exit={reduce ? { opacity: 0 } : { y: `${direction * -100}%` }}
          transition={{ duration: 0.55, ease }}
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const Placeholder = ({ step, index, done, onToggle, direction }) => (
  <div className="flex h-full flex-col justify-between p-6 md:p-10">
    <div className="flex items-start justify-between gap-6">
      <p className="label flex items-center gap-2 text-[var(--text-3)]">
        <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
        Step {String(index + 1).padStart(2, "0")} — {step.label}
      </p>
      <p className="label hidden text-[var(--text-3)] md:block">Screen design: next round</p>
    </div>

    <div className="grid items-end gap-8 lg:grid-cols-[auto_1fr]">
      <p className="font-semibold tracking-[-0.06em] text-[var(--text)] [font-size:clamp(7rem,18vw,16rem)]">
        <BigNumber value={index + 1} direction={direction} />
      </p>
      <motion.div key={step.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.1 }} className="max-w-xl pb-4">
        <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-5xl">{step.title}</h1>
        <p className="mt-4 text-base text-[var(--text-2)]">{step.subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant={done ? "outline" : "solid"} onClick={onToggle}>
            {done ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {done ? "Mark as not done" : "Mark as done"}
          </Button>
          <span className="text-xs text-[var(--text-3)]">Prototype: stands in for this step&apos;s real checks.</span>
        </div>
      </motion.div>
    </div>
  </div>
);

const Wizard = () => {
  const { draftId, stepKey } = useParams();
  const { drafts, setDrafts } = useStudio();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const draft = drafts.find((d) => d.id === draftId);
  const index = stepIndex(stepKey);
  const previous = useRef(index);
  const direction = index >= previous.current ? 1 : -1;
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    previous.current = index;
  }, [index]);

  const update = useCallback(
    (fn) => {
      setDrafts((all) => all.map((d) => (d.id === draftId ? { ...fn(d), updatedAt: Date.now() } : d)));
      setSaving(true);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaving(false), 700);
    },
    [draftId, setDrafts],
  );

  const isDone = (i) => Boolean(draft) && stepDone(draft, i);
  const reachable = (i) => STEPS.slice(0, i).every((_, j) => isDone(j));
  const go = useCallback((i) => navigate(`/studio/d/${draftId}/${STEPS[i].key}`), [navigate, draftId]);
  const missing =
    !draft || index < 0 || isDone(index) ? null : BUILT_STEPS.has(STEPS[index].key) ? STEPS[index].missing(draft) : "Mark this step as done to continue";

  // Alt+← / Alt+→ move between steps
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft" && index > 0) (e.preventDefault(), go(index - 1));
      if (e.key === "ArrowRight" && index < STEPS.length - 1 && !missing) (e.preventDefault(), go(index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, missing, go]);

  if (!draft) return <Navigate to="/studio" replace />;
  if (index < 0) return <Navigate to={`/studio/d/${draftId}/${STEPS[0].key}`} replace />;
  if (!reachable(index)) {
    const first = STEPS.findIndex((_, i) => !isDone(i));
    return <Navigate to={`/studio/d/${draftId}/${STEPS[first].key}`} replace />;
  }

  const step = STEPS[index];
  const toggle = () =>
    update((d) => ({
      ...d,
      // un-doing a step also un-does the steps after it
      doneSteps: d.doneSteps.includes(step.key) ? d.doneSteps.filter((k) => stepIndex(k) < index) : [...d.doneSteps, step.key],
    }));

  return (
    <div className="flex h-full flex-col">
      <TopBar draft={draft} onRename={(name) => update((d) => ({ ...d, name }))} saving={saving} />
      <Stepper current={index} isDone={isDone} onJump={go} />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step.key}
            custom={direction}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.45, ease }}
          >
            {SCREENS[step.key] ? (
              (() => {
                const Screen = SCREENS[step.key];
                return <Screen draft={draft} update={update} step={step} index={index} />;
              })()
            ) : (
              <Placeholder step={step} index={index} done={isDone(index)} onToggle={toggle} direction={direction} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <ActionBar
        current={index}
        missing={missing}
        onBack={() => go(index - 1)}
        onNext={() => (index === STEPS.length - 1 ? navigate("/studio") : go(index + 1))}
      />
    </div>
  );
};

export default Wizard;
