// Making a new model set, as full-screen overlays over Studio:
//  - Photoshoot: brief → pick a front → the other angles develop in → save.
//    Generation is simulated until the Gemini service exists (phase 3).
//  - UploadSet: your own photos, each tagged with its angle.
// Spec: docs/STUDIO_PLAN.md §5.4.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ImagePlus, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { ANGLES, MIN_ANGLES, angleLabel } from "../data/sample";
import { createModelSet } from "../modelStore";
import { errorText } from "../../dashboard/api";
import ModelFigure from "../ui/ModelFigure";
import Segmented from "../ui/Segmented";
import { Button } from "../ui/Shell";

const ease = [0.22, 1, 0.36, 1];
const GREEN = "#00b140"; // base tee: recoloured later (plan §2)
const LOOKS = {
  Men: [["#b07a55", "#1b1410"], ["#8d5a3b", "#120d0a"], ["#c48b62", "#2a1d14"], ["#9c6646", "#0f0b09"]],
  Women: [["#b5805c", "#1a1210"], ["#d39a72", "#3a2618"], ["#9c6646", "#0f0b09"], ["#c48b62", "#24170f"]],
};
const COST = { pro: 0.13, flash: 0.04 }; // US$ per image, illustrative until phase 0a measures it

// ---------- shared shell ----------
const Overlay = ({ title, icon: Icon, parts, part, onClose, children }) => {
  const [root, setRoot] = useState(null);
  useEffect(() => setRoot(document.getElementById("studio-root")), []);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!root) return null;
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="absolute inset-0 z-50 flex flex-col bg-[var(--ink)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, ease }}
    >
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[var(--line)] px-4 md:px-6">
        <Icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
        <h2 className="label !text-[12px] text-[var(--text)]">{title}</h2>
        {parts && (
          <ol className="ml-4 hidden items-center gap-5 md:flex" aria-label="Progress">
            {parts.map((p, i) => (
              <li key={p} className={`label flex items-center gap-2 ${i === part ? "text-[var(--text)]" : i < part ? "text-[var(--text-2)]" : "text-[var(--mute)]"}`} aria-current={i === part ? "step" : undefined}>
                <span className={`font-mono ${i === part ? "text-[var(--accent)]" : ""}`}>{String(i + 1).padStart(2, "0")}</span> {p}
              </li>
            ))}
          </ol>
        )}
        <button type="button" onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-md text-[var(--text-2)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="scroll-y min-h-0 flex-1">{children}</div>
    </motion.div>,
    root,
  );
};

