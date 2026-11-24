// Step 1: the artwork. Three slots (FR front, BK back, LP pocket), each with an
// optional dark tee version (files named with [BK]). Every file is checked for a transparent
// background, resolution and size. Done when the design has a name and at
// least one file (steps.js). Spec: docs/STUDIO_PLAN.md §5.3.
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CircleDot, ImagePlus, Plus, RefreshCw, Trash2, Upload, X, XCircle } from "lucide-react";
import { Button } from "../ui/Shell";
import CategorySelect from "../ui/CategorySelect";

const ease = [0.22, 1, 0.36, 1];
const SLOTS = [
  { key: "FR", label: "Front print", hint: "Chest graphic · front angles" },
  { key: "BK", label: "Back print", hint: "Full back · back angles" },
  { key: "LP", label: "Pocket print", hint: "Small left chest · front angles" },
];
const MAX_MB = 40;
const MIN_SIDE = 2400;
const THUMB = 480; // px; previews are stored with the draft, so keep them small

const slotFromName = (name) => name.match(/^\s*(FR|BK|LP)\b/i)?.[1].toUpperCase() ?? null;
const variantFromName = (name) => (/\[BK\]/i.test(name) ? "dark" : "normal");
const fmtMB = (mb) => (mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`);

/** Reads the file into memory, reporting progress (0–0.8 while reading). */
const readWithProgress = (file, onProgress) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 0.8);
    reader.onload = () => resolve(new Blob([reader.result], { type: file.type }));
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });

/** Reads size, whether any pixel is transparent, and a small preview. */
const inspect = async (file, onProgress = () => {}) => {
  const blob = await readWithProgress(file, onProgress);
  if (!blob) return null;
  onProgress(0.9); // decoding and checking
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, THUMB / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          transparent = true;
          break;
        }
      }
      URL.revokeObjectURL(url);
      // WebP keeps transparency and is far smaller to store; browsers without a
      // WebP encoder return PNG instead
      resolve({ width: img.width, height: img.height, transparent, thumb: canvas.toDataURL("image/webp", 0.86) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
};

/** A small solid progress ring. */
const Ring = ({ value, size = 18 }) => {
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="2" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - value) }} transition={{ duration: 0.2 }} />
    </svg>
  );
};

const checksFor = (f) => [
  { level: f.transparent ? "ok" : "warn", text: f.transparent ? "Transparent background" : "No transparent background: the print will show a box" },
  {
    level: Math.max(f.width, f.height) >= MIN_SIDE ? "ok" : "warn",
    text: Math.max(f.width, f.height) >= MIN_SIDE ? "Sharp enough to print" : `Low resolution: ${MIN_SIDE} px or more on the long side is recommended`,
  },
  { level: "ok", text: `${fmtMB(f.sizeMB)} · under the ${MAX_MB} MB limit` },
];
const worst = (f) => (checksFor(f).some((c) => c.level === "warn") ? "warn" : "ok");

const CheckIcon = ({ level, className = "h-4 w-4" }) =>
  level === "ok" ? (
    <CheckCircle2 className={`${className} text-[var(--success)]`} aria-hidden="true" />
  ) : level === "warn" ? (
    <AlertTriangle className={`${className} text-[var(--accent)]`} aria-hidden="true" />
  ) : (
    <XCircle className={`${className} text-[var(--error)]`} aria-hidden="true" />
  );

// ---------- left column ----------
const LineInput = ({ label, hint, large = false, ...props }) => (
  <label className="block">
    <span className="label mb-2 flex justify-between text-[var(--text-3)]">
      {label}
      {hint && <span className="normal-case tracking-normal">{hint}</span>}
    </span>
    <input
      className={`inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent px-0 pb-2 text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)] ${large ? "text-2xl font-medium tracking-[-0.02em]" : "text-base"}`}
      {...props}
    />
  </label>
);

// ---------- file tiles ----------
/**
 * A fixed-size box whose content crossfades in place when it changes (empty →
 * file, file → another file, file → empty). Nothing slides and nothing around
 * it resizes.
 */
const SlotBox = ({ contentKey, small = false, children }) => {
  const reduce = useReducedMotion();
  return (
    <div className={`relative ${small ? "h-36" : "h-64"}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={contentKey}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3, ease }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const FileTile = ({ file, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`group flex h-full w-full flex-col overflow-hidden rounded-md border text-left transition-colors ${selected ? "border-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--line-2)]"}`}
  >
    <span className="checker flex min-h-0 flex-1 items-center justify-center">
      <img src={file.thumb} alt="" className="max-h-full max-w-full object-contain p-3" />
    </span>
    <span className="flex shrink-0 items-center gap-2 border-t border-[var(--line)] bg-[var(--panel)] px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--text-2)]">{file.name}</span>
      <CheckIcon level={worst(file)} className="h-3.5 w-3.5 shrink-0" />
    </span>
  </button>
);

