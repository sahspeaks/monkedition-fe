// Product details rules, shared by step 6 (the form) and steps.js (Next).
// They match the product editor and the backend's product body: name, a
// description, at least one detail line, a category, a product type, a price
// above zero, a discount of 0–90 % and at least one size.

export const detailLines = (text) =>
  String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** The MRP the shop shows, as the backend works it out (legacy Product model). */
export const mrpOf = (price, discount) => {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (!p || d <= 0 || d >= 100) return p;
  return Math.round(((p * 100) / (100 - d)) * 100) / 100;
};

export const EMPTY_DETAILS = () => ({
  seeded: false,
  name: "",
  description: "",
  details: "",
  addInfo: "",
  tags: "",
  category: "",
  productCategory: "",
  price: "",
  discount: "0",
  weight: "",
  sizes: ["S", "M", "L", "XL", "2XL"],
});

export const DETAIL_RULES = [
  { key: "name", section: "basics", label: "Name", missing: (x) => !x.name.trim() && "Add a product name" },
  { key: "description", section: "basics", label: "Description", missing: (x) => !x.description.trim() && "Add a description" },
  { key: "details", section: "basics", label: "At least one detail", missing: (x) => !detailLines(x.details).length && "Add at least one detail line" },
  { key: "price", section: "pricing", label: "Price", missing: (x) => !(Number(x.price) > 0) && "Set a price" },
  {
    key: "discount",
    section: "pricing",
    label: "Discount 0–90 %",
    missing: (x) => {
      const d = Number(x.discount || 0);
      return (!(d >= 0) || d > 90) && "The discount must be between 0 and 90 %";
    },
  },
  { key: "category", section: "organisation", label: "Category", missing: (x) => !x.category && "Choose a category" },
  { key: "type", section: "organisation", label: "Product type", missing: (x) => !x.productCategory && "Choose a product type" },
  { key: "sizes", section: "sizes", label: "At least one size", missing: (x) => !x.sizes?.length && "Choose at least one size" },
];

/** The first thing missing, or null. */
export const detailsMissing = (x) => {
  for (const rule of DETAIL_RULES) {
    const why = rule.missing(x);
    if (why) return why;
  }
  return null;
};