/** A photo that develops in: blur and exposure settle. */
const Develop = ({ children, delay = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(14px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </motion.div>
  );
};

const Pending = ({ className = "" }) => <div className={`animate-pulse bg-[var(--panel-2)] ${className}`} aria-label="Generating" />;

const Tick = ({ on }) => (
  <span className={`grid h-4 w-4 shrink-0 place-items-center border ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]" : "border-[var(--line-2)]"}`} aria-hidden="true">
    {on && <Check className="h-3 w-3" strokeWidth={3} />}
  </span>
);

const NameField = ({ value, onChange }) => (
  <label className="block">
    <span className="label mb-2 block text-[var(--text-3)]">Name</span>
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g. Dev · studio grey"
      className="inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent px-0 pb-2 text-2xl font-medium tracking-[-0.02em] text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)]"
    />
  </label>
);

// ---------- generate ----------
export const Photoshoot = ({ onClose }) => {
  const [part, setPart] = useState(0); // 0 brief · 1 front · 2 angles · 3 save
  const [brief, setBrief] = useState({ gender: "Men", direction: "", model: "pro", angles: ANGLES.map((a) => a.key) });
  const [candidates, setCandidates] = useState(null);
  const [front, setFront] = useState(null);
  const [made, setMade] = useState({}); // angle → "making" | "done"
  const [name, setName] = useState("");
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const others = brief.angles.filter((a) => a !== "front");
  const done = others.filter((a) => made[a] === "done").length;
  const estimate = (4 + others.length) * COST[brief.model];

  const makeFronts = () => {
    setPart(1);
    setCandidates(null);
    setFront(null);
    later(() => setCandidates(LOOKS[brief.gender].map(([skin, hair], i) => ({ id: `${Date.now()}-${i}`, skin, hair }))), 1400);
  };
  const makeAngles = () => {
    setPart(2);
    setMade(Object.fromEntries(others.map((a) => [a, "making"])));
    others.forEach((a, i) => later(() => setMade((m) => ({ ...m, [a]: "done" })), 900 + i * 650));
  };
  const remake = (a) => {
    setMade((m) => ({ ...m, [a]: "making" }));
    later(() => setMade((m) => ({ ...m, [a]: "done" })), 1100);
  };
  const close = () => (part === 0 || window.confirm("Discard this model set?")) && onClose();

  return (
    <Overlay title="New model set" icon={Sparkles} parts={["Brief", "Front", "Angles", "Save"]} part={part} onClose={close}>
      <AnimatePresence mode="wait">
        {part === 0 && (
          <motion.div key="brief" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }} className="mx-auto grid max-w-5xl gap-10 p-6 md:grid-cols-2 md:p-10">
            <div className="space-y-8">
              <div>
                <p className="label mb-2 text-[var(--text-3)]">Model</p>
                <Segmented label="Model" options={[["Men", "Men"], ["Women", "Women"]]} value={brief.gender} onChange={(gender) => setBrief((b) => ({ ...b, gender }))} />
              </div>
              <label className="block">
                <span className="label mb-2 flex justify-between text-[var(--text-3)]">
                  Direction <span className="normal-case tracking-normal">optional</span>
                </span>
                <textarea
                  rows={3}
                  value={brief.direction}
                  onChange={(e) => setBrief((b) => ({ ...b, direction: e.target.value }))}
                  placeholder="e.g. curly hair, warmer light"
                  className="inline-edit w-full resize-none border-0 border-b border-[var(--line-2)] bg-transparent px-0 pb-2 text-sm text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)]"
                />
              </label>
              <div>
                <p className="label mb-2 text-[var(--text-3)]">Gemini model</p>
                <Segmented label="Gemini model" options={[["pro", "Pro · best match"], ["flash", "Flash · cheaper"]]} value={brief.model} onChange={(model) => setBrief((b) => ({ ...b, model }))} />
              </div>
            </div>
            <div>
              <p className="label mb-2 flex justify-between text-[var(--text-3)]">
                Angles <span className="normal-case tracking-normal">at least {MIN_ANGLES}</span>
              </p>
              <ul className="border-t border-[var(--line)]">
                {ANGLES.map((a) => {
                  const on = brief.angles.includes(a.key);
                  return (
                    <li key={a.key} className="border-b border-[var(--line)]">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={a.key === "front"}
                        title={a.key === "front" ? "Every set starts from the front shot" : undefined}
                        onClick={() => setBrief((b) => ({ ...b, angles: on ? b.angles.filter((x) => x !== a.key) : ANGLES.map((x) => x.key).filter((k) => k === a.key || b.angles.includes(k)) }))}
                        className="flex w-full items-center gap-3 px-2 py-3 text-left text-sm hover:bg-[var(--panel)] disabled:cursor-default disabled:hover:bg-transparent"
                      >
                        <Tick on={on} />
                        <span className={on ? "text-[var(--text)]" : "text-[var(--text-2)]"}>{a.label}</span>
                        {a.key === "front" && <span className="ml-auto text-[11px] text-[var(--text-3)]">always</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="label text-[var(--text-3)]">Estimated cost</p>
                  <p className="mt-1 font-mono text-2xl text-[var(--text)]">≈ ${estimate.toFixed(2)}</p>
                  <p className="text-[11px] text-[var(--text-3)]">4 front tries + {others.length} angles</p>
                </div>
                <Button variant="solid" onClick={makeFronts} disabled={brief.angles.length < MIN_ANGLES} title={brief.angles.length < MIN_ANGLES ? `Pick at least ${MIN_ANGLES} angles` : undefined}>
                  <Sparkles className="h-4 w-4" /> Generate fronts
                </Button>
              </div>
              <p className="mt-6 text-xs text-[var(--text-3)]">Prototype: generation is simulated until the Gemini service is connected.</p>
            </div>
          </motion.div>
        )}

        {part === 1 && (
          <motion.div key="front" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }} className="mx-auto max-w-5xl p-6 md:p-10">
            <h3 className="text-3xl font-semibold tracking-[-0.03em]">Pick the front shot</h3>
            <p className="mt-2 text-[var(--text-2)]">Every other angle is generated from it, so the person stays the same.</p>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {(candidates ?? [0, 1, 2, 3]).map((c, i) =>
                candidates ? (
                  <Develop key={c.id} delay={i * 0.12}>
                    <button type="button" onClick={() => setFront(c)} aria-pressed={front?.id === c.id} className={`relative block w-full overflow-hidden border-2 ${front?.id === c.id ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--line-2)]"}`}>
                      <ModelFigure angle="front" tee={GREEN} skin={c.skin} hair={c.hair} className="aspect-[4/5] w-full" />
                      {front?.id === c.id && (
                        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-[var(--accent)] text-[var(--accent-ink)]">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </Develop>
                ) : (
                  <Pending key={i} className="aspect-[4/5]" />
                ),
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => setPart(0)}>Back to brief</Button>
              <Button onClick={makeFronts} disabled={!candidates}>
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
              <Button variant="solid" onClick={makeAngles} disabled={!front} className="ml-auto">
                Use this front
              </Button>
            </div>
          </motion.div>
        )}

        {part === 2 && (
          <motion.div key="angles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }} className="mx-auto max-w-6xl p-6 md:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.03em]">Making the angles</h3>
                <p className="mt-2 text-[var(--text-2)]">Regenerate any angle that doesn&apos;t look right.</p>
              </div>
              <p className="font-mono text-sm text-[var(--text-2)]" aria-live="polite">
                <span className="text-[var(--text)]">{String(done).padStart(2, "0")}</span> / {String(others.length).padStart(2, "0")}
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3 xl:grid-cols-6">
              {brief.angles.map((a) => (
                <div key={a} className="bg-[var(--ink)]">
                  {a === "front" || made[a] === "done" ? (
                    <Develop key={`${a}-${made[a]}`}>
                      <ModelFigure angle={a} tee={GREEN} skin={front.skin} hair={front.hair} className="aspect-[4/5] w-full" />
                    </Develop>
                  ) : (
                    <Pending className="aspect-[4/5]" />
                  )}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="label text-[var(--text-2)]">{angleLabel(a)}</span>
                    {a !== "front" && (
                      <button type="button" onClick={() => remake(a)} disabled={made[a] !== "done"} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30" aria-label={`Regenerate ${angleLabel(a)}`}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button variant="solid" disabled={done < others.length} onClick={() => setPart(3)}>
                Accept angles
              </Button>
            </div>
          </motion.div>
        )}

        {part === 3 && (
          <motion.div key="save" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }} className="mx-auto grid max-w-3xl items-end gap-10 p-6 md:grid-cols-[14rem_1fr] md:p-10">
            <ModelFigure angle="front" tee={GREEN} skin={front.skin} hair={front.hair} className="aspect-[4/5] w-full" />
            <div className="space-y-8">
              <NameField value={name} onChange={setName} />
              <p className="text-sm text-[var(--text-2)]">
                {brief.gender} · {brief.angles.length} angles
              </p>
              <div className="border border-[var(--line-2)] p-4 text-sm text-[var(--text-2)]">
                Saving generated sets arrives with the Gemini service: this preview has no real photos to store. Generate the photos in Gemini for now and add them with <span className="text-[var(--text)]">Upload photos</span>.
              </div>
              <Button variant="solid" disabled title="Needs the Gemini service">
                Save to library
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Overlay>
  );
};

// ---------- upload ----------
const ANGLE_WORDS = [
  ["closeup", /close|macro|detail/i],
  ["front_45", /front.?45|45.?front|three.?quarter/i],
  ["rear_45", /(back|rear).?45|45.?(back|rear)/i],
  ["side", /side|profile/i],
  ["back", /back|rear/i],
  ["front", /front/i],
];
const guessAngle = (name) => ANGLE_WORDS.find(([, re]) => re.test(name))?.[0] ?? null;

const toThumb = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };
    img.onerror = () => (URL.revokeObjectURL(url), resolve(null));
    img.src = url;
  });

export const UploadSet = ({ onClose, onSave }) => {
  const [photos, setPhotos] = useState([]); // [{ id, name, thumb, angle }]
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Men");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(null); // { done, total } while uploading
  const [error, setError] = useState("");
  const picker = useRef(null);
  const tagged = photos.filter((p) => p.angle);

  const save = async () => {
    setError("");
    setSaving({ done: 0, total: tagged.length });
    try {
      const photosByAngle = ANGLES.filter((a) => tagged.some((p) => p.angle === a.key)).map((a) => ({ angle: a.key, file: tagged.find((p) => p.angle === a.key).file }));
      const set = await createModelSet({ name: name.trim(), gender, source: "Uploaded", photos: photosByAngle }, (done, total) => setSaving({ done, total }));
      onSave(set);
    } catch (err) {
      setError(errorText(err));
      setSaving(null);
    }
  };

  const add = async (list) => {
    const added = [];
    for (const file of [...list].filter((f) => f.type.startsWith("image/"))) {
      const thumb = await toThumb(file);
      if (thumb) added.push({ id: Math.random().toString(36).slice(2, 9), name: file.name, file, thumb, angle: guessAngle(file.name) });
    }
    setPhotos((all) => {
      // one photo per angle: a guessed angle already taken stays untagged
      const used = new Set(all.map((p) => p.angle).filter(Boolean));
      return [...all, ...added.map((p) => (p.angle && used.has(p.angle) ? { ...p, angle: null } : (used.add(p.angle), p)))];
    });
  };
  const tag = (id, angle) => setPhotos((all) => all.map((p) => (p.id === id ? { ...p, angle } : p.angle === angle ? { ...p, angle: null } : p)));
  const close = () => !saving && (!photos.length || window.confirm("Discard these photos?")) && onClose();

  return (
    <Overlay title="Upload a model set" icon={Upload} onClose={close}>
      <div
        className="mx-auto max-w-6xl p-6 md:p-10"
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false)}
        onDrop={(e) => (e.preventDefault(), setDragging(false), add(e.dataTransfer.files))}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold tracking-[-0.03em]">Your photoshoot, as a set</h3>
            <p className="mt-2 max-w-xl text-[var(--text-2)]">One photo per angle. Angles are guessed from file names (front, back, side, 45, close); tag the rest. Uploaded photos are used as they are, without recolouring.</p>
          </div>
          <Button onClick={() => picker.current.click()}>
            <ImagePlus className="h-4 w-4" /> Add photos
          </Button>
        </div>
        <input ref={picker} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />

        {photos.length === 0 ? (
          <button type="button" onClick={() => picker.current.click()} className={`mt-8 flex h-72 w-full flex-col items-center justify-center rounded-md border border-dashed transition-colors ${dragging ? "border-[var(--accent)] bg-[var(--panel)]" : "border-[var(--line-2)] hover:border-[var(--text-3)]"}`}>
            <Upload className="mb-4 h-6 w-6" />
            <span className="text-2xl font-semibold tracking-[-0.02em]">{dragging ? "Release to add" : "Drop model photos"}</span>
            <span className="mt-2 text-sm text-[var(--text-2)]">or click to browse</span>
          </button>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3 xl:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="bg-[var(--ink)]">
                <div className="relative">
                  <img src={p.thumb} alt={p.name} className="aspect-[4/5] w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((all) => all.filter((x) => x.id !== p.id))} className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-[var(--ink)] text-[var(--text-2)] hover:text-[var(--error)]" aria-label={`Remove ${p.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="mb-2 truncate font-mono text-[11px] text-[var(--text-3)]">{p.name}</p>
                  <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label={`Angle for ${p.name}`}>
                    {ANGLES.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        role="radio"
                        aria-checked={p.angle === a.key}
                        onClick={() => tag(p.id, a.key)}
                        className={`h-7 truncate px-1 text-[10px] font-medium transition-colors ${p.angle === a.key ? "bg-[var(--text)] text-[var(--ink)]" : "border border-[var(--line-2)] text-[var(--text-2)] hover:text-[var(--text)]"}`}
                      >
                        {a.label.replace("Chest close-up", "Close-up")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 grid items-end gap-8 border-t border-[var(--line)] pt-8 md:grid-cols-[1fr_auto_auto]">
          <NameField value={name} onChange={setName} />
          <div>
            <p className="label mb-2 text-[var(--text-3)]">Model</p>
            <Segmented label="Model" options={[["Men", "Men"], ["Women", "Women"]]} value={gender} onChange={setGender} className="w-48" />
          </div>
          <div className="text-right">
            {photos.length > 0 && tagged.length < MIN_ANGLES && !saving && <p className="mb-2 text-xs text-[var(--accent)]">{tagged.length} of {MIN_ANGLES} recommended angles tagged</p>}
            {saving && (
              <p className="mb-2 font-mono text-xs text-[var(--text-2)]" aria-live="polite">
                Uploading {saving.done} / {saving.total}…
              </p>
            )}
            {error && (
              <p className="mb-2 max-w-sm text-xs text-[var(--error)]" role="alert">
                {error}
              </p>
            )}
            <Button variant="solid" disabled={!name.trim() || !tagged.length || Boolean(saving)} onClick={save}>
              {saving ? "Saving…" : "Save to library"}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};
