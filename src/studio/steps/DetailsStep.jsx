// Step 6: what customers read in the shop. The same fields and rules as the
// dashboard's product editor (published through it in step 8), carried over
// from earlier steps where possible, with a live shop card on the right.
// Spec: docs/STUDIO_PLAN.md §5.8.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle, RotateCw } from "lucide-react";
import { admin, errorText } from "../../dashboard/api";
import { SIZES } from "../../dashboard/colours";
import { colourOf } from "../palette";
import { DETAIL_RULES, detailLines, mrpOf } from "../details";

const ease = [0.22, 1, 0.36, 1];
const rupees = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const lineInput =
  "inline-edit w-full border-0 border-b border-[var(--line-2)] bg-transparent px-0 pb-2 text-[var(--text)] caret-[var(--accent)] placeholder:text-[var(--mute)] focus:border-[var(--text)]";

const FieldLabel = ({ children, hint, htmlFor }) => (
  <label htmlFor={htmlFor} className="label mb-2 flex justify-between text-[var(--text-3)]">
    {children}
    {hint && <span className="normal-case tracking-normal">{hint}</span>}
  </label>
);

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-6 border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0">
    <h2 className="label mb-6 text-[var(--text-2)]">{title}</h2>
    <div className="space-y-7">{children}</div>
  </section>
);

