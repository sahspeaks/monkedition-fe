// Step 6: the product form, with a live shop card in the inspector.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Workspace from "../ui/Workspace";
import ModelFigure from "../ui/ModelFigure";
import { Chip, Label, SelectInput, TextArea, TextInput } from "../ui/primitives";
import { CATEGORIES, PRODUCT_TYPES, SIZES, colourOf, plannedRenders } from "../data/sample";
import { useStudio } from "../context";
import { StageHeader, Stagger, StaggerItem } from "./common";

const rupees = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const ShopCard = ({ draft }) => {
  const { modelSets } = useStudio();
  const [code, setCode] = useState(draft.colours[0]);
  const x = draft.details;
  const price = Number(x.price) || 0;
  const discount = Number(x.discount) || 0;
  const mrp = discount > 0 && discount < 100 ? price / (1 - discount / 100) : 0;
  const mainId = draft.mainByColour[code];
  const main = plannedRenders(draft).find((r) => r.id === mainId) ?? plannedRenders(draft).find((r) => r.code === code);
  const set = main && modelSets.find((m) => m.id === main.setId);
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f8f4ee] text-[#2a2420] shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div key={code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {main ? (
            <ModelFigure angle={main.angle} tee={colourOf(code).hex} skin={set?.skin} hair={set?.hair} print={main.slot} className="aspect-[4/5] w-full" />
          ) : (
            <div className="aspect-[4/5] bg-[#e4ded4]" />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="space-y-2 p-4">
        <p className="line-clamp-2 font-semibold leading-snug">{x.name || "Product name"}</p>
        <p className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{price ? rupees(price) : "₹—"}</span>
          {mrp > 0 && <span className="text-sm text-[#635b52] line-through">{rupees(mrp)}</span>}
          {discount > 0 && <span className="text-sm font-semibold text-[#cf5c25]">{discount}% off</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {draft.colours.map((c) => (
            <button key={c} type="button" onClick={() => setCode(c)} aria-label={colourOf(c).name} className={`h-5 w-5 rounded-full border ${c === code ? "ring-2 ring-[#2a2420] ring-offset-1" : "border-black/10"}`} style={{ background: colourOf(c).hex }} />
          ))}
        </div>
        <p className="text-xs text-[#635b52]">{x.sizes.join(" · ") || "No sizes"}</p>
      </div>
    </div>
  );
};

const DetailsStep = ({ draft, update, step, index }) => {
  const x = draft.details;
  const set = (patch) => update((d) => ({ ...d, details: { ...d.details, ...patch } }));
  const [suggested, setSuggested] = useState([]);

  // first visit: suggest values from the design
  useEffect(() => {
    if (x.name || x.tags) return;
    const name = [draft.design.series, draft.design.name].filter(Boolean).join(" · ") + " Oversized Tee";
    set({ name, tags: [draft.design.series, "oversized", "anime"].filter(Boolean).join(", "), details: "100% cotton, 240 GSM\nOversized drop-shoulder fit\nPrinted in India" });
    setSuggested(["name", "tags", "details"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tag = (field) => suggested.includes(field) && <Chip tone="accent"><Sparkles className="h-3 w-3" /> suggested</Chip>;
  const edit = (field) => (e) => {
    setSuggested((s) => s.filter((f) => f !== field));
    set({ [field]: e.target.value });
  };

  const price = Number(x.price) || 0;
  const discount = Number(x.discount) || 0;

  const stage = (
    <>
      <StageHeader step={step} index={index} />
      <Stagger className="grid max-w-3xl gap-5">
        <StaggerItem className="glass space-y-4 rounded-2xl p-5">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-white">Basics</h3>{tag("name")}</div>
          <TextInput label="Name" value={x.name} onChange={edit("name")} error={!x.name.trim() ? "Required" : undefined} />
          <TextArea label="Description" placeholder="What makes this design special" value={x.description} onChange={edit("description")} />
          <TextArea label="Details" hint="one per line" value={x.details} onChange={edit("details")} />
          <TextInput label="Additional information" value={x.addInfo} onChange={edit("addInfo")} />
          <TextInput label="Tags" hint="comma separated" value={x.tags} onChange={edit("tags")} />
        </StaggerItem>
        <StaggerItem className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-3">
          <h3 className="font-semibold text-white md:col-span-3">Pricing</h3>
          <TextInput label="Price (₹)" type="number" min="0" value={x.price} onChange={edit("price")} />
          <TextInput label="Discount shown (%)" type="number" min="0" max="90" value={x.discount} onChange={edit("discount")} />
          <div>
            <Label>MRP shown</Label>
            <p className="rounded-xl border border-white/[0.06] px-3.5 py-2.5 font-mono text-sm text-white">{discount > 0 && price ? rupees(price / (1 - discount / 100)) : "—"}</p>
          </div>
        </StaggerItem>
        <StaggerItem className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-2">
          <h3 className="font-semibold text-white md:col-span-2">Organisation</h3>
          <SelectInput label="Category" value={x.category} onChange={edit("category")}>
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </SelectInput>
          <SelectInput label="Product type" value={x.type} onChange={edit("type")}>
            {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </SelectInput>
          <TextInput label="Weight (grams)" type="number" value={x.weight} onChange={edit("weight")} />
        </StaggerItem>
        <StaggerItem className="glass rounded-2xl p-5">
          <h3 className="mb-3 font-semibold text-white">Sizes</h3>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => {
              const on = x.sizes.includes(s);
              return (
                <motion.button key={s} type="button" whileTap={{ scale: 0.92 }} onClick={() => set({ sizes: on ? x.sizes.filter((v) => v !== s) : SIZES.filter((v) => v === s || x.sizes.includes(v)) })} aria-pressed={on} className={`h-11 min-w-[3.5rem] rounded-xl border px-3 font-mono text-sm ${on ? "border-transparent bg-aurora text-white" : "border-white/10 text-[var(--text-2)] hover:border-white/30"}`}>
                  {s}
                </motion.button>
              );
            })}
          </div>
        </StaggerItem>
      </Stagger>
    </>
  );

  return <Workspace stage={stage} inspector={<ShopCard draft={draft} />} inspectorTitle="Shop preview" />;
};

export default DetailsStep;