const EmptyTile = ({ label, onClick, optional = false }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--line-2)] text-[var(--text-3)] transition-colors hover:border-[var(--text-3)] hover:text-[var(--text)]"
  >
    <Plus className="h-4 w-4" />
    <span className="label">{label}</span>
    {optional && <span className="text-[11px]">Optional</span>}
  </button>
);

// ---------- inspector ----------
const Inspector = ({ file, files, onMove, onReplace, onRemove }) => {
  if (!file) {
    return (
      <div className="flex h-full flex-col justify-center p-6 text-center">
        <CircleDot className="mx-auto mb-3 h-5 w-5 text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-2)]">Select a file to see its checks.</p>
      </div>
    );
  }
  const taken = (slot, variant) => files.some((f) => f.id !== file.id && f.slot === slot && f.variant === variant);
  return (
    <div className="space-y-6 p-6">
      <div className="checker flex h-64 items-center justify-center overflow-hidden rounded-md border border-[var(--line)]">
        <img src={file.thumb} alt={file.name} className="max-h-full max-w-full object-contain p-4" />
      </div>
      <div>
        <p className="break-all font-mono text-sm text-[var(--text)]">{file.name}</p>
        <p className="mt-1 font-mono text-[11px] text-[var(--text-3)]">
          {file.width} × {file.height} px · {fmtMB(file.sizeMB)}
        </p>
      </div>
      <ul className="space-y-3">
        {checksFor(file).map((c) => (
          <li key={c.text} className="flex items-start gap-3 text-sm">
            <CheckIcon level={c.level} className="mt-0.5 h-4 w-4 shrink-0" />
            <span className={c.level === "ok" ? "text-[var(--text-2)]" : "text-[var(--text)]"}>{c.text}</span>
          </li>
        ))}
      </ul>
      <div>
        <p className="label mb-2 text-[var(--text-3)]">Slot</p>
        <div className="grid grid-cols-3 border border-[var(--line-2)]">
          {SLOTS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onMove(s.key, file.variant)}
              disabled={s.key !== file.slot && taken(s.key, file.variant)}
              title={taken(s.key, file.variant) && s.key !== file.slot ? `${s.key} already has a file` : s.label}
              className={`h-9 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:text-[var(--mute)] ${i > 0 ? "border-l border-[var(--line-2)]" : ""} ${file.slot === s.key ? "bg-[var(--text)] text-[var(--ink)]" : "text-[var(--text-2)] hover:bg-[var(--panel-2)]"}`}
            >
              {s.key}
            </button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 text-sm text-[var(--text-2)]">
          <span>
            Dark tee version
            <span className="block text-[11px] text-[var(--text-3)]">Used on black and other dark colours</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={file.variant === "dark"}
            onClick={() => onMove(file.slot, file.variant === "dark" ? "normal" : "dark")}
            disabled={taken(file.slot, file.variant === "dark" ? "normal" : "dark")}
            className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${file.variant === "dark" ? "bg-[var(--accent)]" : "bg-[var(--line-2)]"}`}
          >
            <motion.span layout transition={{ duration: 0.2, ease }} className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--text)] ${file.variant === "dark" ? "right-0.5" : "left-0.5"}`} />
          </button>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onReplace}>
          <RefreshCw className="h-4 w-4" /> Replace
        </Button>
        <Button onClick={onRemove} className="hover:!border-[var(--error)] hover:!text-[var(--error)]">
          <Trash2 className="h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
};

