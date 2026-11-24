// Step 2: pick model sets from the library and the angles this product uses.
// An angle can be used only if it takes one of the design's slots (FR/LP on
// front angles, BK on back angles). Done when at least one chosen angle can
// show a print (steps.js). Spec: docs/STUDIO_PLAN.md §5.4.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CircleDot, Plus, RotateCw, Search, Trash2, Upload } from "lucide-react";
import { ANGLES, angleLabel } from "../data/sample";
import { useStudio } from "../context";
import ModelFigure from "../ui/ModelFigure";
import Segmented from "../ui/Segmented";
import { Button } from "../ui/Shell";
import { Photoshoot, UploadSet } from "./ModelSetCreator";
import { errorText } from "../../dashboard/api";

const ease = [0.22, 1, 0.36, 1];
const GREEN = "#00b140";
const takesOf = (angle) => ANGLES.find((a) => a.key === angle)?.takes ?? [];

/** One angle of a set: its photo if uploaded, else the illustration. */
const AngleImage = ({ set, angle, className = "" }) =>
  set.photos?.[angle] ? (
    <img src={set.photos[angle]} alt="" className={`object-cover ${className}`} />
  ) : (
    <ModelFigure angle={angle} tee={GREEN} skin={set.skin} hair={set.hair} className={className} />
  );

/** Cover that steps through the set's angles while hovered or focused. */
const Cover = ({ set, active }) => {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || reduce) {
      setI(0);
      return undefined;
    }
    const t = setInterval(() => setI((n) => (n + 1) % set.angles.length), 700);
    return () => clearInterval(t);
  }, [active, reduce, set.angles.length]);
  const angle = set.angles[i] ?? "front";
  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div key={angle} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <AngleImage set={set} angle={angle} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <span className="label absolute bottom-2 left-2 bg-[var(--ink)] px-2 py-1 !text-[10px] text-[var(--text)]">{angleLabel(angle)}</span>
    </div>
  );
};

