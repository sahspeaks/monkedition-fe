// Step 4: one print box per model set × angle × slot, saved in the backend and
// shared by every product that uses the set. The canvas shows the real
// preview (photo recoloured, design printed); a strip shows the same box on
// every chosen colour. Spec: docs/STUDIO_PLAN.md §5.6.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Minus, Plus, RotateCcw, RotateCw, Save, Undo2 } from "lucide-react";
import PlacementCanvas from "../../dashboard/mockups/PlacementCanvas";
import * as G from "../../dashboard/mockups/geometry";
import { errorText } from "../../dashboard/api";
import { useStudio } from "../context";
import { angleLabel } from "../data/sample";
import { colourOf, isDarkFabric } from "../palette";
import { DEFAULT_PARAMS, fetchPlacements, placementKey, renderPreview, savePlacement } from "../placementStore";
import { mockupsApi } from "../../dashboard/mockups/api";
import { boxesToSet } from "../steps";
import Segmented from "../ui/Segmented";
import { Button } from "../ui/Shell";

const W = 1200; // model photos are 1200 × 1500 (4:5); the canvas works in these pixels
const H = 1500;
const ACCENT = "#ff4f1a";
const SLOT_NAMES = { FR: "Front print", BK: "Back print", LP: "Pocket print" };
const SLIDERS = [
  ["fold", "Fold strength", 0, 2, 0.05],
  ["shadow", "Shadow", 0, 2, 0.05],
  ["opacity", "Opacity", 0.3, 1, 0.02],
  ["mask", "Mask tightness", 0, 1, 0.05],
];

const toPx = (q) => q.map(([x, y]) => [x * W, y * H]);
const toFr = (q) => q.map(([x, y]) => [+(x / W).toFixed(5), +(y / H).toFixed(5)]);
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't show the preview"));
    img.src = src;
  });

const PlacementStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const files = draft.design.files;
  const hasDark = files.some((f) => f.variant === "dark");

  // every box this product needs
  const items = useMemo(
    () =>
      boxesToSet(draft)
        .map((key) => {
          const [setId, angle, slot] = key.split(":");
          const set = modelSets.find((m) => m.id === setId);
          return set?.photos?.[angle] ? { key, setId, angle, slot, set, src: set.photos[angle] } : null;
        })
        .filter(Boolean),
    [draft, modelSets],
  );
  const [currentKey, setCurrentKey] = useState(() => items.find((i) => !draft.placements[i.key])?.key ?? items[0]?.key ?? null);
  const item = items.find((i) => i.key === currentKey) ?? items[0] ?? null;

  const [edits, setEdits] = useState({}); // key -> unsaved box
  const [suggested, setSuggested] = useState({}); // key -> quad (fractions)
  const [loadState, setLoadState] = useState({ loading: true, error: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [justSaved, setJustSaved] = useState(null);
  const [freeMode, setFreeMode] = useState(false);
  const [previewCode, setPreviewCode] = useState(draft.colours[0] ?? null);

  // boxes already saved for these sets (by anyone, for any product) become this draft's boxes
  useEffect(() => {
    let live = true;
    fetchPlacements(draft.modelSetIds)
      .then((list) => {
        if (!live) return;
        const found = Object.fromEntries(list.map((p) => [placementKey(p.setId, p.angle, p.slot), p]));
        update((d) => ({ ...d, placements: { ...d.placements, ...found } }));
        setLoadState({ loading: false, error: "" });
      })
      .catch((err) => live && setLoadState({ loading: false, error: errorText(err) }));
    return () => {
      live = false;
    };
    // load once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a starting box from where the garment is, for boxes not saved yet
  useEffect(() => {
    if (!item || draft.placements[item.key] || suggested[item.key]) return;
    mockupsApi
      .suggestBox(item.src, item.slot)
      .then(({ quad }) => setSuggested((s) => ({ ...s, [item.key]: quad })))
      .catch(() => setSuggested((s) => ({ ...s, [item.key]: [[0.32, 0.3], [0.68, 0.3], [0.68, 0.62], [0.32, 0.62]] })));
  }, [item, draft.placements, suggested]);

  const boxFor = useCallback(
    (it) => {
      if (!it) return null;
      if (edits[it.key]) return edits[it.key];
      const saved = draft.placements[it.key];
      if (saved) return { quad: saved.quad, fit: saved.fit, anchor: saved.anchor, params: { ...DEFAULT_PARAMS, ...saved.params } };
      const quad = suggested[it.key];
      return quad ? { quad, fit: "contain", anchor: it.slot === "LP" ? "center" : "top", params: { ...DEFAULT_PARAMS } } : null;
    },
    [edits, draft.placements, suggested],
  );
  const box = boxFor(item);
  const statusOf = (it) => (edits[it.key] ? "unsaved" : draft.placements[it.key] ? "saved" : "needed");
  const remaining = items.filter((it) => statusOf(it) !== "saved");

  const setBox = (patch) => item && box && setEdits((e) => ({ ...e, [item.key]: { ...box, ...patch } }));
  const setQuadPx = (q) => setBox({ quad: toFr(q) });

  // the design file and colour shown in the preview
  const colours = draft.colours.map(colourOf).filter(Boolean);
  const previewColour = colourOf(previewCode) ?? colours[0] ?? null;
  const fileFor = (slot, colour) => {
    const dark = colour && (draft.variantByColour[colour.code] ?? (isDarkFabric(colour.fabric) && hasDark ? "dark" : "main")) === "dark";
    return files.find((f) => f.slot === slot && f.variant === (dark ? "dark" : "normal")) ?? files.find((f) => f.slot === slot && f.variant === "normal") ?? files.find((f) => f.slot === slot);
  };

  // ---- live preview: drafts while dragging, a sharp render when still ----
  const [image, setImage] = useState(null);
  const [renderState, setRenderState] = useState({ busy: false, error: "" });
  const seq = useRef(0);
  const queue = useRef({ busy: false, next: null });
  const requestFor = useCallback(
    (quad, w) =>
      item && box && previewColour
        ? { file: fileFor(item.slot, previewColour), src: item.src, hex: previewColour.fabric, quad, fit: box.fit, anchor: box.anchor === "center" ? "center" : "top", params: box.params, w }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item, box, previewColour, files, draft.variantByColour],
  );
  const show = async (blob, mine) => {
    const img = await loadImage(URL.createObjectURL(blob));
    if (mine === seq.current) setImage(img);
  };
  const draftRender = useCallback(async (body) => {
    const q = queue.current;
    q.next = body;
    if (q.busy) return;
    q.busy = true;
    while (q.next) {
      const next = q.next;
      q.next = null;
      const mine = ++seq.current;
      try {
        await show(await renderPreview(next), mine);
      } catch {
        /* a draft failing is fine; the sharp render reports errors */
      }
    }
    q.busy = false;
  }, []);

  // the bare photo first, so the canvas has something while the first render runs
  useEffect(() => {
    if (!item) return;
    let live = true;
    loadImage(item.src)
      .then((img) => live && setImage((cur) => cur ?? img))
      .catch(() => {});
    setImage(null);
    return () => {
      live = false;
    };
  }, [item]);

  const renderKey = JSON.stringify([item?.key, box, previewColour?.code]);
  useEffect(() => {
    const body = box && requestFor(box.quad, 600);
    if (!body?.file) return undefined;
    draftRender(body);
    const t = setTimeout(async () => {
      const mine = ++seq.current;
      setRenderState({ busy: true, error: "" });
      try {
        await show(await renderPreview({ ...body, w: 1000 }), mine);
        if (mine === seq.current) setRenderState({ busy: false, error: "" });
      } catch (err) {
        if (mine === seq.current) setRenderState({ busy: false, error: errorText(err) });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  // ---- the same box on every chosen colour ----
  const [strip, setStrip] = useState({});
  const stripKey = JSON.stringify([item?.key, box, draft.colours]);
  useEffect(() => {
    if (!item || !box) return undefined;
    let live = true;
    const t = setTimeout(() => {
      colours.forEach((c) => {
        const file = fileFor(item.slot, c);
        if (!file) return;
        renderPreview({ file, src: item.src, hex: c.fabric, quad: box.quad, fit: box.fit, anchor: box.anchor === "center" ? "center" : "top", params: box.params, w: 300 })
          .then((blob) => live && setStrip((s) => ({ ...s, [`${item.key}:${c.code}`]: URL.createObjectURL(blob) })))
          .catch(() => {});
      });
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripKey]);

  // ---- save ----
  const save = useCallback(async () => {
    if (!item || !box || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const saved = await savePlacement({ setId: item.setId, angle: item.angle, slot: item.slot, quad: box.quad, fit: box.fit, anchor: box.anchor === "center" ? "center" : "top", params: box.params });
      update((d) => ({ ...d, placements: { ...d.placements, [item.key]: saved } }));
      setEdits((e) => {
        const next = { ...e };
        delete next[item.key];
        return next;
      });
      setJustSaved(item.key);
      setTimeout(() => setJustSaved(null), 1400);
      const next = items.find((it) => it.key !== item.key && !draft.placements[it.key] && !edits[it.key]);
      if (next) setTimeout(() => setCurrentKey(next.key), 600);
    } catch (err) {
      setSaveError(errorText(err));
    } finally {
      setSaving(false);
    }
  }, [item, box, saving, update, items, draft.placements, edits]);

  const resetToSuggested = async () => {
    if (!item) return;
    if (edits[item.key]) {
      // unsaved changes: drop them and go back to the saved (or suggested) box
      setEdits((e) => {
        const next = { ...e };
        delete next[item.key];
        return next;
      });
      return;
    }
    // a saved box: start again from the suggestion (saved only when Save is pressed)
    try {
      const quad = suggested[item.key] ?? (await mockupsApi.suggestBox(item.src, item.slot)).quad;
      setSuggested((s) => ({ ...s, [item.key]: quad }));
      setBox({ quad });
    } catch (err) {
      setSaveError(errorText(err));
    }
  };

  // keys: arrows move (Shift ×5), [ ] rotate, ⌘S / Ctrl+S save
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || !box) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      const step = e.shiftKey ? 30 : 6;
      if (arrows) {
        e.preventDefault();
        setQuadPx(G.move(toPx(box.quad), arrows[0] * step, arrows[1] * step));
      } else if (e.code === "BracketLeft" || e.code === "BracketRight") {
        e.preventDefault();
        setQuadPx(G.rotate(toPx(box.quad), (e.code === "BracketLeft" ? -1 : 1) * (e.shiftKey ? 5 : 1)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, save]);

  // ---------- left: the checklist ----------
  const groups = draft.modelSetIds.map((id) => ({ set: modelSets.find((m) => m.id === id), list: items.filter((it) => it.setId === id) })).filter((g) => g.set && g.list.length);
  const panel = (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <p className="label text-[var(--text-3)]">Print boxes</p>
        <span className="font-mono text-xs text-[var(--text-2)]">
          <span className="text-[var(--text)]">{String(items.length - remaining.length).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")}
        </span>
      </div>
      <Button className="w-full" disabled={!remaining.filter((it) => it.key !== item?.key).length} onClick={() => setCurrentKey(remaining.find((it) => it.key !== item?.key).key)}>
        Next needing a box <ArrowRight className="h-4 w-4" />
      </Button>
      {loadState.error && <p className="text-xs text-[var(--error)]">Couldn&apos;t load saved boxes: {loadState.error}</p>}
      {groups.map(({ set, list }) => (
        <div key={set.id}>
          <p className="label mb-2 text-[var(--text-3)]">{set.name}</p>
          <ul className="border-t border-[var(--line)]">
            {list.map((it) => {
              const status = statusOf(it);
              return (
                <li key={it.key} className="border-b border-[var(--line)]">
                  <button type="button" onClick={() => setCurrentKey(it.key)} aria-current={it.key === item?.key ? "true" : undefined} className={`flex w-full items-center gap-3 py-2 pr-1 text-left transition-colors hover:bg-[var(--panel)] ${it.key === item?.key ? "bg-[var(--panel)]" : ""}`}>
                    <img src={it.src} alt="" className="h-14 w-11 shrink-0 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{angleLabel(it.angle)}</span>
                      <span className="block text-[11px] text-[var(--text-3)]">
                        <span className={`font-mono ${it.key === item?.key ? "text-[var(--accent)]" : ""}`}>{it.slot}</span> · {SLOT_NAMES[it.slot]}
                      </span>
                    </span>
                    {status === "saved" ? (
                      <span className="label flex items-center gap-1 !text-[10px] text-[var(--success)]">
                        <Check className="h-3 w-3" /> Saved
                      </span>
                    ) : status === "unsaved" ? (
                      <span className="label !text-[10px] text-[var(--accent)]">Unsaved</span>
                    ) : (
                      <span className="label !text-[10px] text-[var(--text-3)]">Needs box</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  // ---------- centre: canvas + colour strip ----------
  const quadPx = box ? toPx(box.quad) : null;
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
            <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
            Step {String(index + 1).padStart(2, "0")} — {step.label}
          </p>
          <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
          <p className="mt-3 max-w-xl text-[var(--text-2)]">Each box is saved with the model set, so every future product on it starts here.</p>
        </div>
        {box && (
          <div className="flex flex-wrap items-center gap-1">
            {[
              [Minus, "Smaller", () => setQuadPx(G.scale(quadPx, 0.95))],
              [Plus, "Bigger", () => setQuadPx(G.scale(quadPx, 1.05))],
              [RotateCcw, "Rotate left", () => setQuadPx(G.rotate(quadPx, -1))],
              [RotateCw, "Rotate right", () => setQuadPx(G.rotate(quadPx, 1))],
            ].map(([Icon, label, fn]) => (
              <button key={label} type="button" onClick={fn} aria-label={label} title={label} className="grid h-9 w-9 place-items-center border border-[var(--line-2)] text-[var(--text-2)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]">
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <button type="button" onClick={() => setQuadPx(G.rotate(quadPx, -G.angle(quadPx)))} className="label h-9 border border-[var(--line-2)] px-3 text-[var(--text-2)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]">
              {G.angle(quadPx).toFixed(1)}° · Straighten
            </button>
            <button type="button" onClick={() => setFreeMode((v) => !v)} aria-pressed={freeMode} className={`label h-9 border px-3 ${freeMode ? "border-[var(--text)] bg-[var(--text)] text-[var(--ink)]" : "border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--text)]"}`}>
              {freeMode ? "Free reshape" : "Keep proportions"}
            </button>
          </div>
        )}
      </div>

      {!item ? (
        <div className="flex h-72 flex-col items-center justify-center border border-dashed border-[var(--line-2)] text-center text-sm text-[var(--text-2)]">
          No angle in this product takes one of the design&apos;s prints. Go back to Models and choose angles.
        </div>
      ) : (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium">{item.set.name}</span>
              <span className="text-[var(--text-3)]">{angleLabel(item.angle)}</span>
              <span className="font-mono text-[var(--accent)]">{item.slot}</span>
              <span className="text-[var(--text-3)]">{SLOT_NAMES[item.slot]}</span>
              {renderState.busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-3)]" aria-label="Rendering" />}
            </p>
            {image && quadPx ? (
              <PlacementCanvas image={image} width={W} height={H} quad={quadPx} colour={ACCENT} freeMode={freeMode} maxHeight={0.68} onDrag={(q) => draftRender(requestFor(toFr(q), 600))} onCommit={setQuadPx} />
            ) : (
              <div className="mx-auto aspect-[4/5] max-h-[68vh] animate-pulse bg-[var(--panel-2)]" />
            )}
            {renderState.error && (
              <p className="mt-3 border border-[var(--error)] px-3 py-2 text-xs text-[var(--error)]" role="alert">
                Preview failed: {renderState.error}. Is the mockups service running?
              </p>
            )}
            <AnimatePresence>
              {justSaved === item.key && (
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="label absolute left-1/2 top-1/2 flex -translate-x-1/2 items-center gap-2 bg-[var(--accent)] px-4 py-2.5 text-[var(--accent-ink)]">
                  <Check className="h-4 w-4" /> Box saved
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div>
            <p className="label mb-2 text-[var(--text-3)]">Every colour</p>
            <div className="flex gap-2 overflow-x-auto pb-1 2xl:grid 2xl:grid-cols-2 2xl:overflow-visible">
              {colours.map((c) => {
                const url = strip[`${item.key}:${c.code}`];
                return (
                  <button key={c.code} type="button" onClick={() => setPreviewCode(c.code)} aria-pressed={previewColour?.code === c.code} title={c.name} className={`shrink-0 border-2 ${previewColour?.code === c.code ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--line-2)]"}`}>
                    {url ? <img src={url} alt={c.name} className="aspect-[4/5] w-24 object-cover 2xl:w-full" /> : <span className="block aspect-[4/5] w-24 animate-pulse bg-[var(--panel-2)] 2xl:w-full" />}
                    <span className="block truncate bg-[var(--panel)] px-1.5 py-1 text-left text-[10px] text-[var(--text-2)]">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---------- right: settings + save ----------
  const inspector = !item || !box ? (
    <div className="p-6 text-sm text-[var(--text-2)]">{item ? "Finding the garment…" : "Nothing to place."}</div>
  ) : (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-2xl font-medium tracking-[-0.02em]">{SLOT_NAMES[item.slot]}</p>
        <p className="mt-1 text-xs text-[var(--text-3)]">
          {item.set.name} · {angleLabel(item.angle)}
        </p>
      </div>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Fit</p>
        <Segmented label="Fit" options={[["contain", "Keep aspect"], ["stretch", "Stretch"]]} value={box.fit} onChange={(fit) => setBox({ fit })} />
      </div>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Align in the box</p>
        <Segmented label="Align" options={[["top", "Top"], ["center", "Centre"]]} value={box.anchor === "center" ? "center" : "top"} onChange={(anchor) => setBox({ anchor })} />
      </div>
      <div className="space-y-4">
        {SLIDERS.map(([k, label, min, max, stepSize]) => (
          <label key={k} className="block">
            <span className="mb-1 flex justify-between text-xs text-[var(--text-2)]">
              {label} <b className="font-mono font-normal text-[var(--text)]">{Number(box.params[k]).toFixed(2)}</b>
            </span>
            <input type="range" min={min} max={max} step={stepSize} value={box.params[k]} onChange={(e) => setBox({ params: { ...box.params, [k]: Number(e.target.value) } })} className="w-full accent-[#ff4f1a]" />
          </label>
        ))}
      </div>
      <div className="space-y-2 border-t border-[var(--line)] pt-5">
        <Button variant="solid" className="w-full" onClick={save} disabled={saving || statusOf(item) === "saved"}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {statusOf(item) === "saved" ? "Saved" : "Save box"}
        </Button>
        <Button className="w-full" onClick={resetToSuggested} disabled={!edits[item.key] && !draft.placements[item.key]}>
          <Undo2 className="h-4 w-4" /> {edits[item.key] ? "Discard changes" : "Back to suggested"}
        </Button>
        {saveError && <p className="text-xs text-[var(--error)]" role="alert">{saveError}</p>}
        <p className="pt-2 text-[11px] text-[var(--text-3)]">Arrows move (Shift ×5) · [ ] rotate · ⌘S save. Saved boxes apply to every product on this model set.</p>
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

export default PlacementStep;
