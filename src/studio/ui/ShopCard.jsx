// How the product will look in the shop's grid, from the step 5 photos.
// Styled like the storefront (light, Inter), whatever Studio's theme.
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colourOf } from "../palette";
import { mrpOf } from "../details";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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

export default ShopCard;
