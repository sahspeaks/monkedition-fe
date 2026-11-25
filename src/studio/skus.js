// Qikink SKUs for step 7: one per colour × size (the shop's variant key is
// "<colour code>-<size>", e.g. "Bk-M"). A cell left empty is not sold. Rules
// follow the backend's product body (1–64 characters); within one product
// every variant needs its own SKU. Different products may share a SKU.
import { colourOf } from "./palette";

export const SKU_MAX = 64;
export const SKU_CHARS = /^[A-Za-z0-9._/-]+$/;

export const variantKey = (code, size) => `${code}-${size}`;

/** The pattern's tokens, with what each becomes for a colour and size. */
export const TOKENS = [
  { token: "{CODE}", label: "Colour code, capitals", value: (c) => c.code.toUpperCase() },
  { token: "{code}", label: "Colour code, as in the shop", value: (c) => c.code },
  { token: "{colour}", label: "Colour name", value: (c) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
  { token: "{size}", label: "Size", value: (_, size) => size },
];

export const applyPattern = (pattern, code, size) => {
  const colour = colourOf(code) ?? { code, name: code };
  return TOKENS.reduce((out, t) => out.replaceAll(t.token, t.value(colour, size)), pattern).trim();
};

/** A starting pattern from the product type's initials, e.g. "Oversized T-shirt" → "OTS-{CODE}-{size}". */
export const defaultPattern = (typeName) => {
  const initials = String(typeName ?? "")
    .split(/[\s-]+/)
    .map((w) => w[0])
    .filter((ch) => ch && /[a-z0-9]/i.test(ch))
    .join("")
    .toUpperCase();
  return `${initials || "SKU"}-{CODE}-{size}`;
};

// patterns remembered per product type, in this browser
const KEY = "monk-studio-sku-patterns";
export const rememberedPattern = (typeId) => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}")[typeId] ?? null;
  } catch {
    return null;
  }
};
export const rememberPattern = (typeId, pattern) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    localStorage.setItem(KEY, JSON.stringify({ ...all, [typeId]: pattern }));
  } catch {
    /* storage blocked: nothing to remember */
  }
};

/** The cells this product sells, and what's wrong with each. */
export const skuReport = (draft) => {
  const sizes = draft.details?.sizes ?? [];
  const cells = draft.colours.flatMap((code) => sizes.map((size) => ({ code, size, key: variantKey(code, size), sku: (draft.skus?.[variantKey(code, size)] ?? "").trim() })));
  const counts = {};
  cells.forEach((c) => c.sku && (counts[c.sku.toUpperCase()] = (counts[c.sku.toUpperCase()] ?? 0) + 1));
  const problemOf = (sku) => {
    if (!sku) return null;
    if (sku.length > SKU_MAX) return `Longer than ${SKU_MAX} characters`;
    if (!SKU_CHARS.test(sku)) return "Use letters, numbers and . _ / - only";
    if (counts[sku.toUpperCase()] > 1) return "Used by another colour or size of this product";
    return null;
  };
  const withProblems = cells.map((c) => ({ ...c, problem: problemOf(c.sku) }));
  return {
    cells: withProblems,
    filled: withProblems.filter((c) => c.sku).length,
    problems: withProblems.filter((c) => c.problem),
  };
};

export const skusMissing = (draft) => {
  const { cells, filled, problems } = skuReport(draft);
  if (!cells.length) return "Choose colours and sizes first";
  if (problems.length) return `${problems.length} SKU${problems.length > 1 ? "s" : ""} to fix`;
  if (!filled) return "Add the Qikink SKU for at least one variant";
  return null;
};
