// Step 8: the summary, then publish through the product editor's endpoints.
// Live in the shop, or hidden (archived) to switch on later. Publishing again
// updates the same product. Spec: docs/STUDIO_PLAN.md §5.10.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, EyeOff, Loader2, Plus, Rocket, ShoppingBag, XCircle } from "lucide-react";
import { errorText } from "../../dashboard/api";
import { useStudio } from "../context";
import { newDraft } from "../draftStore";
import { colourOf } from "../palette";
import { buildProduct, publishDraft, publishWarnings } from "../publish";
import { STEPS } from "../steps";
import ShopCard from "../ui/ShopCard";
import { Button } from "../ui/Shell";

const ease = [0.22, 1, 0.36, 1];
const pad = (n) => String(n).padStart(2, "0");
const rupees = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

// which step to fix, from the field the backend names
const FIELD_STEP = { price: "details", discountPercentage: "details", weight: "details", name: "details", description: "details", details: "details", category: "details", productCategory: "details", skus: "skus", image: "review", colorImages: "review" };

/** Flat solid squares bursting out, in the accent and text colours. */
const Burst = () => {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-40">
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const d = 150 + (i % 4) * 50;
        return (
          <motion.span
            key={i}
            className={`absolute h-2 w-2 ${i % 3 ? "bg-[var(--accent)]" : "bg-[var(--text)]"}`}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, rotate: 180 }}
            transition={{ duration: 1.1, ease }}
          />
        );
      })}
    </div>
  );
};

