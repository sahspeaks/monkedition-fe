// Step 5: renders fill in live; keep / reject with swipe or keys; star a main
// image per colour.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, RefreshCw, Star, X } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import { Chip, GhostButton, Kbd, Label, ProgressRing } from "../ui/primitives";
import { angleLabel, colourOf, plannedRenders } from "../data/sample";
import { useStudio } from "../context";
import { Develop, Segmented, StageHeader } from "./common";

const ReviewCard = ({ item, set, state, main, focused, onFocus, onDecide, onStar }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 160], [-10, 10]);
  const keepGlow = useTransform(x, [0, 120], [0, 1]);
  const rejectGlow = useTransform(x, [-120, 0], [1, 0]);
  return (
    <motion.div
      layout
      drag="x"
      dragSnapToOrigin
      dragElastic={0.5}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) onDecide("keep");
        else if (info.offset.x < -110) onDecide("reject");
      }}
      onClick={onFocus}
      onDoubleClick={onStar}
      className={`group relative mb-4 cursor-pointer touch-pan-y break-inside-avoid overflow-hidden rounded-2xl border ${focused ? "ring-aurora border-transparent" : "border-white/[0.08]"} ${state === "reject" ? "opacity-35 grayscale" : ""}`}
    >
      <Develop>
        <ModelFigure angle={item.angle} tee={colourOf(item.code).hex} skin={set?.skin} hair={set?.hair} print={item.slot} className={`w-full ${item.angle === "closeup" ? "aspect-square" : "aspect-[4/5]"}`} />
      </Develop>
      <motion.div className="pointer-events-none absolute inset-0 bg-[#3ddc97]/25" style={{ opacity: keepGlow }} />
      <motion.div className="pointer-events-none absolute inset-0 bg-[#ff5c6c]/25" style={{ opacity: rejectGlow }} />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
        <span className="text-[11px] text-white/80">
          {set?.name.split(" ·")[0]} · {angleLabel(item.angle)}
        </span>
        {state === "keep" && <Check className="h-4 w-4 text-[#3ddc97]" />}
        {state === "reject" && <X className="h-4 w-4 text-[#ff5c6c]" />}
      </div>
      <button
        type="button"
        onClick={(e) => (e.stopPropagation(), onStar())}
        aria-label={main ? "Main image" : "Make main image"}
        className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${main ? "bg-aurora text-white" : "bg-black/50 text-white/70 opacity-0 group-hover:opacity-100"}`}
      >
        <Star className={`h-4 w-4 ${main ? "fill-white" : ""}`} />
      </button>
    </motion.div>
  );
};

const ReviewStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const all = useMemo(() => plannedRenders(draft), [draft]);
  const [rendered, setRendered] = useState(() => (Object.keys(draft.review).length || Object.keys(draft.mainByColour).length ? all.length : 0));
  const [filter, setFilter] = useState("all");
  const [focusId, setFocusId] = useState(null);

  useEffect(() => {
    if (rendered >= all.length) return undefined;
    const t = setTimeout(() => setRendered((n) => n + 1), 140);
    return () => clearTimeout(t);
  }, [rendered, all.length]);

  const done = all.slice(0, rendered);
  const visible = done.filter((r) => filter === "all" || (filter === "todo" ? !draft.review[r.id] : draft.review[r.id] === filter));
  const focus = all.find((r) => r.id === focusId) ?? visible[0];

  const decide = useCallback((id, state) => update((d) => ({ ...d, review: { ...d.review, [id]: state } })), [update]);
  const star = useCallback(
    (item) => update((d) => ({ ...d, mainByColour: { ...d.mainByColour, [item.code]: item.id }, review: { ...d.review, [item.id]: "keep" } })),
    [update],
  );

  // keyboard triage: ← reject, → keep, S star, moves to the next image
  useEffect(() => {
    const onKey = (e) => {
      if (!focus || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      const i = visible.findIndex((r) => r.id === focus.id);
      const next = () => visible[i + 1] && setFocusId(visible[i + 1].id);
      if (e.key === "ArrowRight") (decide(focus.id, "keep"), next());
      else if (e.key === "ArrowLeft") (decide(focus.id, "reject"), next());
      else if (e.key.toLowerCase() === "s") star(focus);
      else if (e.key.toLowerCase() === "u") update((d) => {
        const review = { ...d.review };
        delete review[focus.id];
        return { ...d, review };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, visible, decide, star, update]);

  const counts = {
    keep: done.filter((r) => draft.review[r.id] === "keep").length,
    reject: done.filter((r) => draft.review[r.id] === "reject").length,
  };

  const panel = (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Kept", counts.keep, "text-[#3ddc97]"],
          ["Rejected", counts.reject, "text-[#ff5c6c]"],
          ["To review", done.length - counts.keep - counts.reject, "text-white"],
        ].map(([label, n, tone]) => (
          <div key={label} className="rounded-xl bg-white/[0.04] p-3">
            <p className={`font-mono text-xl ${tone}`}>{n}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">{label}</p>
          </div>
        ))}
      </div>
      <div>
        <Label>Show</Label>
        <Segmented options={[["all", "All"], ["todo", "To review"], ["keep", "Kept"], ["reject", "Rejected"]]} value={filter} onChange={setFilter} />
      </div>
      <GhostButton className="w-full" onClick={() => update((d) => ({ ...d, review: Object.fromEntries(all.map((r) => [r.id, d.review[r.id] ?? "keep"])) }))}>
        <Check className="h-4 w-4" /> Keep all unreviewed
      </GhostButton>
      <div className="space-y-1.5 rounded-xl bg-white/[0.03] p-3 text-xs text-[var(--text-2)]">
        <p><Kbd>→</Kbd> keep · <Kbd>←</Kbd> reject · <Kbd>S</Kbd> star · <Kbd>U</Kbd> undo</p>
        <p>Touch: swipe right / left, double-tap to star.</p>
      </div>
    </div>
  );

  const stage = (
    <>
      <StageHeader step={step} index={index}>
        {rendered < all.length && (
          <span className="flex items-center gap-3 text-sm text-[var(--text-2)]">
            <ProgressRing value={rendered / all.length} /> Rendering <span className="font-mono text-white">{rendered} / {all.length}</span>
          </span>
        )}
      </StageHeader>
      {draft.colours.map((code) => {
        const c = colourOf(code);
        const items = visible.filter((r) => r.code === code);
        const total = all.filter((r) => r.code === code).length;
        const made = done.filter((r) => r.code === code).length;
        return (
          <section key={code} className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-5 w-5 rounded-full" style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)" }} />
              <h3 className="text-lg font-semibold text-white">{c.name}</h3>
              {made < total ? <ProgressRing value={made / total} size={22} stroke={2.5} /> : draft.mainByColour[code] ? <Chip tone="success"><Star className="h-3 w-3" /> Main set</Chip> : <Chip tone="warning">Star a main image</Chip>}
            </div>
            <div className="columns-2 gap-4 md:columns-3 2xl:columns-4">
              <AnimatePresence>
                {items.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    set={modelSets.find((m) => m.id === item.setId)}
                    state={draft.review[item.id]}
                    main={draft.mainByColour[code] === item.id}
                    focused={focus?.id === item.id}
                    onFocus={() => setFocusId(item.id)}
                    onDecide={(s) => decide(item.id, s)}
                    onStar={() => star(item)}
                  />
                ))}
              </AnimatePresence>
              {Array.from({ length: Math.max(0, total - made) }).map((_, i) => (
                <div key={`sk${i}`} className="shimmer mb-4 aspect-[4/5] break-inside-avoid rounded-2xl" />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );

  const set = focus && modelSets.find((m) => m.id === focus.setId);
  const inspector = focus ? (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl">
        <ModelFigure angle={focus.angle} tee={colourOf(focus.code).hex} skin={set?.skin} hair={set?.hair} print={focus.slot} className="aspect-[4/5] w-full" />
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-[var(--text-3)]">Model</dt><dd className="text-right text-white">{set?.name}</dd>
        <dt className="text-[var(--text-3)]">Angle</dt><dd className="text-right text-white">{angleLabel(focus.angle)}</dd>
        <dt className="text-[var(--text-3)]">Colour</dt><dd className="text-right text-white">{colourOf(focus.code).name}</dd>
        <dt className="text-[var(--text-3)]">Print</dt><dd className="text-right font-mono text-white">{focus.slot}</dd>
      </dl>
      <div className="grid grid-cols-2 gap-2">
        <GhostButton onClick={() => decide(focus.id, "reject")} active={draft.review[focus.id] === "reject"}><X className="h-4 w-4" /> Reject</GhostButton>
        <GhostButton onClick={() => decide(focus.id, "keep")} active={draft.review[focus.id] === "keep"}><Check className="h-4 w-4" /> Keep</GhostButton>
      </div>
      <GhostButton className="w-full" onClick={() => star(focus)} active={draft.mainByColour[focus.code] === focus.id}>
        <Star className="h-4 w-4" /> Main image for {colourOf(focus.code).name}
      </GhostButton>
      <GhostButton className="w-full"><RefreshCw className="h-4 w-4" /> Re-render with a tweak</GhostButton>
    </div>
  ) : (
    <p className="text-sm text-[var(--text-3)]">Images appear as they render.</p>
  );

  return <Workspace panel={panel} panelTitle="Review" stage={stage} inspector={inspector} inspectorTitle="Image" />;
};

export default ReviewStep;
