// Studio's first screen: every draft product, most recent first. With no
// drafts it opens a new "Untitled product" straight away.
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { STEPS } from "./steps";
import { useStudio } from "./context";
import { doneCount, newDraft, resumeStep, stepDone } from "./draftStore";
import { Button, ThemeToggle, Wordmark } from "./ui/Shell";

const ease = [0.22, 1, 0.36, 1];
const pad = (n) => String(n).padStart(2, "0");

const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
};

/** 8 small segments: done = off-white, the step to resume = orange. */
const MiniSteps = ({ draft }) => {
  const resume = resumeStep(draft).key;
  return (
    <span className="flex gap-1" aria-hidden="true">
      {STEPS.map((s, i) => (
        <span
          key={s.key}
          className={`h-[3px] w-4 ${stepDone(draft, i) ? "bg-[var(--text)]" : s.key === resume ? "bg-[var(--accent)]" : "bg-[var(--line-2)]"}`}
        />
      ))}
    </span>
  );
};

/** No drafts: create one (once, even under StrictMode) and open it. */
const StartFresh = () => {
  const { drafts, setDrafts } = useStudio();
  const [draft] = useState(newDraft);
  useEffect(() => {
    setDrafts((all) => (all.some((d) => d.id === draft.id) ? all : [draft, ...all]));
  }, [draft, setDrafts]);
  // open it only once it exists, or the wizard would bounce back here
  return drafts.some((d) => d.id === draft.id) ? <Navigate to={`/studio/d/${draft.id}/${STEPS[0].key}`} replace /> : null;
};

const Drafts = () => {
  const { drafts, setDrafts } = useStudio();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [confirmId, setConfirmId] = useState(null);
  // latched: once there are no drafts, keep showing StartFresh until it has
  // created and opened the new one (the list would otherwise take over)
  const [starting, setStarting] = useState(drafts.length === 0);
  useEffect(() => {
    if (drafts.length === 0) setStarting(true);
  }, [drafts.length]);

  if (starting) return <StartFresh />;

  const list = [...drafts].sort((a, b) => b.updatedAt - a.updatedAt);
  const open = (d) => navigate(`/studio/d/${d.id}/${resumeStep(d).key}`);
  const create = () => {
    const d = newDraft();
    setDrafts((all) => [d, ...all]);
    navigate(`/studio/d/${d.id}/${STEPS[0].key}`);
  };
  const remove = (id) => {
    setDrafts((all) => all.filter((d) => d.id !== id));
    setConfirmId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--line)] px-4 md:px-6">
        <Wordmark />
        <div className="ml-auto flex items-center gap-2">
          <Link to="/dashboard" className="label hidden h-10 items-center gap-2 px-3 text-[var(--text-2)] hover:text-[var(--text)] md:inline-flex">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <ThemeToggle />
          <Button variant="solid" onClick={create}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        </div>
      </header>

      <div className="scroll-y min-h-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="label mb-4 text-[var(--text-3)]">Studio · work in progress</p>
              <h1 className="text-6xl font-semibold leading-[0.9] tracking-[-0.045em] md:text-8xl">
                Drafts <span className="align-top font-mono text-2xl font-normal tracking-normal text-[var(--accent)] md:text-3xl">({pad(list.length)})</span>
              </h1>
            </div>
            <p className="hidden max-w-xs pb-2 text-sm text-[var(--text-2)] md:block">Pick up where you left off, or start a new product from a design file.</p>
          </motion.div>

          {/* column heads */}
          <div className="label hidden grid-cols-[3rem_1fr_15rem_8rem_5.5rem] gap-4 border-b border-[var(--line)] pb-3 text-[var(--text-3)] md:grid">
            <span>No.</span>
            <span>Product</span>
            <span>Progress</span>
            <span>Edited</span>
            <span className="sr-only">Actions</span>
          </div>

          <ol>
            <AnimatePresence initial={!reduce}>
              {list.map((d, i) => {
                const step = resumeStep(d);
                const all = doneCount(d) === STEPS.length;
                return (
                  <motion.li
                    key={d.id}
                    layout
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45, ease, delay: reduce ? 0 : i * 0.04 }}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-[var(--line)] py-5 transition-colors hover:bg-[var(--panel)] md:grid-cols-[3rem_1fr_15rem_8rem_5.5rem] md:px-0"
                  >
                    <span className="pl-1 font-mono text-xs text-[var(--text-3)]">{pad(i + 1)}</span>

                    <button type="button" onClick={() => open(d)} className="min-w-0 text-left">
                      <span className="block truncate text-xl font-medium tracking-[-0.02em] group-hover:text-[var(--text)] md:text-2xl">{d.name}</span>
                      <span className="mt-1 flex items-center gap-3 text-xs text-[var(--text-3)] md:hidden">
                        <MiniSteps draft={d} /> {ago(d.updatedAt)}
                      </span>
                    </button>

                    <span className="hidden flex-col gap-2 md:flex">
                      <MiniSteps draft={d} />
                      <span className="label flex items-center gap-2 text-[var(--text-2)]">
                        <step.icon className={`h-3.5 w-3.5 ${all ? "" : "text-[var(--accent)]"}`} strokeWidth={1.75} aria-hidden="true" />
                        {all ? "All steps done" : `${pad(STEPS.indexOf(step) + 1)} · ${step.label}`}
                      </span>
                    </span>

                    <span className="hidden text-sm text-[var(--text-2)] md:block">{ago(d.updatedAt)}</span>

                    <span className="flex items-center justify-end gap-1 pr-1">
                      <AnimatePresence mode="wait" initial={false}>
                        {confirmId === d.id ? (
                          <motion.span key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                            <button type="button" onClick={() => remove(d.id)} className="label h-8 rounded-md bg-[var(--error)] px-2.5 text-[var(--accent-ink)]">
                              Delete
                            </button>
                            <button type="button" onClick={() => setConfirmId(null)} className="label h-8 px-2 text-[var(--text-2)] hover:text-[var(--text)]">
                              Keep
                            </button>
                          </motion.span>
                        ) : (
                          <motion.span key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                            <button type="button" onClick={() => setConfirmId(d.id)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-3)] opacity-100 hover:bg-[var(--panel-2)] hover:text-[var(--error)] md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100" aria-label={`Delete ${d.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => open(d)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--text)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]" aria-label={`Open ${d.name}`}>
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Drafts;
