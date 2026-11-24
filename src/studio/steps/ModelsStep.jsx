// Step 2: model sets from the library, and the "photoshoot" to make a new one.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, RefreshCw, Search, Sparkles, Upload, X } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import { AuroraButton, Chip, GhostButton, Label, TextArea, TextInput, TiltCard, spring } from "../ui/primitives";
import { ANGLES, MIN_ANGLES, angleLabel } from "../data/sample";
import { useStudio } from "../context";
import { Develop, Segmented, StageHeader, Stagger, StaggerItem } from "./common";

const GREEN = "#00b140";

/** Cover that cycles through the set's angles while hovered. */
const ModelCover = ({ set }) => {
  const [hover, setHover] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!hover) return setI(0);
    const t = setInterval(() => setI((n) => (n + 1) % set.angles.length), 650);
    return () => clearInterval(t);
  }, [hover, set.angles.length]);
  return (
    <div className="relative aspect-[4/5]" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={set.angles[i]} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <ModelFigure angle={set.angles[i]} tee={GREEN} skin={set.skin} hair={set.hair} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur">{angleLabel(set.angles[i])}</span>
    </div>
  );
};

// ---------- photoshoot overlay ----------
const SKINS = [
  ["#b07a55", "#1b1410"],
  ["#8d5a3b", "#120d0a"],
  ["#c48b62", "#2a1d14"],
  ["#9c6646", "#0f0b09"],
];

