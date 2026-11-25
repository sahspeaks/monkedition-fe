// Step 5: render the product photos (model set × angle × colour, every print
// in its saved box), upload each to Cloudinary, then keep or reject them and
// star a main photo per colour. Spec: docs/STUDIO_PLAN.md §5.7.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { AlertTriangle, Check, CircleDot, ExternalLink, Loader2, Play, RefreshCw, Square, Star, X } from "lucide-react";
import { errorText, uploadImage } from "../../dashboard/api";
import { mockupsApi } from "../../dashboard/mockups/api";
import { useStudio } from "../context";
import { angleLabel } from "../data/sample";
import { planRenders } from "../renderPlan";
import Segmented from "../ui/Segmented";
import { Button } from "../ui/Shell";

const ease = [0.22, 1, 0.36, 1];
const CONCURRENCY = 3;
const pad = (n) => String(n).padStart(2, "0");

const Swatch = ({ hex }) => <span className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: hex, boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.35)" }} aria-hidden="true" />;

/** A photo card; swipe right to keep, left to reject (touch). */
const Card = ({ item, render, main, focused, busy, onFocus, onDecide, onStar }) => {
  const x = useMotionValue(0);
  const keepTint = useTransform(x, [0, 120], [0, 0.35]);
  const rejectTint = useTransform(x, [-120, 0], [0.35, 0]);
  const outdated = render && render.signature !== item.signature;
  return (
    <motion.div
      layout="position"
      drag={render ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.4}
      style={{ x }}
      onDragEnd={(_, info) => (info.offset.x > 110 ? onDecide("keep") : info.offset.x < -110 ? onDecide("reject") : null)}
      className={`relative touch-pan-y border-2 ${focused ? "border-[var(--accent)]" : "border-transparent"}`}
    >
      <button type="button" onClick={onFocus} onDoubleClick={onStar} className="block w-full text-left" aria-label={`${item.set.name}, ${angleLabel(item.angle)}, ${item.colour.name}`}>
        <div className={`relative aspect-[4/5] overflow-hidden bg-[var(--panel)] ${render?.status === "reject" ? "opacity-35 grayscale" : ""}`}>
          {render ? (
            <img src={render.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full items-center justify-center ${busy ? "animate-pulse bg-[var(--panel-2)]" : ""}`}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin text-[var(--text-3)]" /> : <span className="label text-[var(--text-3)]">Not rendered</span>}
            </div>
          )}
          <motion.div className="pointer-events-none absolute inset-0 bg-[var(--success)]" style={{ opacity: keepTint }} />
          <motion.div className="pointer-events-none absolute inset-0 bg-[var(--error)]" style={{ opacity: rejectTint }} />
          {main && (
            <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center bg-[var(--accent)] text-[var(--accent-ink)]" title="Main photo">
              <Star className="h-4 w-4 fill-current" />
            </span>
          )}
          {render?.status === "keep" && (
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-[var(--success)] text-[var(--accent-ink)]" title="Kept">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          )}
          {render?.status === "reject" && (
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-[var(--error)] text-[var(--accent-ink)]" title="Rejected">
              <X className="h-4 w-4" strokeWidth={3} />
            </span>
          )}
          {outdated && <span className="label absolute bottom-2 left-2 bg-[var(--accent)] px-1.5 py-0.5 !text-[10px] text-[var(--accent-ink)]">Outdated</span>}
          {busy && render && <Loader2 className="absolute bottom-2 right-2 h-4 w-4 animate-spin text-[var(--text)]" />}
        </div>
      </button>
      <p className="mt-1.5 truncate text-[11px] text-[var(--text-3)]">
        {angleLabel(item.angle)} · {item.set.name}
      </p>
    </motion.div>
  );
};

const ReviewStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const plan = useMemo(() => planRenders(draft, modelSets), [draft, modelSets]);
  const renders = draft.renders;
  const [filter, setFilter] = useState("all");
  const [focusId, setFocusId] = useState(null);
  const [running, setRunning] = useState(null); // { done, total } while rendering
  const [busyIds, setBusyIds] = useState(new Set());
  const [failures, setFailures] = useState({}); // id -> message
  const stopRef = useRef(false);

  const statusOf = (id) => renders[id]?.status ?? null;
  const todo = plan.filter((it) => !renders[it.id] || renders[it.id].signature !== it.signature);
  const counts = {
    keep: plan.filter((it) => statusOf(it.id) === "keep").length,
    reject: plan.filter((it) => statusOf(it.id) === "reject").length,
    review: plan.filter((it) => statusOf(it.id) === "review").length,
  };

  // ---- rendering: 1200 px JPEG from the mockups service, then Cloudinary ----
  const renderOne = useCallback(
    async (it) => {
      const blob = await mockupsApi.studioRender({ ...it.body, w: 1200, quality: 92 });
      const file = new File([blob], `${it.id.replace(/:/g, "_")}.jpg`, { type: "image/jpeg" });
      const url = await uploadImage(file, { scope: "studio-render", draftId: draft.id });
      update((d) => ({
        ...d,
        renders: { ...d.renders, [it.id]: { url, signature: it.signature, status: "review", setId: it.setId, angle: it.angle, code: it.code, renderedAt: Date.now() } },
      }));
    },
    [draft.id, update],
  );

  const run = useCallback(
    async (items) => {
      if (!items.length || running) return;
      stopRef.current = false;
      setFailures({});
      let done = 0;
      setRunning({ done, total: items.length });
      const queue = [...items];
      const worker = async () => {
        while (queue.length && !stopRef.current) {
          const it = queue.shift();
          setBusyIds((s) => new Set(s).add(it.id));
          try {
            await renderOne(it);
          } catch (err) {
            setFailures((f) => ({ ...f, [it.id]: errorText(err) }));
          } finally {
            setBusyIds((s) => {
              const next = new Set(s);
              next.delete(it.id);
              return next;
            });
            done += 1;
            setRunning((r) => r && { ...r, done });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
      setRunning(null);
    },
    [running, renderOne],
  );

  // leaving the step stops rendering after the photos in progress (re-armed on
  // every mount, so React's development double-mount doesn't stop it)
  useEffect(() => {
    stopRef.current = false;
    return () => {
      stopRef.current = true;
    };
  }, []);

  // first visit: render everything
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !plan.length) return;
    started.current = true;
    if (!Object.keys(renders).length) run(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- review ----
  const decide = useCallback(
    (id, status) => {
      if (!renders[id]) return;
      update((d) => ({ ...d, renders: { ...d.renders, [id]: { ...d.renders[id], status } } }));
    },
    [renders, update],
  );
  const star = useCallback(
    (it) => {
      if (!renders[it.id]) return;
      update((d) => ({ ...d, mainByColour: { ...d.mainByColour, [it.code]: it.id }, renders: { ...d.renders, [it.id]: { ...d.renders[it.id], status: "keep" } } }));
    },
    [renders, update],
  );
  const keepAll = () =>
    update((d) => ({
      ...d,
      renders: Object.fromEntries(Object.entries(d.renders).map(([id, r]) => [id, r.status === "review" ? { ...r, status: "keep" } : r])),
    }));

  const visible = plan.filter((it) => filter === "all" || statusOf(it.id) === filter);
  const focus = plan.find((it) => it.id === focusId) ?? visible[0] ?? null;

  // keys: → keep, ← reject (then the next photo), S star, U undo, R re-render
  useEffect(() => {
    const onKey = (e) => {
      if (!focus || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      const i = visible.findIndex((it) => it.id === focus.id);
      const next = () => visible[i + 1] && setFocusId(visible[i + 1].id);
      const k = e.key.toLowerCase();
      if (e.key === "ArrowRight") (e.preventDefault(), decide(focus.id, "keep"), next());
      else if (e.key === "ArrowLeft") (e.preventDefault(), decide(focus.id, "reject"), next());
      else if (k === "s") star(focus);
      else if (k === "u") decide(focus.id, "review");
      else if (k === "r" && !running) run([focus]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, visible, decide, star, run, running]);

  // ---------- left ----------
  const failed = Object.entries(failures);
  const panel = (
    <div className="space-y-7 p-6">
      <div>
        <p className="label mb-3 text-[var(--text-3)]">Render</p>
        {running ? (
          <div className="space-y-3">
            <p className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> Rendering
              </span>
              <span className="font-mono">
                {pad(running.done)} / {pad(running.total)}
              </span>
            </p>
            <div className="h-[3px] bg-[var(--line)]">
              <motion.div className="h-full bg-[var(--accent)]" animate={{ width: `${(running.done / running.total) * 100}%` }} transition={{ duration: 0.3, ease }} />
            </div>
            <Button className="w-full" onClick={() => (stopRef.current = true)}>
              <Square className="h-3.5 w-3.5" /> Stop after current
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-2)]">
              {plan.length} photo{plan.length === 1 ? "" : "s"} · {todo.length ? `${todo.length} new or changed` : "all up to date"}
            </p>
            <Button variant="solid" className="w-full" disabled={!todo.length} onClick={() => run(todo)}>
              <Play className="h-4 w-4" /> Render {todo.length || ""} {todo.length === 1 ? "photo" : "photos"}
            </Button>
            <Button className="w-full" disabled={!plan.length} onClick={() => run(plan)}>
              <RefreshCw className="h-4 w-4" /> Re-render all
            </Button>
          </div>
        )}
        {failed.length > 0 && (
          <div className="mt-3 border border-[var(--error)] p-3 text-xs" role="alert">
            <p className="mb-1 flex items-center gap-2 text-[var(--error)]">
              <AlertTriangle className="h-3.5 w-3.5" /> {failed.length} failed
            </p>
            <p className="text-[var(--text-2)]">{failed[0][1]}</p>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-3 border-y border-[var(--line)] py-4 text-center">
        {[
          ["Kept", counts.keep, "text-[var(--success)]"],
          ["Rejected", counts.reject, "text-[var(--error)]"],
          ["To review", counts.review, "text-[var(--text)]"],
        ].map(([label, n, tone]) => (
          <div key={label}>
            <dd className={`font-mono text-2xl ${tone}`}>{pad(n)}</dd>
            <dt className="label mt-1 !text-[10px] text-[var(--text-3)]">{label}</dt>
          </div>
        ))}
      </dl>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Show</p>
        <Segmented label="Show" options={[["all", "All"], ["review", "To review"], ["keep", "Kept"], ["reject", "Rejected"]]} value={filter} onChange={setFilter} />
      </div>
      <Button className="w-full" disabled={!counts.review} onClick={keepAll}>
        <Check className="h-4 w-4" /> Keep all to review
      </Button>
      <p className="text-[11px] leading-relaxed text-[var(--text-3)]">→ keep · ← reject · S star as main · U undo · R re-render. On touch: swipe right or left, double-tap to star.</p>
    </div>
  );

  // ---------- centre ----------
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {pad(index + 1)} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
        <p className="mt-3 max-w-xl text-[var(--text-2)]">Keep the best photos and star a main photo for every colour. The main photo leads that colour in the shop.</p>
      </div>
      {!plan.length ? (
        <div className="flex h-60 items-center justify-center border border-dashed border-[var(--line-2)] text-center text-sm text-[var(--text-2)]">Nothing to render yet: every photo needs a saved print box (step 4) and an uploaded design file (step 1).</div>
      ) : (
        draft.colours.map((code) => {
          const items = visible.filter((it) => it.code === code);
          const all = plan.filter((it) => it.code === code);
          if (!all.length) return null;
          const colour = all[0].colour;
          const mainOk = renders[draft.mainByColour[code]]?.status === "keep";
          return (
            <section key={code} className="mb-10">
              <header className="mb-3 flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-2">
                <Swatch hex={colour.fabric} />
                <h2 className="text-lg font-medium">{colour.name}</h2>
                <span className="font-mono text-xs text-[var(--text-3)]">
                  {all.filter((it) => renders[it.id]).length} / {all.length}
                </span>
                <span className={`label ml-auto !text-[10px] ${mainOk ? "text-[var(--success)]" : "text-[var(--accent)]"}`}>{mainOk ? "Main photo set" : "Star a main photo"}</span>
              </header>
              {items.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">Nothing in this filter.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
                  {items.map((it) => (
                    <Card
                      key={it.id}
                      item={it}
                      render={renders[it.id]}
                      main={draft.mainByColour[code] === it.id}
                      focused={focus?.id === it.id}
                      busy={busyIds.has(it.id)}
                      onFocus={() => setFocusId(it.id)}
                      onDecide={(s) => decide(it.id, s)}
                      onStar={() => star(it)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );

  // ---------- right ----------
  const fr = focus && renders[focus.id];
  const inspector = !focus ? (
    <div className="flex h-full flex-col justify-center p-6 text-center">
      <CircleDot className="mx-auto mb-3 h-5 w-5 text-[var(--text-3)]" />
      <p className="text-sm text-[var(--text-2)]">Photos appear here as they render.</p>
    </div>
  ) : (
    <div className="space-y-5 p-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={fr?.url ?? focus.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--panel)]">
          {fr ? <img src={fr.url} alt="" className="h-full w-full object-cover" /> : <div className="h-full animate-pulse bg-[var(--panel-2)]" />}
        </motion.div>
      </AnimatePresence>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-[var(--text-3)]">Model</dt>
        <dd className="text-right">{focus.set.name}</dd>
        <dt className="text-[var(--text-3)]">Angle</dt>
        <dd className="text-right">{angleLabel(focus.angle)}</dd>
        <dt className="text-[var(--text-3)]">Colour</dt>
        <dd className="flex items-center justify-end gap-2">
          <Swatch hex={focus.colour.fabric} /> {focus.colour.name}
        </dd>
        <dt className="text-[var(--text-3)]">Prints</dt>
        <dd className="text-right font-mono">{focus.body.prints.length}</dd>
      </dl>
      {fr && fr.signature !== focus.signature && <p className="text-xs text-[var(--accent)]">Outdated: its box, colour or design changed since it was rendered.</p>}
      {failures[focus.id] && <p className="text-xs text-[var(--error)]">{failures[focus.id]}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => decide(focus.id, "reject")} disabled={!fr} className={fr?.status === "reject" ? "!border-[var(--error)] !text-[var(--error)]" : ""}>
          <X className="h-4 w-4" /> Reject
        </Button>
        <Button onClick={() => decide(focus.id, "keep")} disabled={!fr} className={fr?.status === "keep" ? "!border-[var(--success)] !text-[var(--success)]" : ""}>
          <Check className="h-4 w-4" /> Keep
        </Button>
      </div>
      <Button variant={draft.mainByColour[focus.code] === focus.id ? "solid" : "outline"} className="w-full" disabled={!fr} onClick={() => star(focus)}>
        <Star className="h-4 w-4" /> {draft.mainByColour[focus.code] === focus.id ? "Main photo" : `Main photo for ${focus.colour.name}`}
      </Button>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={Boolean(running)} onClick={() => run([focus])}>
          <RefreshCw className="h-4 w-4" /> Re-render
        </Button>
        {fr && (
          <a href={fr.url} target="_blank" rel="noreferrer" className="label grid h-10 w-10 place-items-center border border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--text)]" aria-label="Open full size" title="Open full size">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="scroll-y h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
      <aside className="border-b border-[var(--line)] lg:overflow-y-auto lg:border-b-0 lg:border-r">{panel}</aside>
      <div className="lg:overflow-y-auto">
        {stage}
        <div className="border-t border-[var(--line)] xl:hidden">{inspector}</div>
      </div>
      <aside className="hidden border-l border-[var(--line)] xl:block xl:overflow-y-auto">{inspector}</aside>
    </div>
  );
};

export default ReviewStep;