// ---------- the step ----------
const DesignStep = ({ draft, update, step, index }) => {
  const reduce = useReducedMotion();
  const design = draft.design;
  const files = design.files;
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState([]); // [{ key, name, pct }] files being read and checked
  const [unsorted, setUnsorted] = useState([]); // files whose name says no slot
  const [errors, setErrors] = useState([]);
  const picker = useRef(null);
  const target = useRef(null); // { slot, variant } when a slot's "+" opened the picker, or { replace: id }
  const selected = files.find((f) => f.id === selectedId) ?? null;


  const setDesign = (patch) =>
    update((d) => {
      const next = { ...d, design: { ...d.design, ...patch } };
      // the draft takes the design's name until it is renamed by hand
      if ("name" in patch && (d.name === "Untitled product" || d.name === d.design.name)) next.name = patch.name.trim() || "Untitled product";
      return next;
    });

  const place = (entries) =>
    update((d) => {
      const keep = d.design.files.filter((f) => !entries.some((e) => e.slot === f.slot && e.variant === f.variant));
      return { ...d, design: { ...d.design, files: [...keep, ...entries] } };
    });

  const addFiles = async (list) => {
    const chosen = [...list].filter((f) => !f.name.startsWith("."));
    if (!chosen.length) return;
    const aim = target.current;
    target.current = null;
    const keys = chosen.map((f) => ({ key: Math.random().toString(36).slice(2, 10), name: f.name, pct: 0 }));
    setChecking((c) => [...c, ...keys]);
    const progress = (key) => (pct) => setChecking((c) => c.map((x) => (x.key === key ? { ...x, pct } : x)));
    const finish = (key) => setChecking((c) => c.filter((x) => x.key !== key));
    const placed = [];
    const loose = [];
    const problems = [];
    for (const [n, file] of chosen.entries()) {
      const { key } = keys[n];
      const sizeMB = file.size / 2 ** 20;
      if (sizeMB > MAX_MB) {
        finish(key);
        problems.push(`${file.name}: ${fmtMB(sizeMB)} is over the ${MAX_MB} MB limit`);
        continue;
      }
      const info = await inspect(file, progress(key));
      progress(key)(1);
      setTimeout(() => finish(key), 350); // let the ring complete before it goes
      if (!info) {
        problems.push(`${file.name}: not an image Studio can read (use PNG)`);
        continue;
      }
      if (aim?.replace) {
        update((d) => ({ ...d, design: { ...d.design, files: d.design.files.map((f) => (f.id === aim.replace ? { ...f, name: file.name, sizeMB, ...info } : f)) } }));
        continue;
      }
      const entry = { id: Math.random().toString(36).slice(2, 10), name: file.name, sizeMB, ...info };
      const slot = aim?.slot ?? slotFromName(file.name);
      const variant = aim?.variant ?? variantFromName(file.name);
      if (slot) placed.push({ ...entry, slot, variant });
      else loose.push({ ...entry, variant });
    }
    if (placed.length) {
      place(placed);
      setSelectedId(placed[0].id);
    }
    if (loose.length) setUnsorted((u) => [...u, ...loose]);
    if (problems.length) setErrors((e) => [...e, ...problems]);
  };

  const browse = (aim = null) => {
    target.current = aim;
    picker.current.click();
  };
  const assign = (entry, slot) => {
    setUnsorted((u) => u.filter((x) => x.id !== entry.id));
    place([{ ...entry, slot }]);
    setSelectedId(entry.id);
  };
  const move = (slot, variant) =>
    update((d) => ({ ...d, design: { ...d.design, files: d.design.files.map((f) => (f.id === selected.id ? { ...f, slot, variant } : f)) } }));
  const remove = () => {
    update((d) => ({ ...d, design: { ...d.design, files: d.design.files.filter((f) => f.id !== selected.id) } }));
    setSelectedId(files.find((f) => f.id !== selected.id)?.id ?? null);
  };

  const dropProps = {
    onDragOver: (e) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
  };

  // ---- left column
  const details = (
    <div className="space-y-8 p-6">
      <p className="label text-[var(--text-3)]">Details</p>
      <LineInput label="Design name" large placeholder="e.g. Eren Yeager" value={design.name} onChange={(e) => setDesign({ name: e.target.value })} />
      {/* the shop's categories from the backend; no free text */}
      <CategorySelect label="Series" value={design.categoryId} onChange={(c) => setDesign({ categoryId: c.id, series: c.name, categoryPath: c.path })} />
      <div>
        <p className="label mb-3 flex justify-between text-[var(--text-3)]">
          Slots <span className="normal-case tracking-normal">click to select or add</span>
        </p>
        <ul className="border-t border-[var(--line)]">
          {SLOTS.map((s) => {
            const normal = files.find((f) => f.slot === s.key && f.variant === "normal");
            const dark = files.find((f) => f.slot === s.key && f.variant === "dark");
            const first = normal ?? dark;
            const current = selected?.slot === s.key;
            return (
              <li key={s.key} className="border-b border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => (first ? setSelectedId(first.id) : browse({ slot: s.key, variant: "normal" }))}
                  aria-label={first ? `Select the ${s.label.toLowerCase()} file` : `Add a ${s.label.toLowerCase()} file`}
                  className={`group flex w-full items-center gap-3 px-2 py-3 text-left text-sm transition-colors hover:bg-[var(--panel)] ${current ? "bg-[var(--panel)]" : ""}`}
                >
                  <span className={`w-7 font-mono text-xs ${current ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>{s.key}</span>
                  <span className="flex-1 text-[var(--text-2)] group-hover:text-[var(--text)]">{s.label}</span>
                  {first ? (
                    <span className="font-mono text-[11px] text-[var(--text-3)]">{normal && dark ? "2 files" : "1 file"}</span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-[var(--text-3)] group-hover:text-[var(--text)]" aria-hidden="true" />
                  )}
                  <span className={`h-1.5 w-1.5 rounded-full ${first ? "bg-[var(--success)]" : "bg-[var(--line-2)]"}`} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  // ---- centre
  const stage = (
    <div className="relative flex min-h-full flex-col p-6 md:p-8" {...dropProps}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
            <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
            Step {String(index + 1).padStart(2, "0")} — {step.label}
          </p>
          <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
          <p className="mt-3 max-w-lg text-[var(--text-2)]">Files are sorted by name: FR front, BK back, LP pocket. Add [BK] to a file name for its dark tee version, e.g. FR-[BK].png.</p>
        </div>
        <Button onClick={() => browse()} className="hidden lg:inline-flex">
          <ImagePlus className="h-4 w-4" /> Browse files
        </Button>
        <Button variant="solid" onClick={() => browse()} className="lg:hidden">
          <ImagePlus className="h-4 w-4" /> Browse files
        </Button>
      </div>
      <input ref={picker} type="file" accept="image/png,image/webp,image/jpeg" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />

      {/* errors and files that need a slot */}
      <AnimatePresence initial={false}>
        {errors.map((msg, i) => (
          <motion.div
            key={msg + i}
            initial={{ opacity: 0, x: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: [0, -10, 10, -7, 7, -3, 3, 0] }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-3 flex items-center gap-3 border border-[var(--error)] px-4 py-3 text-sm"
            role="alert"
          >
            <XCircle className="h-4 w-4 shrink-0 text-[var(--error)]" />
            <span className="flex-1 text-[var(--text)]">{msg}</span>
            <button type="button" onClick={() => setErrors((e) => e.filter((_, j) => j !== i))} className="text-[var(--text-3)] hover:text-[var(--text)]" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
        {unsorted.map((entry) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="mb-3 flex flex-wrap items-center gap-3 border border-[var(--line-2)] bg-[var(--panel)] px-4 py-3 text-sm">
            <img src={entry.thumb} alt="" className="checker h-9 w-9 object-contain" />
            <span className="min-w-0 flex-1 text-[var(--text-2)]">
              <span className="font-mono text-[var(--text)]">{entry.name}</span> — which slot?
            </span>
            {SLOTS.map((s) => (
              <button key={s.key} type="button" onClick={() => assign(entry, s.key)} className="h-8 w-11 border border-[var(--line-2)] font-mono text-xs text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--ink)]">
                {s.key}
              </button>
            ))}
            <button type="button" onClick={() => setUnsorted((u) => u.filter((x) => x.id !== entry.id))} className="text-[var(--text-3)] hover:text-[var(--text)]" aria-label={`Discard ${entry.name}`}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && unsorted.length === 0 ? (
        <motion.button
          type="button"
          onClick={() => browse()}
          animate={{ scale: dragging && !reduce ? 0.99 : 1 }}
          transition={{ duration: 0.3, ease }}
          className={`relative flex min-h-[22rem] flex-1 flex-col items-center justify-center rounded-md border border-dashed transition-colors ${dragging ? "border-[var(--accent)] bg-[var(--panel)]" : "border-[var(--line-2)] hover:border-[var(--text-3)]"}`}
        >
          <motion.span animate={{ y: dragging && !reduce ? -6 : 0 }} transition={{ duration: 0.3, ease }} className={`mb-6 grid h-14 w-14 place-items-center rounded-full ${dragging ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--panel-2)] text-[var(--text)]"}`}>
            <Upload className="h-6 w-6" />
          </motion.span>
          <span className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{dragging ? "Release to add" : "Drop FR / BK / LP files"}</span>
          <span className="mt-3 text-sm text-[var(--text-2)]">or click to browse · PNG with a transparent background · up to {MAX_MB} MB</span>
        </motion.button>
      ) : (
        <div className="relative">
          <div className="grid gap-px overflow-hidden rounded-md border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.map((slot) => {
              const normal = files.find((f) => f.slot === slot.key && f.variant === "normal");
              const dark = files.find((f) => f.slot === slot.key && f.variant === "dark");
              return (
                <section key={slot.key} className={`bg-[var(--ink)] p-4 ${slot.key === "LP" ? "md:col-span-2 xl:col-span-1" : ""}`}>
                  <header className="mb-4 flex items-baseline justify-between gap-2">
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-sm text-[var(--accent)]">{slot.key}</span>
                      <span className="font-medium">{slot.label}</span>
                    </span>
                  </header>
                  <p className="mb-4 text-xs text-[var(--text-3)]">{slot.hint}</p>
                  <p className="label mb-2 flex justify-between text-[var(--text-3)]">
                    Main version <span className="normal-case tracking-normal">light colours</span>
                  </p>
                  <SlotBox contentKey={normal ? `${normal.id}:${normal.name}:${normal.sizeMB}` : "empty"}>
                    {normal ? (
                      <FileTile file={normal} selected={normal.id === selectedId} onSelect={() => setSelectedId(normal.id)} />
                    ) : (
                      <EmptyTile label={`Add ${slot.key}`} onClick={() => browse({ slot: slot.key, variant: "normal" })} />
                    )}
                  </SlotBox>
                  <p className="label mb-2 mt-4 flex justify-between text-[var(--text-3)]">
                    Dark tee version <span className="normal-case tracking-normal">black &amp; dark colours</span>
                  </p>
                  <SlotBox small contentKey={dark ? `${dark.id}:${dark.name}:${dark.sizeMB}` : "empty"}>
                    {dark ? (
                      <FileTile file={dark} selected={dark.id === selectedId} onSelect={() => setSelectedId(dark.id)} />
                    ) : (
                      <EmptyTile optional label="Add dark version" onClick={() => browse({ slot: slot.key, variant: "dark" })} />
                    )}
                  </SlotBox>
                </section>
              );
            })}
          </div>
          {/* drop overlay while dragging over existing slots */}
          <AnimatePresence>
            {dragging && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center rounded-md border border-[var(--accent)] bg-[var(--scrim)]">
                <span className="text-2xl font-semibold">Release to add</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <AnimatePresence initial={false}>
        {checking.length > 0 && (
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2" aria-live="polite" aria-label="Checking files">
            {checking.map((c) => (
              <li key={c.key} className="flex items-center gap-3 text-sm">
                <Ring value={c.pct} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--text-2)]">{c.name}</span>
                <span className="font-mono text-[11px] text-[var(--text-3)]">{Math.round(c.pct * 100)}%</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );

  const inspector = (
    <Inspector file={selected} files={files} onMove={move} onReplace={() => browse({ replace: selected.id })} onRemove={remove} />
  );

  // desktop: details | stage | inspector, each scrolling on its own.
  // below 1280 px the inspector moves under the stage; below 1024 px everything stacks.
  return (
    <div className="scroll-y h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
      <aside className="border-b border-[var(--line)] lg:overflow-y-auto lg:border-b-0 lg:border-r">{details}</aside>
      <div className="lg:overflow-y-auto">
        {stage}
        <div className="border-t border-[var(--line)] xl:hidden">{inspector}</div>
      </div>
      <aside className="hidden border-l border-[var(--line)] xl:block xl:overflow-y-auto">{inspector}</aside>
    </div>
  );
};

export default DesignStep;
