// Step 3: choose the colourways. Previews are real: each chosen model photo is
// recoloured by the mockups service (studio/recolor.py) from its green tee.
// The order of the palette tray is the colour order in the shop.
// Spec: docs/STUDIO_PLAN.md §5.5.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Check, CircleDot, GripVertical, Loader2, Search, X } from "lucide-react";
import { useStudio } from "../context";
import { angleLabel } from "../data/sample";
import { GROUPS, PALETTE, colourOf, isDarkFabric } from "../palette";
import { loadRecolor, useRecolor } from "../useRecolor";
import Segmented from "../ui/Segmented";

const ease = [0.22, 1, 0.36, 1];

const Swatch = ({ hex, size = "h-5 w-5" }) => (
  <span className={`${size} inline-block shrink-0 rounded-full`} style={{ background: hex, boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.35)" }} aria-hidden="true" />
);

/** A photo recoloured to `hex`; keeps the last image on screen while the next one loads. */
const Recoloured = ({ src, hex, width = 800, className = "", alt = "" }) => {
  const { url, loading, error } = useRecolor(src, hex, width);
  return (
    <div className={`relative overflow-hidden bg-[var(--panel)] ${className}`}>
      <AnimatePresence initial={false}>
        {url && <motion.img key={url} src={url} alt={alt} className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />}
      </AnimatePresence>
      {!url && !error && <div className="absolute inset-0 animate-pulse bg-[var(--panel-2)]" />}
      {loading && url && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-[var(--text)]" aria-label="Recolouring" />}
      {error && (
        <p className="absolute inset-x-3 bottom-3 bg-[var(--ink)] p-2 text-xs text-[var(--error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/** The green photo on the left, the colour on the right of the handle. */
const BeforeAfter = ({ src, hex }) => {
  const [split, setSplit] = useState(50);
  return (
    <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)]">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <Recoloured src={src} hex={hex} width={600} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--text)]" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--text)] text-[11px] text-[var(--ink)]">⇆</span>
      </div>
      <span className="label absolute left-2 top-2 bg-[var(--ink)] px-1.5 py-0.5 !text-[10px]">Base</span>
      <span className="label absolute right-2 top-2 bg-[var(--ink)] px-1.5 py-0.5 !text-[10px]">Colour</span>
      <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="Compare the base photo with the colour" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
};

const ColoursStep = ({ draft, update, step, index }) => {
  const { modelSets } = useStudio();
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(draft.colours[0] ?? null);
  const hasDarkFiles = draft.design.files.some((f) => f.variant === "dark");

  // every photo this product uses: (set, angle) pairs from step 2
  const shots = useMemo(
    () =>
      draft.modelSetIds.flatMap((id) => {
        const set = modelSets.find((m) => m.id === id);
        if (!set) return [];
        return (draft.anglesBySet[id] ?? []).filter((a) => set.photos?.[a]).map((angle) => ({ key: `${id}:${angle}`, set, angle, src: set.photos[angle] }));
      }),
    [draft.modelSetIds, draft.anglesBySet, modelSets],
  );
  const [shotKey, setShotKey] = useState(null);
  const shot = shots.find((s) => s.key === shotKey) ?? shots[0] ?? null;

  const shownCode = hover ?? selected ?? draft.colours[0] ?? null;
  const shown = shownCode ? colourOf(shownCode) : null;
  const sel = selected && draft.colours.includes(selected) ? colourOf(selected) : null;
  const filtered = PALETTE.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  // warm the cache: recolour the current photo in every chosen colour
  useEffect(() => {
    if (!shot) return;
    draft.colours.forEach((code) => {
      const c = colourOf(code);
      if (c) loadRecolor(shot.src, c.fabric, 800).catch(() => {});
    });
  }, [shot, draft.colours]);

  const toggle = (code) => {
    const on = draft.colours.includes(code);
    setSelected(on ? (selected === code ? draft.colours.find((c) => c !== code) ?? null : selected) : code);
    update((d) => ({ ...d, colours: on ? d.colours.filter((c) => c !== code) : [...d.colours, code] }));
  };
  const variantOf = (c) => draft.variantByColour[c.code] ?? (isDarkFabric(c.fabric) && hasDarkFiles ? "dark" : "main");
  const setVariant = (code, v) => update((d) => ({ ...d, variantByColour: { ...d.variantByColour, [code]: v } }));

  // ---- left: the palette
  const panel = (
    <div className="space-y-7 p-6">
      <p className="label flex justify-between text-[var(--text-3)]">
        Palette <span className="normal-case tracking-normal">{draft.colours.length} chosen</span>
      </p>
      <label className="relative block">
        <Search className="pointer-events-none absolute bottom-2.5 left-0 h-4 w-4 text-[var(--text-3)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search colours"
          aria-label="Search colours"
          className="inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent pb-2 pl-6 pr-0 text-base text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)]"
        />
      </label>
      {GROUPS.map((group) => {
        const list = filtered.filter((c) => c.group === group);
        if (!list.length) return null;
        return (
          <div key={group}>
            <p className="label mb-2 text-[var(--text-3)]">{group}</p>
            <ul className="border-t border-[var(--line)]" onPointerLeave={() => setHover(null)}>
              {list.map((c) => {
                const on = draft.colours.includes(c.code);
                return (
                  <li key={c.code} className="border-b border-[var(--line)]">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(c.code)}
                      onPointerEnter={() => setHover(c.code)}
                      onFocus={() => setHover(c.code)}
                      onBlur={() => setHover(null)}
                      className={`flex w-full items-center gap-3 px-2 py-2 text-left text-sm transition-colors hover:bg-[var(--panel)] ${selected === c.code ? "bg-[var(--panel)]" : ""}`}
                    >
                      <Swatch hex={c.fabric} />
                      <span className={`flex-1 ${on ? "text-[var(--text)]" : "text-[var(--text-2)]"}`}>{c.name}</span>
                      <span className="font-mono text-[10px] text-[var(--text-3)]">{c.code}</span>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center border ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]" : "border-[var(--line-2)]"}`} aria-hidden="true">
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
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

  // ---- centre: live preview + palette tray
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {String(index + 1).padStart(2, "0")} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
        <p className="mt-3 max-w-xl text-[var(--text-2)]">Hover a colour to try it on. Each one is made from the same photo, so the print box fits every colour.</p>
      </div>

      {!shot ? (
        <div className="flex h-72 flex-col items-center justify-center border border-dashed border-[var(--line-2)] text-center text-sm text-[var(--text-2)]">
          No model photos chosen. Go back to Models and pick a set and its angles.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            {shown ? (
              <Recoloured src={shot.src} hex={shown.fabric} className="aspect-[4/5] w-full border border-[var(--line)]" alt={`${shot.set.name}, ${angleLabel(shot.angle)}, ${shown.name}`} />
            ) : (
              <img src={shot.src} alt="" className="aspect-[4/5] w-full border border-[var(--line)] object-cover" />
            )}
            <p className="mt-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {shown && <Swatch hex={shown.fabric} />}
                <span className="font-medium">{shown ? shown.name : "Base photo"}</span>
              </span>
              <span className="text-xs text-[var(--text-3)]">
                {shot.set.name} · {angleLabel(shot.angle)}
              </span>
            </p>
          </div>

          <div className="min-w-0 space-y-8">
            <div>
              <p className="label mb-2 text-[var(--text-3)]">Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {shots.map((s) => (
                  <button key={s.key} type="button" onClick={() => setShotKey(s.key)} aria-pressed={s.key === shot.key} title={`${s.set.name} · ${angleLabel(s.angle)}`} className={`shrink-0 border-2 ${s.key === shot.key ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--line-2)]"}`}>
                    <img src={s.src} alt={`${s.set.name}, ${angleLabel(s.angle)}`} className="h-24 w-[4.8rem] object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label mb-2 flex justify-between text-[var(--text-3)]">
                Palette tray <span className="normal-case tracking-normal">drag to set the shop order</span>
              </p>
              {draft.colours.length === 0 ? (
                <p className="border border-dashed border-[var(--line-2)] p-6 text-center text-sm text-[var(--text-3)]">Choose colours from the left. They line up here.</p>
              ) : (
                <Reorder.Group axis="y" values={draft.colours} onReorder={(colours) => update((d) => ({ ...d, colours }))} className="border-t border-[var(--line)]">
                  {draft.colours.map((code, i) => {
                    const c = colourOf(code);
                    if (!c) return null;
                    return (
                      <Reorder.Item
                        key={code}
                        value={code}
                        onClick={() => setSelected(code)}
                        onPointerEnter={() => setHover(code)}
                        onPointerLeave={() => setHover(null)}
                        whileDrag={{ scale: 1.02, backgroundColor: "var(--panel-2)" }}
                        transition={{ duration: 0.2, ease }}
                        className={`flex cursor-grab items-center gap-3 border-b border-[var(--line)] bg-[var(--ink)] px-2 py-2 active:cursor-grabbing ${selected === code ? "!bg-[var(--panel)]" : ""}`}
                      >
                        <GripVertical className="h-4 w-4 text-[var(--text-3)]" aria-hidden="true" />
                        <span className="w-5 font-mono text-[11px] text-[var(--text-3)]">{String(i + 1).padStart(2, "0")}</span>
                        <Swatch hex={c.fabric} />
                        <span className="flex-1 text-sm">{c.name}</span>
                        <span className="label !text-[10px] text-[var(--text-3)]">{variantOf(c) === "dark" ? "Dark tee version" : "Main version"}</span>
                        <button type="button" onClick={(e) => (e.stopPropagation(), toggle(code))} className="grid h-7 w-7 place-items-center text-[var(--text-3)] hover:text-[var(--error)]" aria-label={`Remove ${c.name}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- right: the selected colour
  const inspector = !sel ? (
    <div className="flex h-full flex-col justify-center p-6 text-center">
      <CircleDot className="mx-auto mb-3 h-5 w-5 text-[var(--text-3)]" />
      <p className="text-sm text-[var(--text-2)]">Choose a colour to compare it with the base photo.</p>
    </div>
  ) : (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Swatch hex={sel.fabric} size="h-9 w-9" />
        <div>
          <p className="text-2xl font-medium tracking-[-0.02em]">{sel.name}</p>
          <p className="font-mono text-[11px] text-[var(--text-3)]">{sel.code}</p>
        </div>
      </div>
      {shot && <BeforeAfter src={shot.src} hex={sel.fabric} />}
      <dl className="grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 text-xs">
        <div>
          <dt className="label text-[var(--text-3)]">Shop swatch</dt>
          <dd className="mt-1 flex items-center gap-2 font-mono">
            <Swatch hex={sel.hex} size="h-4 w-4" /> {sel.hex}
          </dd>
        </div>
        <div>
          <dt className="label text-[var(--text-3)]">Fabric</dt>
          <dd className="mt-1 flex items-center gap-2 font-mono">
            <Swatch hex={sel.fabric} size="h-4 w-4" /> {sel.fabric}
          </dd>
        </div>
      </dl>
      <div>
        <p className="label mb-2 flex justify-between text-[var(--text-3)]">
          Design version <span className="normal-case tracking-normal">{isDarkFabric(sel.fabric) ? "dark tee" : "light tee"}</span>
        </p>
        <Segmented label="Design version" options={[["main", "Main"], ["dark", "Dark tee"]]} value={variantOf(sel)} onChange={(v) => setVariant(sel.code, v)} />
        {variantOf(sel) === "dark" && !hasDarkFiles && <p className="mt-2 text-xs text-[var(--accent)]">No dark tee version was uploaded in step 1; the main version will be used.</p>}
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

export default ColoursStep;
