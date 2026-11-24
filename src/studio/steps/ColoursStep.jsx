// Step 3: colour orbs, the 3D tee, a reorderable palette tray, and a
// before/after slider of the recolour for the selected colour.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { AlertTriangle, Check, GripVertical, Loader2, Search, X } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import TeeStage from "../ui/TeeStage";
import { Chip, GhostButton, Label, spring } from "../ui/primitives";
import { PALETTE, colourOf, isDark } from "../data/sample";
import { useStudio } from "../context";
import { Segmented, StageHeader } from "./common";

const GROUPS = ["Darks", "Lights", "Brights"];

const Orb = ({ colour, on, onToggle, onHover, status }) => (
  <motion.button
    type="button"
    onClick={onToggle}
    onPointerEnter={() => onHover(colour.code)}
    onFocus={() => onHover(colour.code)}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    aria-pressed={on}
    title={colour.name}
    className="relative h-11 w-11 rounded-full"
    style={{
      background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 38%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.35), transparent 60%), ${colour.hex}`,
      boxShadow: on ? `0 0 0 2px #0a0a0c, 0 0 0 4px #ff5c8a, 0 8px 24px -8px ${colour.hex}` : `inset 0 0 0 1px rgba(255,255,255,0.12), 0 6px 18px -10px ${colour.hex}`,
    }}
  >
    <AnimatePresence>
      {on && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="absolute inset-0 grid place-items-center">
          {status === "making" ? <Loader2 className={`h-4 w-4 animate-spin ${isDark(colour.hex) ? "text-white" : "text-black"}`} /> : status === "failed" ? <AlertTriangle className="h-4 w-4 text-[#ff5c6c]" /> : <Check className={`h-4 w-4 ${isDark(colour.hex) ? "text-white" : "text-black"}`} />}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

/** Green base on the left, the recoloured shirt on the right of the handle. */
const BeforeAfter = ({ set, colour }) => {
  const [split, setSplit] = useState(50);
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
      <ModelFigure angle="front" tee="#00b140" skin={set.skin} hair={set.hair} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <ModelFigure angle="front" tee={colour.hex} skin={set.skin} hair={set.hair} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-black">⇆</span>
      </div>
      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">Base</span>
      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">{colour.name}</span>
      <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="Compare base and colour" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
};

const ColoursStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(draft.colours[0] ?? null);
  const [status, setStatus] = useState(() => Object.fromEntries(draft.colours.map((c) => [c, "ready"])));
  const [variantOverride, setVariantOverride] = useState({});
  const shownCode = hover ?? selected ?? draft.colours[0] ?? "Bk";
  const shown = colourOf(shownCode);
  const hasDark = draft.design.files.some((f) => f.variant === "dark");
  const sets = modelSets.filter((m) => draft.modelSetIds.includes(m.id));
  const filtered = useMemo(() => PALETTE.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())), [query]);

  // simulate making the colourways for newly chosen colours
  useEffect(() => {
    const fresh = draft.colours.filter((c) => !status[c]);
    if (!fresh.length) return undefined;
    setStatus((s) => ({ ...s, ...Object.fromEntries(fresh.map((c) => [c, "making"])) }));
    const t = setTimeout(() => setStatus((s) => ({ ...s, ...Object.fromEntries(fresh.map((c) => [c, "ready"])) })), 1300);
    return () => clearTimeout(t);
  }, [draft.colours, status]);

  const toggle = (code) => {
    setSelected(code);
    update((d) => ({ ...d, colours: d.colours.includes(code) ? d.colours.filter((c) => c !== code) : [...d.colours, code] }));
  };
  const pick = (codes) => update((d) => ({ ...d, colours: [...new Set([...d.colours, ...codes])] }));

  const panel = (
    <div className="space-y-5">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search colours" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[var(--text-3)] focus:outline-none" />
      </label>
      <div className="flex flex-wrap gap-2">
        <GhostButton size="xs" onClick={() => pick(PALETTE.filter((c) => c.group === "Darks").map((c) => c.code))}>All darks</GhostButton>
        <GhostButton size="xs" onClick={() => pick(["Bk", "Wh", "BB", "Mn"])}>Last used</GhostButton>
        <GhostButton size="xs" onClick={() => update((d) => ({ ...d, colours: [] }))}>Clear</GhostButton>
      </div>
      {GROUPS.map((group) => {
        const list = filtered.filter((c) => c.group === group);
        if (!list.length) return null;
        return (
          <div key={group}>
            <Label>{group}</Label>
            <div className="grid grid-cols-5 gap-3">
              {list.map((c) => (
                <Orb key={c.code} colour={c} on={draft.colours.includes(c.code)} status={status[c.code]} onToggle={() => toggle(c.code)} onHover={setHover} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const stage = (
    <>
      <StageHeader step={step} index={index}>
        <Chip tone="accent">{draft.colours.length} colours · {draft.colours.length * Math.max(1, sets.reduce((n, s) => n + (draft.anglesBySet[s.id]?.length ?? 0), 0))} photos</Chip>
      </StageHeader>
      <div className="relative" onPointerLeave={() => setHover(null)}>
        <TeeStage colour={shown.hex} front={draft.design.files.some((f) => f.slot !== "BK")} backPrint={draft.design.files.some((f) => f.slot === "BK")} />
        <p className="mt-1 text-center font-display text-lg text-white">{shown.name}</p>
      </div>
      <div className="mt-8">
        <Label hint="drag to set the order in the shop">Palette tray</Label>
        {draft.colours.length === 0 ? (
          <p className="glass rounded-2xl p-6 text-center text-sm text-[var(--text-3)]">Choose colours from the left. They line up here.</p>
        ) : (
          <Reorder.Group axis="x" values={draft.colours} onReorder={(colours) => update((d) => ({ ...d, colours }))} className="flex flex-wrap gap-2">
            {draft.colours.map((code) => {
              const c = colourOf(code);
              return (
                <Reorder.Item
                  key={code}
                  value={code}
                  onClick={() => setSelected(code)}
                  className={`glass flex cursor-grab items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2 active:cursor-grabbing ${selected === code ? "ring-aurora" : ""}`}
                  whileDrag={{ scale: 1.06 }}
                >
                  <span className="h-6 w-6 rounded-full" style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }} />
                  <span className="text-xs text-white">{c.name}</span>
                  {status[code] === "making" && <Loader2 className="h-3 w-3 animate-spin text-[var(--text-3)]" />}
                  <GripVertical className="h-3.5 w-3.5 text-[var(--text-3)]" />
                  <button type="button" onClick={(e) => (e.stopPropagation(), toggle(code))} className="rounded-full p-0.5 text-[var(--text-3)] hover:text-white" aria-label={`Remove ${c.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>
    </>
  );

  const sel = selected && draft.colours.includes(selected) ? colourOf(selected) : null;
  const dark = sel && isDark(sel.hex);
  const variant = sel ? (variantOverride[sel.code] ?? (dark && hasDark ? "dark" : "normal")) : "normal";
  const inspector = sel ? (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full" style={{ background: sel.hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }} />
        <div>
          <p className="font-display text-lg font-semibold text-white">{sel.name}</p>
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            {sel.code} · {sel.hex}
          </p>
        </div>
      </div>
      {sets[0] && <BeforeAfter set={sets[0]} colour={sel} />}
      <div>
        <Label>Colourways</Label>
        <ul className="space-y-1.5">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
              <span className="text-[var(--text-2)]">{s.name}</span>
              {status[sel.code] === "making" ? <Chip tone="warning">Making</Chip> : <Chip tone="success">Ready</Chip>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Label hint={dark ? "dark garment" : "light garment"}>Design variant</Label>
        <Segmented options={[["normal", "Normal"], ["dark", "[BK] dark"]]} value={variant} onChange={(v) => setVariantOverride((o) => ({ ...o, [sel.code]: v }))} />
        {!hasDark && variant === "dark" && <p className="mt-2 text-xs text-[#ffb547]">No [BK] file uploaded; the normal file will be used.</p>}
      </div>
    </div>
  ) : (
    <p className="text-sm text-[var(--text-3)]">Choose a colour to compare it with the base and pick its design variant.</p>
  );

  return <Workspace panel={panel} panelTitle="Palette" stage={stage} inspector={inspector} inspectorTitle="Colour" />;
};

export default ColoursStep;
