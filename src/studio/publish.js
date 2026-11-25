// Step 8: turn a finished draft into the product editor's request body and
// publish it through the same admin endpoints (POST/PUT /products, then
// PATCH /products/:id/status). A product is live as soon as it is created;
// "publish hidden" archives it straight away so it can be switched on later.
import { admin } from "../dashboard/api";
import { ANGLES } from "./data/sample";
import { detailLines } from "./details";
import { skuReport } from "./skus";

const angleOrder = (a) => ANGLES.findIndex((x) => x.key === a);

/** Kept photos of one colour: the starred main photo first, then by model set and angle. */
export const photosFor = (draft, code) => {
  const main = draft.mainByColour[code];
  return Object.entries(draft.renders)
    .filter(([, r]) => r.code === code && r.status === "keep")
    .sort(([idA, a], [idB, b]) => {
      if (idA === main) return -1;
      if (idB === main) return 1;
      return draft.modelSetIds.indexOf(a.setId) - draft.modelSetIds.indexOf(b.setId) || angleOrder(a.angle) - angleOrder(b.angle);
    })
    .map(([, r]) => r.url);
};

/** The body the product editor would send, built from the draft. */
export const buildProduct = (draft) => {
  const x = draft.details;
  const { cells } = skuReport(draft);
  const sold = cells.filter((c) => c.sku && !c.problem);
  // only colours and sizes with at least one SKU: the rest couldn't be sold
  const colours = draft.colours.filter((code) => sold.some((c) => c.code === code));
  const sizes = x.sizes.filter((s) => sold.some((c) => c.size === s));
  const colorImages = colours.map((code) => ({ color: code, images: photosFor(draft, code) })).filter((c) => c.images.length);
  return {
    name: x.name.trim(),
    description: x.description.trim(),
    details: detailLines(x.details),
    addInfo: x.addInfo.trim(),
    category: x.category,
    productCategory: x.productCategory,
    price: Number(x.price),
    discountPercentage: Number(x.discount || 0),
    weight: x.weight === "" ? null : Number(x.weight),
    color: colours,
    size: sizes,
    skus: sold.map((c) => ({ colorSize: c.key, sku: c.sku })),
    image: colorImages[0]?.images[0] ?? "",
    addImages: [],
    colorImages,
    tags: x.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
};

/** Things worth knowing before publishing; none of them blocks it. */
export const publishWarnings = (draft, body) => {
  const warnings = [];
  const { cells } = skuReport(draft);
  const unsoldColours = draft.colours.filter((code) => !body.color.includes(code));
  if (unsoldColours.length) warnings.push(`${unsoldColours.length} colour${unsoldColours.length > 1 ? "s have" : " has"} no SKU and won't be listed`);
  const gaps = cells.filter((c) => !c.sku && body.color.includes(c.code) && body.size.includes(c.size));
  if (gaps.length) warnings.push(`${gaps.length} colour × size combination${gaps.length > 1 ? "s" : ""} without a SKU won't be sold`);
  const thin = body.colorImages.filter((c) => c.images.length === 1).length;
  if (thin) warnings.push(`${thin} colour${thin > 1 ? "s have" : " has"} only one photo`);
  return warnings;
};

/**
 * Creates (or, if this draft was published before, updates) the product,
 * then sets it live or hidden. `onStage` reports progress: "save" → "status".
 * @returns {Promise<{ id: string, slug: string | null, hidden: boolean }>}
 */
export const publishDraft = async (draft, { hidden }, onStage = () => {}) => {
  const body = buildProduct(draft);
  onStage("save");
  const existing = draft.published?.productId;
  const saved = existing ? await admin.put(`/products/${existing}`, body) : await admin.post("/products", body);
  onStage("status");
  await admin.patch(`/products/${saved.id}/status`, { status: hidden ? "ARCHIVED" : "ACTIVE" });
  return { id: saved.id, slug: saved.slug ?? null, hidden };
};