/** How the product will look in the shop's grid, from the step 5 photos. */
const ShopCard = ({ draft }) => {
  const x = draft.details;
  const [code, setCode] = useState(draft.colours[0]);
  const photo = (c) => draft.renders[draft.mainByColour[c]]?.url;
  const price = Number(x.price) || 0;
  const discount = Number(x.discount) || 0;
  const mrp = mrpOf(price, discount);
  return (
    <div className="overflow-hidden bg-[#F8F4EE] text-[#2A2420]">
      <div className="relative aspect-[4/5] bg-[#E4DED4]">
        <AnimatePresence initial={false}>
          {photo(code) && <motion.img key={photo(code)} src={photo(code)} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />}
        </AnimatePresence>
        {discount > 0 && <span className="absolute left-2 top-2 bg-[#2A2420] px-1.5 py-0.5 text-[11px] font-semibold text-white">{discount}% OFF</span>}
      </div>
      <div className="space-y-2 p-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{x.name || "Product name"}</p>
        <p className="flex items-baseline gap-2">
          <span className="text-base font-bold">{price ? rupees(price) : "₹—"}</span>
          {mrp > price && <span className="text-xs text-[#635B52] line-through">{rupees(mrp)}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {draft.colours.map((c) => (
            <button key={c} type="button" onClick={() => setCode(c)} aria-label={colourOf(c)?.name} title={colourOf(c)?.name} className={`h-5 w-5 rounded-full ${c === code ? "ring-2 ring-[#2A2420] ring-offset-1 ring-offset-[#F8F4EE]" : ""}`} style={{ background: colourOf(c)?.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }} />
          ))}
        </div>
        <p className="text-[11px] tracking-wide text-[#635B52]">{x.sizes.length ? x.sizes.join(" · ") : "No sizes"}</p>
      </div>
    </div>
  );
};

const DetailsStep = ({ draft, update, step, index }) => {
  const x = draft.details;
  const [taxonomy, setTaxonomy] = useState(null);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoadError("");
    admin
      .get("/categories")
      .then(setTaxonomy)
      .catch((err) => setLoadError(errorText(err)));
  };
  useEffect(load, []);

  const categories = useMemo(() => {
    const items = taxonomy?.items ?? [];
    const byId = new Map(items.map((c) => [c.id, c]));
    const path = (c) => (c.parentId && byId.get(c.parentId) ? `${path(byId.get(c.parentId))} › ${c.name}` : c.name);
    return items.map((c) => ({ id: c.id, label: path(c) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [taxonomy]);
  const types = taxonomy?.productTypes ?? [];
  const weightOf = (typeId) => types.find((t) => t.id === typeId)?.defaultWeightGrams ?? null;

  const set = (patch) => update((d) => ({ ...d, details: { ...d.details, ...patch } }));

  // first visit: carry over what earlier steps already know
  const seeded = useRef(false);
  useEffect(() => {
    if (!taxonomy || seeded.current || x.seeded) return;
    seeded.current = true;
    const tee = types.find((t) => /oversized t-?shirt/i.test(t.name) && !/terry|acid|hood|sweat/i.test(t.name)) ?? types[0];
    set({
      seeded: true,
      name: x.name || draft.design.name,
      category: x.category || draft.design.categoryId || "",
      productCategory: x.productCategory || tee?.id || "",
      weight: x.weight || (tee?.defaultWeightGrams ? String(tee.defaultWeightGrams) : ""),
      tags: x.tags || [draft.design.series, "oversized"].filter(Boolean).join(", "),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxonomy]);

  const chooseType = (typeId) => {
    // the type's standard weight fills in, unless someone typed their own
    const untouched = x.weight === "" || x.weight === String(weightOf(x.productCategory) ?? "");
    set({ productCategory: typeId, weight: untouched ? String(weightOf(typeId) ?? "") : x.weight });
  };
  const toggleSize = (s) => set({ sizes: x.sizes.includes(s) ? x.sizes.filter((v) => v !== s) : SIZES.filter((v) => v === s || x.sizes.includes(v)) });

  const price = Number(x.price) || 0;
  const discount = Number(x.discount) || 0;
  const checks = DETAIL_RULES.map((r) => ({ ...r, ok: !r.missing(x) }));

  // ---------- left: what's done ----------
  const panel = (
    <div className="space-y-6 p-6">
      <p className="label flex justify-between text-[var(--text-3)]">
        Required <span className="normal-case tracking-normal">{checks.filter((c) => c.ok).length} of {checks.length}</span>
      </p>
      <ul className="border-t border-[var(--line)]">
        {checks.map((c) => (
          <li key={c.key} className="border-b border-[var(--line)]">
            <a href={`#${c.section}`} className="flex items-center gap-3 px-1 py-2.5 text-sm hover:bg-[var(--panel)]">
              {c.ok ? <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} /> : <Circle className="h-4 w-4 text-[var(--text-3)]" />}
              <span className={c.ok ? "text-[var(--text-2)]" : "text-[var(--text)]"}>{c.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-[var(--text-3)]">The same rules as the product editor. Publishing (step 8) checks the price against the shipping floor for the weight.</p>
    </div>
  );

  // ---------- centre: the form ----------
  const stage = (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="label mb-3 flex items-center gap-2 text-[var(--text-3)]">
          <step.icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
          Step {String(index + 1).padStart(2, "0")} — {step.label}
        </p>
        <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.035em] md:text-5xl">{step.title}</h1>
        <p className="mt-3 max-w-xl text-[var(--text-2)]">What customers read in the shop. Values from earlier steps are filled in; change anything.</p>
      </div>
      {loadError && (
        <div className="mb-6 flex items-center gap-3 border border-[var(--error)] px-4 py-3 text-sm" role="alert">
          <span className="flex-1">Couldn&apos;t load categories: {loadError}</span>
          <button type="button" onClick={load} className="label flex items-center gap-1.5 hover:text-[var(--accent)]">
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}
      <div className="max-w-2xl">
        <Section id="basics" title="Basics">
          <div>
            <FieldLabel htmlFor="d-name">Name</FieldLabel>
            <input id="d-name" value={x.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Eren Yeager Oversized Tee" maxLength={200} className={`${lineInput} text-2xl font-medium tracking-[-0.02em]`} />
          </div>
          <div>
            <FieldLabel htmlFor="d-desc" hint={`${x.description.length} / 5000`}>
              Description
            </FieldLabel>
            <textarea id="d-desc" rows={4} value={x.description} onChange={(e) => set({ description: e.target.value })} placeholder="What the design is about, in a few sentences." maxLength={5000} className={`${lineInput} resize-y text-sm`} />
          </div>
          <div>
            <FieldLabel htmlFor="d-details" hint="one per line">
              Details
            </FieldLabel>
            <textarea id="d-details" rows={4} value={x.details} onChange={(e) => set({ details: e.target.value })} placeholder={"e.g. Oversized drop-shoulder fit\nScreen-printed back graphic"} className={`${lineInput} resize-y text-sm`} />
            <p className="mt-1 text-[11px] text-[var(--text-3)]">{detailLines(x.details).length} line{detailLines(x.details).length === 1 ? "" : "s"} · shown as bullet points</p>
          </div>
          <div>
            <FieldLabel htmlFor="d-add" hint="optional">
              Additional information
            </FieldLabel>
            <textarea id="d-add" rows={2} value={x.addInfo} onChange={(e) => set({ addInfo: e.target.value })} placeholder="e.g. care instructions" maxLength={2000} className={`${lineInput} resize-y text-sm`} />
          </div>
          <div>
            <FieldLabel htmlFor="d-tags" hint="comma separated">
              Tags
            </FieldLabel>
            <input id="d-tags" value={x.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="anime, oversized" className={`${lineInput} text-sm`} />
          </div>
        </Section>

        <Section id="pricing" title="Pricing">
          <div className="grid gap-7 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="d-price">Price (₹)</FieldLabel>
              <input id="d-price" type="number" min="1" step="1" inputMode="numeric" value={x.price} onChange={(e) => set({ price: e.target.value })} placeholder="999" className={`${lineInput} font-mono text-xl`} />
            </div>
            <div>
              <FieldLabel htmlFor="d-disc" hint="0–90">
                Discount shown (%)
              </FieldLabel>
              <input id="d-disc" type="number" min="0" max="90" step="1" value={x.discount} onChange={(e) => set({ discount: e.target.value })} placeholder="0" className={`${lineInput} font-mono text-xl`} />
            </div>
            <div>
              <p className="label mb-2 text-[var(--text-3)]">MRP shown</p>
              <p className="border-b border-transparent pb-2 font-mono text-xl text-[var(--text-2)]">{price && discount > 0 ? rupees(mrpOf(price, discount)) : "—"}</p>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-3)]">Customers pay the price; the MRP and the discount are what the shop shows crossed out.</p>
        </Section>

        <Section id="organisation" title="Organisation">
          <div>
            <FieldLabel htmlFor="d-cat">Category</FieldLabel>
            <select id="d-cat" value={x.category} onChange={(e) => set({ category: e.target.value })} disabled={!taxonomy} className={`${lineInput} text-base`}>
              <option value="">{taxonomy ? "Choose a category" : "Loading…"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {x.category && x.category === draft.design.categoryId && <p className="mt-1 text-[11px] text-[var(--text-3)]">From the series chosen in step 1.</p>}
          </div>
          <div className="grid gap-7 sm:grid-cols-[1fr_10rem]">
            <div>
              <FieldLabel htmlFor="d-type">Product type</FieldLabel>
              <select id="d-type" value={x.productCategory} onChange={(e) => chooseType(e.target.value)} disabled={!taxonomy} className={`${lineInput} text-base`}>
                <option value="">{taxonomy ? "Choose a type" : "Loading…"}</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="d-weight" hint="grams">
                Weight
              </FieldLabel>
              <input id="d-weight" type="number" min="1" value={x.weight} onChange={(e) => set({ weight: e.target.value })} placeholder={weightOf(x.productCategory) ? String(weightOf(x.productCategory)) : "—"} className={`${lineInput} font-mono text-base`} />
            </div>
          </div>
        </Section>

        <Section id="sizes" title="Sizes">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sizes">
            {SIZES.map((s) => {
              const on = x.sizes.includes(s);
              return (
                <motion.button key={s} type="button" whileTap={{ scale: 0.94 }} transition={{ duration: 0.15, ease }} onClick={() => toggleSize(s)} aria-pressed={on} className={`h-11 min-w-[3.5rem] border px-3 font-mono text-sm transition-colors ${on ? "border-[var(--text)] bg-[var(--text)] text-[var(--ink)]" : "border-[var(--line-2)] text-[var(--text-2)] hover:border-[var(--text-3)] hover:text-[var(--text)]"}`}>
                  {s}
                </motion.button>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--text-3)]">Each colour × size gets a Qikink SKU in the next step; sizes without one won&apos;t be sold.</p>
        </Section>
      </div>
    </div>
  );

  // ---------- right: the shop card ----------
  const inspector = (
    <div className="space-y-4 p-6">
      <p className="label text-[var(--text-3)]">Shop preview</p>
      <ShopCard draft={draft} />
      <p className="text-[11px] text-[var(--text-3)]">Colour dots switch to that colour&apos;s main photo from step 5.</p>
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

export default DetailsStep;