const ModelCard = ({ set, order, focused, onToggle, onFocus }) => {
  const [hover, setHover] = useState(false);
  const selected = order >= 0;
  return (
    <div
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={`relative border transition-colors ${selected ? "border-[var(--accent)]" : focused ? "border-[var(--text-3)]" : "border-[var(--line)] hover:border-[var(--line-2)]"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        onFocus={() => (setHover(true), onFocus())}
        onBlur={() => setHover(false)}
        aria-pressed={selected}
        aria-label={`${selected ? "Remove" : "Use"} ${set.name}`}
        className="block w-full text-left"
      >
        <Cover set={set} active={hover} />
        <div className="border-t border-[var(--line)] p-3">
          <p className="truncate font-medium">{set.name}</p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-[var(--text-3)]">
            <span>{set.gender}</span>·<span>{set.source === "Generated" ? "AI" : "Photos"}</span>·<span>{set.angles.length} angles</span>
            {set.builtin && (
              <>
                ·<span className="text-[var(--text-2)]">Built-in</span>
              </>
            )}
          </p>
        </div>
      </button>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.25, ease }}
            className="pointer-events-none absolute right-2 top-2 grid h-7 w-7 place-items-center bg-[var(--accent)] font-mono text-xs font-semibold text-[var(--accent-ink)]"
          >
            {order + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModelsStep = ({ draft, update, step, index }) => {
  const { modelSets, libraryStatus, libraryError, reloadLibrary, addModelSet, removeModelSet } = useStudio();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [gender, setGender] = useState("All");
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState(draft.modelSetIds[0] ?? null);
  const [creating, setCreating] = useState(null); // "generate" | "upload"
  const slots = useMemo(() => new Set(draft.design.files.map((f) => f.slot)), [draft.design.files]);
  const usable = (angle) => takesOf(angle).some((s) => slots.has(s));

  const shown = modelSets.filter(
    (m) => (gender === "All" || m.gender === gender) && (source === "All" || m.source === source) && m.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const focus = modelSets.find((m) => m.id === focusId) ?? null;

  // once the library has loaded, forget sets this draft picked that no longer exist
  useEffect(() => {
    if (libraryStatus !== "ready") return;
    const known = new Set(modelSets.map((m) => m.id));
    const stale = draft.modelSetIds.filter((id) => !known.has(id));
    if (!stale.length) return;
    update((d) => {
      const anglesBySet = { ...d.anglesBySet };
      stale.forEach((id) => delete anglesBySet[id]);
      return { ...d, modelSetIds: d.modelSetIds.filter((id) => known.has(id)), anglesBySet };
    });
  }, [libraryStatus, modelSets, draft.modelSetIds, update]);
  useEffect(() => {
    setConfirmDelete(false);
    setDeleteError("");
  }, [focusId]);
  const chosenAngles = draft.modelSetIds.reduce((n, id) => n + (draft.anglesBySet[id] ?? []).filter(usable).length, 0);

  const toggleSet = (set) => {
    setFocusId(set.id);
    update((d) => {
      const on = d.modelSetIds.includes(set.id);
      return {
        ...d,
        modelSetIds: on ? d.modelSetIds.filter((x) => x !== set.id) : [...d.modelSetIds, set.id],
        // a newly picked set starts with every angle that can show a print
        anglesBySet: on ? d.anglesBySet : { ...d.anglesBySet, [set.id]: d.anglesBySet[set.id] ?? set.angles.filter(usable) },
      };
    });
  };
  const setAngles = (setId, list) =>
    update((d) => ({ ...d, anglesBySet: { ...d.anglesBySet, [setId]: ANGLES.map((a) => a.key).filter((k) => list.includes(k)) } }));
  const toggleAngle = (setId, angle) => {
    const list = draft.anglesBySet[setId] ?? [];
    setAngles(setId, list.includes(angle) ? list.filter((a) => a !== angle) : [...list, angle]);
  };
  const saveNew = (set) => {
    addModelSet(set);
    setCreating(null);
    toggleSet(set);
  };
  const remove = async (set) => {
    setDeleteError("");
    try {
      await removeModelSet(set.id);
      // drop it from this draft too
      update((d) => {
        const anglesBySet = { ...d.anglesBySet };
        delete anglesBySet[set.id];
        return { ...d, modelSetIds: d.modelSetIds.filter((x) => x !== set.id), anglesBySet };
      });
      setFocusId(null);
    } catch (err) {
      setDeleteError(errorText(err));
    } finally {
      setConfirmDelete(false);
    }
  };

  // ---- left: library controls
  const panel = (
    <div className="space-y-8 p-6">
      <p className="label text-[var(--text-3)]">Library</p>
      <div className="space-y-2">
        <Button variant="solid" className="w-full" onClick={() => setCreating("generate")}>
          <Plus className="h-4 w-4" /> New model set
        </Button>
        <Button className="w-full" onClick={() => setCreating("upload")}>
          <Upload className="h-4 w-4" /> Upload photos
        </Button>
      </div>
      <label className="relative block">
        <span className="label mb-2 block text-[var(--text-3)]">Search</span>
        <Search className="pointer-events-none absolute bottom-2.5 left-0 h-4 w-4 text-[var(--text-3)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Model name"
          className="inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent pb-2 pl-6 pr-0 text-base text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)]"
        />
      </label>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Model</p>
        <Segmented label="Model" options={[["All", "All"], ["Men", "Men"], ["Women", "Women"]]} value={gender} onChange={setGender} />
      </div>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Source</p>
        <Segmented label="Source" options={[["All", "All"], ["Generated", "AI"], ["Uploaded", "Photos"]]} value={source} onChange={setSource} />
      </div>
      <dl className="grid grid-cols-2 border-t border-[var(--line)] pt-4">
        <div>
          <dt className="label text-[var(--text-3)]">Selected</dt>
          <dd className="mt-1 font-mono text-2xl">{String(draft.modelSetIds.length).padStart(2, "0")}</dd>
        </div>
        <div>
          <dt className="label text-[var(--text-3)]">Angles</dt>
          <dd className="mt-1 font-mono text-2xl">{String(chosenAngles).padStart(2, "0")}</dd>
        </div>
      </dl>
    </div>
  );

  // ---- centre: the card wall
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {String(index + 1).padStart(2, "0")} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
        <p className="mt-3 max-w-xl text-[var(--text-2)]">
          Pick one or more model sets, then choose their angles. Angles that can&apos;t show this design are greyed out.
        </p>
      </div>

      {libraryStatus === "error" && (
        <div className="mb-6 flex flex-wrap items-center gap-3 border border-[var(--error)] px-4 py-3 text-sm" role="alert">
          <span className="flex-1 text-[var(--text)]">Couldn&apos;t load saved model sets: {libraryError}</span>
          <button type="button" onClick={reloadLibrary} className="label flex items-center gap-1.5 hover:text-[var(--accent)]">
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}
      {libraryStatus === "loading" && (
        <p className="label mb-6 flex items-center gap-2 text-[var(--text-3)]" aria-live="polite">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" /> Loading saved model sets…
        </p>
      )}
      {modelSets.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center border border-dashed border-[var(--line-2)] text-center">
          <p className="text-2xl font-semibold tracking-[-0.02em]">No model sets yet</p>
          <p className="mt-2 text-sm text-[var(--text-2)]">Generate one with AI, or upload your own photoshoot.</p>
          <Button variant="solid" className="mt-6" onClick={() => setCreating("generate")}>
            <Plus className="h-4 w-4" /> New model set
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center border border-dashed border-[var(--line-2)] text-center">
          <p className="text-lg font-medium">No model sets match</p>
          <button type="button" onClick={() => (setGender("All"), setSource("All"), setQuery(""))} className="label mt-3 text-[var(--accent)] hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
          {shown.map((set, i) => (
            <motion.li key={set.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease, delay: Math.min(i, 8) * 0.03 }}>
              <ModelCard set={set} order={draft.modelSetIds.indexOf(set.id)} focused={focusId === set.id} onToggle={() => toggleSet(set)} onFocus={() => setFocusId(set.id)} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );

  // ---- right: angles for the focused set
  const picked = Boolean(focus) && draft.modelSetIds.includes(focus.id);
  const list = focus ? (draft.anglesBySet[focus.id] ?? []) : [];
  const inspector = !focus ? (
    <div className="flex h-full flex-col justify-center p-6 text-center">
      <CircleDot className="mx-auto mb-3 h-5 w-5 text-[var(--text-3)]" />
      <p className="text-sm text-[var(--text-2)]">Pick a model set to choose its angles.</p>
    </div>
  ) : (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-2xl font-medium tracking-[-0.02em]">{focus.name}</p>
        <p className="mt-1 text-xs text-[var(--text-3)]">
          {focus.gender} · {focus.source === "Generated" ? "AI generated" : "Photoshoot"} · {focus.angles.length} angles
        </p>
      </div>
      {!picked ? (
        <Button variant="solid" className="w-full" onClick={() => toggleSet(focus)}>
          <Plus className="h-4 w-4" /> Use this model set
        </Button>
      ) : (
        <div className="flex items-center justify-between">
          <p className="label text-[var(--text-3)]">Angles for this product</p>
          <span className="flex gap-3">
            <button type="button" onClick={() => setAngles(focus.id, focus.angles.filter(usable))} className="label text-[var(--text-2)] hover:text-[var(--text)]">
              All
            </button>
            <button type="button" onClick={() => setAngles(focus.id, [])} className="label text-[var(--text-2)] hover:text-[var(--text)]">
              None
            </button>
          </span>
        </div>
      )}
      <ul className="border-t border-[var(--line)]">
        {focus.angles.map((angle) => {
          const ok = usable(angle);
          const on = list.includes(angle);
          const why = angle === "side" ? "Shows the fit; no print" : `Needs a ${takesOf(angle).join(" or ")} file`;
          return (
            <li key={angle} className="border-b border-[var(--line)]">
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={!picked || !ok}
                onClick={() => toggleAngle(focus.id, angle)}
                className={`flex w-full items-center gap-3 py-2 text-left transition-colors enabled:hover:bg-[var(--panel)] disabled:cursor-not-allowed ${ok ? "" : "opacity-50"}`}
              >
                <AngleImage set={focus} angle={angle} className="h-14 w-11 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{angleLabel(angle)}</span>
                  <span className="block truncate text-[11px] text-[var(--text-3)]">
                    {ok ? (focus.boxes?.includes(angle) ? "Print box saved" : "Needs a print box (step 4)") : why}
                  </span>
                </span>
                <span
                  className={`mr-1 grid h-4 w-4 shrink-0 place-items-center border ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]" : "border-[var(--line-2)]"}`}
                  aria-hidden="true"
                >
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {picked && (
        <button type="button" onClick={() => toggleSet(focus)} className="label block text-[var(--text-3)] hover:text-[var(--text)]">
          Don&apos;t use for this product
        </button>
      )}
      {!focus.builtin && (
        <div className="border-t border-[var(--line)] pt-4">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex-1 text-[var(--text-2)]">Delete from the library for everyone?</span>
              <button type="button" onClick={() => remove(focus)} className="label h-8 rounded-md bg-[var(--error)] px-3 text-[var(--accent-ink)]">
                Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="label h-8 px-2 text-[var(--text-2)] hover:text-[var(--text)]">
                Keep
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="label flex items-center gap-2 text-[var(--text-3)] hover:text-[var(--error)]">
              <Trash2 className="h-3.5 w-3.5" /> Delete from library
            </button>
          )}
          {deleteError && <p className="mt-2 text-xs text-[var(--error)]">{deleteError}</p>}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="scroll-y h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
        <aside className="border-b border-[var(--line)] lg:overflow-y-auto lg:border-b-0 lg:border-r">{panel}</aside>
        <div className="lg:overflow-y-auto">
          {stage}
          <div className="border-t border-[var(--line)] xl:hidden">{inspector}</div>
        </div>
        <aside className="hidden border-l border-[var(--line)] xl:block xl:overflow-y-auto">{inspector}</aside>
      </div>
      {creating === "generate" && <Photoshoot onClose={() => setCreating(null)} />}
      {creating === "upload" && <UploadSet onClose={() => setCreating(null)} onSave={saveNew} />}
    </>
  );
};

export default ModelsStep;