const PublishStep = ({ draft, update, step, index }) => {
  const { setDrafts } = useStudio();
  const navigate = useNavigate();
  const body = useMemo(() => buildProduct(draft), [draft]);
  const warnings = useMemo(() => publishWarnings(draft, body), [draft, body]);
  const [stage, setStage] = useState(null); // null | "save" | "status" | "done"
  const [mode, setMode] = useState(null); // "live" | "hidden"
  const [error, setError] = useState(null); // { message, fields: [{ path, message }] }
  const published = draft.published;
  const photoCount = body.colorImages.reduce((n, c) => n + c.images.length, 0);

  const go = async (hidden) => {
    setMode(hidden ? "hidden" : "live");
    setError(null);
    try {
      const result = await publishDraft(draft, { hidden }, setStage);
      update((d) => ({ ...d, published: { productId: result.id, slug: result.slug, hidden, at: Date.now() } }));
      setStage("done");
    } catch (err) {
      setStage(null);
      setError({ message: errorText(err), fields: err?.body?.errors ?? [] });
    }
  };
  const startNew = () => {
    const d = newDraft();
    setDrafts((all) => [d, ...all]);
    navigate(`/studio/d/${d.id}/${STEPS[0].key}`);
  };
  const fixStep = error && (error.fields.map((f) => FIELD_STEP[String(f.path).split(".")[0]]).find(Boolean) ?? null);

  // ---------- left: readiness ----------
  const panel = (
    <div className="space-y-7 p-6">
      <div>
        <p className="label mb-3 text-[var(--text-3)]">Ready</p>
        <ul className="border-t border-[var(--line)]">
          {STEPS.slice(0, -1).map((s, i) => (
            <li key={s.key} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 text-sm">
              <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} />
              <span className="font-mono text-[11px] text-[var(--text-3)]">{pad(i + 1)}</span>
              <span className="text-[var(--text-2)]">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
      {warnings.length > 0 && (
        <div>
          <p className="label mb-2 text-[var(--text-3)]">Worth knowing</p>
          <ul className="space-y-2">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-2 text-xs text-[var(--text-2)]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" /> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      {published && (
        <div className="border border-[var(--line-2)] p-4 text-sm">
          <p className="label mb-1 text-[var(--text-3)]">Published</p>
          <p>
            {published.hidden ? "Hidden" : "Live"} · {ago(published.at)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-3)]">Publishing again updates the same product.</p>
        </div>
      )}
    </div>
  );

  // ---------- centre ----------
  const summary = (
    <motion.div key="summary" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
        <div className="bg-[var(--ink)] md:col-span-2 md:row-span-2">
          {body.image ? <img src={body.image} alt="" className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] bg-[var(--panel)]" />}
        </div>
        <div className="bg-[var(--ink)] p-5 md:col-span-2">
          <p className="label text-[var(--text-3)]">{draft.design.categoryPath || "Product"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{body.name}</h2>
          <p className="mt-2 font-mono text-xl text-[var(--accent)]">{rupees(body.price)}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {body.color.map((code) => (
              <span key={code} title={colourOf(code)?.name} className="h-5 w-5 rounded-full" style={{ background: colourOf(code)?.hex, boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.35)" }} />
            ))}
          </div>
        </div>
        {[
          ["Colours", body.color.length],
          ["Sizes", body.size.length],
          ["Photos", photoCount],
          ["SKUs", body.skus.length],
        ].map(([label, n]) => (
          <div key={label} className="bg-[var(--ink)] p-5">
            <p className="font-mono text-3xl">{pad(n)}</p>
            <p className="label mt-1 text-[var(--text-3)]">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 border border-[var(--error)] p-4 text-sm" role="alert">
          <p className="flex items-center gap-2 font-medium text-[var(--error)]">
            <XCircle className="h-4 w-4" /> Couldn&apos;t publish: {error.message}
          </p>
          {error.fields.length > 1 && (
            <ul className="mt-2 space-y-1 text-xs text-[var(--text-2)]">
              {error.fields.map((f) => (
                <li key={`${f.path}-${f.message}`}>
                  <span className="font-mono">{f.path}</span>: {f.message}
                </li>
              ))}
            </ul>
          )}
          {fixStep && (
            <Button className="mt-3" onClick={() => navigate(`/studio/d/${draft.id}/${fixStep}`)}>
              Fix it in {STEPS.find((s) => s.key === fixStep)?.label} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start gap-4">
        {stage ? (
          <ol className="w-full max-w-sm space-y-3 border border-[var(--line-2)] p-5" aria-live="polite">
            {[
              ["save", published ? "Update the product" : "Create the product"],
              ["status", mode === "hidden" ? "Keep it hidden" : "Put it in the shop"],
            ].map(([key, label], i) => {
              const order = ["save", "status", "done"];
              const now = order.indexOf(stage);
              return (
                <li key={key} className="flex items-center gap-3 text-sm">
                  {now > i ? <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} /> : now === i ? <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> : <span className="h-4 w-4 border border-[var(--line-2)]" />}
                  <span className={now >= i ? "" : "text-[var(--text-3)]"}>{label}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <Button variant="solid" className="!h-14 !px-8 !text-[13px]" onClick={() => go(false)}>
              <Rocket className="h-5 w-5" /> {published ? "Update and keep it live" : "Publish to the shop"}
            </Button>
            <Button onClick={() => go(true)}>
              <EyeOff className="h-4 w-4" /> {published ? "Update and hide it" : "Publish hidden"}
            </Button>
            <p className="max-w-md text-xs text-[var(--text-3)]">Hidden products are created in Products as archived: switch them on there when ready. The backend checks the price against shipping for the weight.</p>
          </>
        )}
      </div>
    </motion.div>
  );

  const done = (
    <motion.div key="done" className="relative flex flex-col items-center py-6 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
      <Burst />
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ duration: 0.6, ease }} className="w-64">
        <ShopCard draft={draft} />
      </motion.div>
      <h2 className="mt-8 text-4xl font-semibold tracking-[-0.03em]">{mode === "hidden" ? "Saved, hidden" : "It's live"}</h2>
      <p className="mt-2 text-[var(--text-2)]">
        {body.color.length} colour{body.color.length === 1 ? "" : "s"} · {photoCount} photos · {body.skus.length} SKUs
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {mode !== "hidden" && published?.productId && (
          <a href={`/product/${published.productId}`} target="_blank" rel="noreferrer" className="label inline-flex h-10 items-center gap-2 border border-[var(--line-2)] px-4 hover:bg-[var(--panel-2)]">
            <ShoppingBag className="h-4 w-4" /> View in shop
          </a>
        )}
        {published?.productId && (
          <Link to={`/dashboard/products/${published.productId}`} className="label inline-flex h-10 items-center gap-2 border border-[var(--line-2)] px-4 hover:bg-[var(--panel-2)]">
            Open in Products
          </Link>
        )}
        <Button variant="solid" onClick={startNew}>
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>
    </motion.div>
  );

  const stageView = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {pad(index + 1)} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{stage === "done" ? "Published" : step.title}</h1>
        {stage !== "done" && <p className="mt-3 max-w-xl text-[var(--text-2)]">{published ? "This draft is already published. Publishing again updates the same product." : "Check the summary, then publish."}</p>}
      </div>
      <AnimatePresence mode="wait">{stage === "done" ? done : summary}</AnimatePresence>
    </div>
  );

  // ---------- right ----------
  const inspector = (
    <div className="space-y-4 p-6">
      <p className="label text-[var(--text-3)]">Shop preview</p>
      <ShopCard draft={draft} />
    </div>
  );

  return (
    <div className="scroll-y h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
      <aside className="border-b border-[var(--line)] lg:overflow-y-auto lg:border-b-0 lg:border-r">{panel}</aside>
      <div className="lg:overflow-y-auto">
        {stageView}
        <div className="border-t border-[var(--line)] xl:hidden">{inspector}</div>
      </div>
      <aside className="hidden border-l border-[var(--line)] xl:block xl:overflow-y-auto">{inspector}</aside>
    </div>
  );
};

export default PublishStep;