const Photoshoot = ({ onClose, onSave }) => {
  const [part, setPart] = useState(0); // 0 brief, 1 front, 2 angles, 3 save
  const [brief, setBrief] = useState({ gender: "Men", text: "", model: "pro", angles: ANGLES.map((a) => a.key) });
  const [candidates, setCandidates] = useState(null);
  const [front, setFront] = useState(null);
  const [made, setMade] = useState({}); // angle -> "making" | "done"
  const [name, setName] = useState("");
  const parts = ["Brief", "Front", "Angles", "Save"];
  const cost = brief.model === "pro" ? 0.13 : 0.04; // per image, illustrative

  const makeCandidates = () => {
    setPart(1);
    setCandidates(null);
    setTimeout(() => setCandidates(SKINS.map(([skin, hair], i) => ({ id: i, skin, hair }))), 1400);
  };
  const makeAngles = () => {
    setPart(2);
    const rest = brief.angles.filter((a) => a !== "front");
    setMade(Object.fromEntries(rest.map((a) => [a, "making"])));
    rest.forEach((a, i) => setTimeout(() => setMade((m) => ({ ...m, [a]: "done" })), 900 + i * 650));
  };
  const regenerate = (angle) => {
    setMade((m) => ({ ...m, [angle]: "making" }));
    setTimeout(() => setMade((m) => ({ ...m, [angle]: "done" })), 1100);
  };
  const allDone = Object.values(made).every((s) => s === "done");

  return (
    <motion.div className="absolute inset-0 z-50 flex flex-col bg-[#0a0a0c]/90 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#ff5c8a]" />
          <h2 className="font-display text-xl font-semibold text-white">New model set</h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {parts.map((p, i) => (
            <span key={p} className={`rounded-full px-3 py-1 text-xs ${i === part ? "bg-white/10 text-white" : i < part ? "text-[var(--text-2)]" : "text-white/30"}`}>
              {i + 1}. {p}
            </span>
          ))}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-white/5" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="scroll-y flex-1 p-6">
        <AnimatePresence mode="wait">
          {part === 0 && (
            <motion.div key="brief" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="glass space-y-5 rounded-2xl p-6">
                <div>
                  <Label>Model</Label>
                  <Segmented options={[["Men", "Men"], ["Women", "Women"]]} value={brief.gender} onChange={(gender) => setBrief((b) => ({ ...b, gender }))} />
                </div>
                <TextArea label="Custom direction" hint="optional" placeholder="e.g. curly hair, warmer lighting, urban backdrop" value={brief.text} onChange={(e) => setBrief((b) => ({ ...b, text: e.target.value }))} />
                <div>
                  <Label>Gemini model</Label>
                  <Segmented options={[["pro", "Pro · best match"], ["flash", "Flash · cheaper"]]} value={brief.model} onChange={(model) => setBrief((b) => ({ ...b, model }))} />
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <Label hint={`at least ${MIN_ANGLES}`}>Angles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ANGLES.map((a) => {
                    const on = brief.angles.includes(a.key);
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={a.key === "front"}
                        onClick={() => setBrief((b) => ({ ...b, angles: on ? b.angles.filter((x) => x !== a.key) : [...b.angles, a.key] }))}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${on ? "border-[#7c5cff]/50 bg-[#7c5cff]/10 text-white" : "border-white/10 text-[var(--text-2)] hover:border-white/25"}`}
                      >
                        <span className={`grid h-4 w-4 place-items-center rounded ${on ? "bg-aurora" : "border border-white/25"}`}>{on && <Check className="h-3 w-3" />}</span>
                        {a.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-5">
                  <div>
                    <p className="text-xs text-[var(--text-3)]">Estimated cost</p>
                    <p className="font-mono text-lg text-white">
                      ≈ ${((4 + brief.angles.length - 1) * cost).toFixed(2)}
                      <span className="ml-2 text-xs text-[var(--text-3)]">4 fronts + {brief.angles.length - 1} angles</span>
                    </p>
                  </div>
                  <AuroraButton disabled={brief.angles.length < MIN_ANGLES} onClick={makeCandidates}>
                    <Sparkles className="h-4 w-4" /> Generate fronts
                  </AuroraButton>
                </div>
              </div>
            </motion.div>
          )}

          {part === 1 && (
            <motion.div key="front" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto max-w-5xl">
              <p className="mb-4 text-center text-sm text-[var(--text-2)]">Pick the front shot. Every other angle is generated from it, so it is the same person.</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {(candidates ?? SKINS).map((c, i) =>
                  candidates ? (
                    <Develop key={i} delay={i * 0.15}>
                      <button type="button" onClick={() => setFront(c)} className={`relative w-full overflow-hidden rounded-2xl border ${front?.id === c.id ? "ring-aurora border-transparent" : "border-white/10 hover:border-white/30"}`}>
                        <ModelFigure angle="front" tee={GREEN} skin={c.skin} hair={c.hair} className="aspect-[4/5] w-full" />
                        {front?.id === c.id && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-aurora"><Check className="h-4 w-4" /></span>}
                      </button>
                    </Develop>
                  ) : (
                    <div key={i} className="shimmer aspect-[4/5] rounded-2xl border border-white/[0.06]" />
                  ),
                )}
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <GhostButton onClick={makeCandidates} disabled={!candidates}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </GhostButton>
                <AuroraButton disabled={!front} onClick={makeAngles}>
                  Use this front → make angles
                </AuroraButton>
              </div>
            </motion.div>
          )}

          {part === 2 && (
            <motion.div key="angles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto max-w-6xl">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {brief.angles.map((angle) => (
                  <div key={angle} className="glass overflow-hidden rounded-2xl">
                    {angle === "front" || made[angle] === "done" ? (
                      <Develop>
                        <ModelFigure angle={angle} tee={GREEN} skin={front.skin} hair={front.hair} className="aspect-[4/5] w-full" />
                      </Develop>
                    ) : (
                      <div className="shimmer aspect-[4/5]" />
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-[var(--text-2)]">{angleLabel(angle)}</span>
                      {angle !== "front" && (
                        <button type="button" onClick={() => regenerate(angle)} disabled={made[angle] !== "done"} className="rounded p-1 text-[var(--text-3)] hover:text-white disabled:opacity-30" aria-label={`Regenerate ${angleLabel(angle)}`}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <AuroraButton disabled={!allDone} onClick={() => setPart(3)}>
                  {allDone ? "Accept angles" : `Making angles… ${Object.values(made).filter((s) => s === "done").length} / ${Object.keys(made).length}`}
                </AuroraButton>
              </div>
            </motion.div>
          )}

          {part === 3 && (
            <motion.div key="save" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto max-w-md">
              <div className="glass space-y-5 rounded-2xl p-6">
                <div className="mx-auto w-40 overflow-hidden rounded-2xl">
                  <ModelFigure angle="front" tee={GREEN} skin={front.skin} hair={front.hair} className="aspect-[4/5] w-full" />
                </div>
                <TextInput label="Name" placeholder="e.g. Dev · studio grey" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <AuroraButton
                  className="w-full"
                  disabled={!name.trim()}
                  onClick={() => onSave({ id: `ms${Date.now()}`, name: name.trim(), gender: brief.gender, source: "Generated", skin: front.skin, hair: front.hair, angles: brief.angles, boxes: [] })}
                >
                  Save to library
                </AuroraButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ---------- the step ----------
const ModelsStep = ({ draft, update, step, index }) => {
  const { modelSets, setModelSets } = useStudio();
  const [gender, setGender] = useState("All");
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState(draft.modelSetIds[0] ?? null);
  const [shoot, setShoot] = useState(false);
  const [portal, setPortal] = useState(null); // the Studio root, so the photoshoot covers the whole screen
  useEffect(() => setPortal(document.getElementById("studio-root") ?? document.body), []);
  const slots = new Set(draft.design.files.map((f) => f.slot));

  const shown = useMemo(
    () =>
      modelSets.filter(
        (m) => (gender === "All" || m.gender === gender) && (source === "All" || m.source === source) && m.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [modelSets, gender, source, query],
  );
  const focus = modelSets.find((m) => m.id === focusId);
  const usable = (angle) => ANGLES.find((a) => a.key === angle).takes.some((s) => slots.has(s));

  const toggleSet = (set) => {
    setFocusId(set.id);
    update((d) => {
      const on = d.modelSetIds.includes(set.id);
      return {
        ...d,
        modelSetIds: on ? d.modelSetIds.filter((x) => x !== set.id) : [...d.modelSetIds, set.id],
        anglesBySet: on ? d.anglesBySet : { ...d.anglesBySet, [set.id]: d.anglesBySet[set.id] ?? set.angles.filter(usable) },
      };
    });
  };
  const toggleAngle = (setId, angle) =>
    update((d) => {
      const list = d.anglesBySet[setId] ?? [];
      return { ...d, anglesBySet: { ...d.anglesBySet, [setId]: list.includes(angle) ? list.filter((a) => a !== angle) : [...list, angle] } };
    });

  const panel = (
    <div className="space-y-5">
      <AuroraButton className="w-full" onClick={() => setShoot(true)}>
        <Plus className="h-4 w-4" /> New model set
      </AuroraButton>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[var(--text-3)] focus:outline-none" />
      </label>
      <div>
        <Label>Model</Label>
        <Segmented options={[["All", "All"], ["Men", "Men"], ["Women", "Women"]]} value={gender} onChange={setGender} />
      </div>
      <div>
        <Label>Source</Label>
        <Segmented options={[["All", "All"], ["Generated", "AI"], ["Uploaded", "Photos"]]} value={source} onChange={setSource} />
      </div>
      <GhostButton className="w-full">
        <Upload className="h-4 w-4" /> Upload photos as a set
      </GhostButton>
      <p className="text-xs text-[var(--text-3)]">{draft.modelSetIds.length} selected · {modelSets.length} in library</p>
    </div>
  );

  const stage = (
    <>
      <StageHeader step={step} index={index} />
      {shown.length === 0 ? (
        <div className="glass grid h-64 place-items-center rounded-3xl text-center">
          <div>
            <p className="font-display text-xl text-white">No model sets match</p>
            <p className="mt-1 text-sm text-[var(--text-2)]">Change the filters, or create one.</p>
          </div>
        </div>
      ) : (
        <Stagger className="grid grid-cols-2 gap-5 md:grid-cols-3 2xl:grid-cols-4">
          {shown.map((set) => {
            const n = draft.modelSetIds.indexOf(set.id);
            return (
              <StaggerItem key={set.id}>
                <TiltCard selected={n >= 0} onClick={() => toggleSet(set)} aria-pressed={n >= 0}>
                  <ModelCover set={set} />
                  {n >= 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-aurora text-xs font-bold text-white shadow-lg">
                      {n + 1}
                    </motion.span>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-white">{set.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip>{set.gender}</Chip>
                      <Chip tone={set.source === "Generated" ? "accent" : "default"}>{set.source === "Generated" ? "AI" : "Photos"}</Chip>
                      <Chip>{set.angles.length} angles</Chip>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
      {portal && createPortal(
        <AnimatePresence>{shoot && <Photoshoot onClose={() => setShoot(false)} onSave={(set) => (setModelSets((all) => [set, ...all]), setShoot(false), toggleSet(set))} />}</AnimatePresence>,
        portal,
      )}
    </>
  );

  const inspector = focus ? (
    <div className="space-y-4">
      <div>
        <p className="font-display text-lg font-semibold text-white">{focus.name}</p>
        <p className="text-xs text-[var(--text-3)]">
          {focus.gender} · {focus.source === "Generated" ? "AI generated" : "Photoshoot"}
        </p>
      </div>
      {!draft.modelSetIds.includes(focus.id) && <p className="rounded-xl bg-white/[0.04] p-3 text-xs text-[var(--text-2)]">Select this set to choose its angles.</p>}
      <Label>Angles for this product</Label>
      <ul className="space-y-2">
        {focus.angles.map((angle) => {
          const ok = usable(angle);
          const on = (draft.anglesBySet[focus.id] ?? []).includes(angle);
          const reason = angle === "side" ? "Side shows the fit, no print" : `No ${ANGLES.find((a) => a.key === angle).takes.join(" / ")} file`;
          return (
            <li key={angle}>
              <button
                type="button"
                disabled={!draft.modelSetIds.includes(focus.id)}
                onClick={() => toggleAngle(focus.id, angle)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left disabled:cursor-not-allowed ${on ? "border-[#7c5cff]/40 bg-[#7c5cff]/10" : "border-white/[0.06] hover:border-white/15"} ${ok ? "" : "opacity-50"}`}
              >
                <ModelFigure angle={angle} tee={GREEN} skin={focus.skin} hair={focus.hair} className="h-14 w-11 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-white">{angleLabel(angle)}</span>
                  <span className="block truncate text-[11px] text-[var(--text-3)]">{ok ? (focus.boxes.includes(angle) ? "Box saved" : "Needs a box") : reason}</span>
                </span>
                <span className={`grid h-5 w-5 place-items-center rounded ${on ? "bg-aurora" : "border border-white/20"}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ) : (
    <p className="text-sm text-[var(--text-3)]">Select a model set to choose its angles.</p>
  );

  return <Workspace panel={panel} panelTitle="Library" stage={stage} inspector={inspector} inspectorTitle="Angles" />;
};

export default ModelsStep;
