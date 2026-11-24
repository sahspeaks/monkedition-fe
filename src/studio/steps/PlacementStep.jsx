// Step 4: one box per model set × angle, saved for every colour. The prototype
// box moves and resizes; the real canvas (rotate, free reshape, live render)
// is the existing PlacementCanvas, restyled, in phase 4.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus, RotateCcw, RotateCw, Save } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import { AuroraButton, Chip, GhostButton, Kbd, Label, SelectInput, spring } from "../ui/primitives";
import { ANGLES, angleLabel, colourOf } from "../data/sample";
import { boxesToSet } from "../steps";
import { useStudio } from "../context";
import { Segmented, Slider, StageHeader } from "./common";

const DEFAULT_BOX = { front: [39, 37, 22, 21], front_45: [41, 37, 19, 21], closeup: [36, 38, 28, 30], back: [36, 36, 28, 29], rear_45: [39, 36, 23, 29] };

const BoxEditor = ({ box, setBox, colourHex, angle, set }) => {
  const ref = useRef(null);
  const pan = (fn) => (_, info) => {
    const r = ref.current.getBoundingClientRect();
    fn((info.delta.x / r.width) * 100, (info.delta.y / r.height) * 100);
  };
  const [x, y, w, h] = box;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return (
    <div ref={ref} className="relative mx-auto aspect-[4/5] w-full max-w-[min(100%,52vh)] overflow-hidden rounded-3xl shadow-[0_40px_120px_-40px_rgba(124,92,255,0.45)]">
      <ModelFigure angle={angle} tee={colourHex} skin={set?.skin} hair={set?.hair} className="absolute inset-0 h-full w-full" />
      <motion.div
        className="absolute cursor-move touch-none rounded-sm"
        style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: "linear-gradient(135deg, rgba(124,92,255,0.25), rgba(255,92,138,0.25), rgba(255,181,71,0.25))", boxShadow: "0 0 0 1.5px #ff5c8a" }}
        onPan={pan((dx, dy) => setBox([clamp(x + dx, 0, 100 - w), clamp(y + dy, 0, 100 - h), w, h]))}
      >
        {[
          ["-left-1.5 -top-1.5", -1, -1],
          ["-right-1.5 -top-1.5", 1, -1],
          ["-right-1.5 -bottom-1.5", 1, 1],
          ["-left-1.5 -bottom-1.5", -1, 1],
        ].map(([pos, sx, sy]) => (
          <motion.span
            key={pos}
            className={`absolute ${pos} h-3 w-3 cursor-nwse-resize touch-none rounded-full bg-white shadow`}
            onPan={pan((dx) => {
              const nw = clamp(w + dx * sx, 5, 80);
              const nh = (nw / w) * h; // keep proportions
              setBox([sx < 0 ? x + (w - nw) : x, sy < 0 ? y + (h - nh) : y, nw, nh]);
            })}
          />
        ))}
        <span className="absolute -top-7 left-1/2 h-5 w-px -translate-x-1/2 bg-[#ff5c8a]" />
        <span className="absolute -top-9 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#ff5c8a] bg-[#0a0a0c]" title="Rotate" />
      </motion.div>
    </div>
  );
};

const PlacementStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const keys = useMemo(() => boxesToSet(draft), [draft]);
  const [current, setCurrent] = useState(keys.find((k) => !draft.boxes[k]) ?? keys[0]);
  const [boxes, setBoxes] = useState({});
  const [fit, setFit] = useState("contain");
  const [params, setParams] = useState({ fold: 0.9, shadow: 1.1, opacity: 0.95, mask: 1 });
  const [colour, setColour] = useState(draft.colours[0] ?? "Bk");
  const [justSaved, setJustSaved] = useState(null);

  useEffect(() => {
    if (!keys.includes(current)) setCurrent(keys[0]);
  }, [keys, current]);

  if (!current) {
    return <Workspace stage={<><StageHeader step={step} index={index} /><p className="glass rounded-2xl p-8 text-center text-[var(--text-2)]">No angle in this product takes a print. Go back to Models and pick front or back angles.</p></>} />;
  }

  const [setId, angle] = current.split(":");
  const set = modelSets.find((m) => m.id === setId);
  const box = boxes[current] ?? DEFAULT_BOX[angle] ?? DEFAULT_BOX.front;
  const setBox = (b) => setBoxes((all) => ({ ...all, [current]: b }));
  const remaining = keys.filter((k) => !draft.boxes[k]);
  const save = () => {
    update((d) => ({ ...d, boxes: { ...d.boxes, [current]: true } }));
    setJustSaved(current);
    setTimeout(() => setJustSaved(null), 1200);
    const next = keys.find((k) => k !== current && !draft.boxes[k]);
    if (next) setTimeout(() => setCurrent(next), 500);
  };

  const panel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Chip tone={remaining.length ? "warning" : "success"}>{remaining.length ? `${remaining.length} to set` : "All set"}</Chip>
        <GhostButton size="xs" disabled={!remaining.length} onClick={() => setCurrent(remaining.find((k) => k !== current) ?? remaining[0])}>
          Next needing a box <ArrowRight className="h-3 w-3" />
        </GhostButton>
      </div>
      {draft.modelSetIds.map((sid) => {
        const ms = modelSets.find((m) => m.id === sid);
        const list = keys.filter((k) => k.startsWith(`${sid}:`));
        if (!list.length) return null;
        return (
          <div key={sid}>
            <Label>{ms?.name}</Label>
            <ul className="space-y-1.5">
              {list.map((k) => {
                const a = k.split(":")[1];
                const saved = draft.boxes[k];
                return (
                  <li key={k}>
                    <button type="button" onClick={() => setCurrent(k)} className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left ${k === current ? "ring-aurora border-transparent bg-white/[0.06]" : "border-white/[0.06] hover:border-white/15"}`}>
                      <ModelFigure angle={a} tee={colourOf(colour)?.hex ?? "#111"} skin={ms?.skin} hair={ms?.hair} className="h-12 w-10 shrink-0 rounded-md" />
                      <span className="flex-1 text-sm text-white">{angleLabel(a)}</span>
                      {saved ? <Chip tone="success"><Check className="h-3 w-3" /> Saved</Chip> : <Chip tone="warning">Needs box</Chip>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  const stage = (
    <>
      <StageHeader step={step} index={index}>
        <div className="flex flex-wrap items-center gap-1.5">
          <GhostButton size="xs" aria-label="Smaller" onClick={() => setBox([box[0] + box[2] * 0.025, box[1] + box[3] * 0.025, box[2] * 0.95, box[3] * 0.95])}><Minus className="h-3.5 w-3.5" /></GhostButton>
          <GhostButton size="xs" aria-label="Bigger" onClick={() => setBox([box[0] - box[2] * 0.025, box[1] - box[3] * 0.025, box[2] * 1.05, box[3] * 1.05])}><Plus className="h-3.5 w-3.5" /></GhostButton>
          <GhostButton size="xs" aria-label="Rotate anticlockwise"><RotateCcw className="h-3.5 w-3.5" /></GhostButton>
          <GhostButton size="xs" aria-label="Rotate clockwise"><RotateCw className="h-3.5 w-3.5" /></GhostButton>
          <span className="ml-1 hidden text-[11px] text-[var(--text-3)] md:inline">
            <Kbd>←↑↓→</Kbd> move · <Kbd>[ ]</Kbd> rotate · <Kbd>⌘S</Kbd> save
          </span>
        </div>
      </StageHeader>
      <div className="relative">
        <p className="mb-3 text-center text-sm text-[var(--text-2)]">
          {set?.name} · <span className="text-white">{angleLabel(angle)}</span>
        </p>
        <BoxEditor box={box} setBox={setBox} colourHex={colourOf(colour)?.hex ?? "#111"} angle={angle} set={set} />
        {justSaved === current && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora px-5 py-2.5 font-medium text-white shadow-2xl">
            <Check className="mr-1 inline h-4 w-4" /> Box saved
          </motion.div>
        )}
      </div>
      <div className="mt-6">
        <Label hint="the same box on every colour">Colour check</Label>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {draft.colours.map((code) => {
            const c = colourOf(code);
            return (
              <button key={code} type="button" onClick={() => setColour(code)} className={`shrink-0 overflow-hidden rounded-xl border ${code === colour ? "ring-aurora border-transparent" : "border-white/10"}`}>
                <ModelFigure angle={angle} tee={c.hex} skin={set?.skin} hair={set?.hair} print={ANGLES.find((a) => a.key === angle).takes.find((s) => draft.design.files.some((f) => f.slot === s))} className="h-28 w-[5.6rem]" />
                <span className="block bg-black/50 px-2 py-1 text-[10px] text-[var(--text-2)]">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const inspector = (
    <div className="space-y-5">
      <SelectInput label="Preset" defaultValue={angle.startsWith("back") || angle === "rear_45" ? "back_large" : "front_large"}>
        <option value="front_large">Front — Large graphic</option>
        <option value="front_top_half">Front — Top-half wide</option>
        <option value="left_chest">Front — Small chest</option>
        <option value="back_large">Back — Large graphic</option>
      </SelectInput>
      <div>
        <Label>Fit</Label>
        <Segmented options={[["contain", "Keep aspect"], ["stretch", "Stretch"]]} value={fit} onChange={setFit} />
      </div>
      <div className="space-y-3">
        <Slider label="Fold strength" value={params.fold} min={0} max={2} step={0.05} onChange={(v) => setParams((p) => ({ ...p, fold: v }))} />
        <Slider label="Shadow" value={params.shadow} min={0} max={2} step={0.05} onChange={(v) => setParams((p) => ({ ...p, shadow: v }))} />
        <Slider label="Opacity" value={params.opacity} min={0.3} max={1} step={0.02} onChange={(v) => setParams((p) => ({ ...p, opacity: v }))} />
        <Slider label="Mask tightness" value={params.mask} min={0} max={1} step={0.05} onChange={(v) => setParams((p) => ({ ...p, mask: v }))} />
      </div>
      <GhostButton className="w-full">Own box for one design</GhostButton>
      <AuroraButton className="w-full" onClick={save}>
        <Save className="h-4 w-4" /> Save as this angle&apos;s box
      </AuroraButton>
    </div>
  );

  return <Workspace panel={panel} panelTitle="Angles" stage={stage} inspector={inspector} inspectorTitle="Box" />;
};

export default PlacementStep;
