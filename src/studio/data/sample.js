// Sample data for the Studio prototype (phase 0b). Nothing here is saved; the
// real data comes from the backend's studio module in phase 4.

/** Angles a model set can have (mirrors monkedition-mockups/studio/catalog.py). */
export const ANGLES = [
  { key: "front", label: "Front", takes: ["FR", "LP"] },
  { key: "front_45", label: "Front 45°", takes: ["FR", "LP"] },
  { key: "side", label: "Side", takes: [] },
  { key: "back", label: "Back", takes: ["BK"] },
  { key: "rear_45", label: "Rear 45°", takes: ["BK"] },
  { key: "closeup", label: "Chest close-up", takes: ["FR", "LP"] },
];
export const angleLabel = (key) => ANGLES.find((a) => a.key === key)?.label ?? key;
export const MIN_ANGLES = 5;

/** The shop's palette (monkedition-be/src/modules/catalog/domain/colours.js). */
export const PALETTE = [
  { code: "Bk", name: "Black", hex: "#111113", group: "Darks" },
  { code: "Cm", name: "Charcoal Melange", hex: "#4b5563", group: "Darks" },
  { code: "Nb", name: "Navy Blue", hex: "#1e2a5a", group: "Darks" },
  { code: "pb", name: "Petrol Blue", hex: "#0c5678", group: "Darks" },
  { code: "Gn", name: "Bottle Green", hex: "#065f46", group: "Darks" },
  { code: "OG", name: "Olive Green", hex: "#3d550c", group: "Darks" },
  { code: "Mn", name: "Maroon", hex: "#7f1d1d", group: "Darks" },
  { code: "bn", name: "Brown", hex: "#431407", group: "Darks" },
  { code: "Wh", name: "White", hex: "#f4f4f2", group: "Lights" },
  { code: "Gm", name: "Grey Melange", hex: "#d1d5db", group: "Lights" },
  { code: "BB", name: "Baby Blue", hex: "#87ceeb", group: "Lights" },
  { code: "Lv", name: "Lavender", hex: "#e9d5ff", group: "Lights" },
  { code: "Mnt", name: "Mint", hex: "#bbf7d0", group: "Lights" },
  { code: "LBp", name: "Light Baby Pink", hex: "#fbcfe8", group: "Lights" },
  { code: "Be", name: "Beige", hex: "#fef3c7", group: "Lights" },
  { code: "Ph", name: "Peach", hex: "#fed7aa", group: "Lights" },
  { code: "Rd", name: "Red", hex: "#ef4444", group: "Brights" },
  { code: "Rb", name: "Royal Blue", hex: "#2563eb", group: "Brights" },
  { code: "MYI", name: "Mustard Yellow", hex: "#ca8a04", group: "Brights" },
  { code: "or", name: "Orange", hex: "#f97316", group: "Brights" },
  { code: "Pu", name: "Purple", hex: "#a855f7", group: "Brights" },
  { code: "Cor", name: "Coral", hex: "#f08080", group: "Brights" },
  { code: "Fl", name: "Flamingo", hex: "#ec4899", group: "Brights" },
  { code: "Jd", name: "Jade", hex: "#34d399", group: "Brights" },
];
export const colourOf = (code) => PALETTE.find((c) => c.code === code);
export const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
};

export const MODEL_SETS = [
  { id: "ms1", name: "Arjun · studio grey", gender: "Men", source: "Generated", skin: "#b07a55", hair: "#1b1410", angles: ["front", "front_45", "side", "back", "rear_45", "closeup"], boxes: ["front", "back", "rear_45"] },
  { id: "ms2", name: "Kabir · street", gender: "Men", source: "Generated", skin: "#8d5a3b", hair: "#120d0a", angles: ["front", "front_45", "side", "back", "rear_45"], boxes: ["front", "front_45", "back", "rear_45"] },
  { id: "ms3", name: "Rohan · photoshoot", gender: "Men", source: "Uploaded", skin: "#c48b62", hair: "#2a1d14", angles: ["front", "side", "back", "rear_45", "closeup"], boxes: [] },
  { id: "ms4", name: "Meera · studio grey", gender: "Women", source: "Generated", skin: "#b5805c", hair: "#1a1210", angles: ["front", "front_45", "side", "back", "rear_45", "closeup"], boxes: ["front", "back"] },
  { id: "ms5", name: "Anaya · soft light", gender: "Women", source: "Generated", skin: "#9c6646", hair: "#0f0b09", angles: ["front", "front_45", "side", "back", "rear_45", "closeup"], boxes: [] },
  { id: "ms6", name: "Isha · photoshoot", gender: "Women", source: "Uploaded", skin: "#d39a72", hair: "#3a2618", angles: ["front", "front_45", "back", "rear_45", "side"], boxes: ["front"] },
];
export const modelSetOf = (id) => MODEL_SETS.find((m) => m.id === id);

export const CATEGORIES = ["Anime › Attack on Titan", "Anime › Jujutsu Kaisen", "Floral", "Superheroes"];
export const PRODUCT_TYPES = ["Oversized T-shirt"];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

let draftSeq = 3;
export const newDraft = () => ({
  id: `d${++draftSeq}`,
  name: "Untitled product",
  updatedAt: Date.now(),
  design: { name: "", series: "", notes: "", files: [] },
  modelSetIds: [],
  anglesBySet: {}, // setId -> angle keys used for this product
  colours: [],
  boxes: {}, // `${setId}:${angle}` -> true once saved
  review: {}, // imageId -> "keep" | "reject"
  mainByColour: {}, // colour code -> imageId
  details: { name: "", description: "", details: "", addInfo: "", tags: "", category: "", type: PRODUCT_TYPES[0], price: "", discount: "", weight: "", sizes: ["S", "M", "L", "XL"] },
  skuPattern: "OVT-{colourCode}-{size}",
  skus: {}, // `${code}-${size}` -> sku
  published: false,
});

/** A draft part-way through, so the prototype can show later steps filled in. */
const sampleDraft = () => {
  const d = newDraft();
  d.id = "d1";
  d.name = "Attack on Titan · D1";
  d.updatedAt = Date.now() - 1000 * 60 * 42;
  d.design = {
    name: "Eren Yeager",
    series: "Attack on Titan",
    notes: "",
    files: [
      { id: "f1", slot: "FR", variant: "normal", name: "FR.png", width: 3600, height: 4200, sizeMB: 0.5, transparent: true },
      { id: "f2", slot: "BK", variant: "normal", name: "BK.png", width: 4200, height: 5400, sizeMB: 6.3, transparent: true },
      { id: "f3", slot: "BK", variant: "dark", name: "BK-[BK].png", width: 4200, height: 5400, sizeMB: 6.1, transparent: true },
    ],
  };
  d.modelSetIds = ["ms1", "ms4"];
  d.anglesBySet = { ms1: ["front", "front_45", "back", "rear_45", "closeup"], ms4: ["front", "back", "rear_45"] };
  d.colours = ["Bk", "BB", "Mn", "Wh"];
  d.boxes = { "ms1:front": true, "ms1:back": true, "ms1:rear_45": true, "ms4:front": true, "ms4:back": true };
  return d;
};

export const SAMPLE_DRAFTS = [
  sampleDraft(),
  { ...newDraft(), id: "d2", name: "Jujutsu Kaisen · D3", updatedAt: Date.now() - 1000 * 60 * 60 * 26, design: { name: "Gojo", series: "Jujutsu Kaisen", notes: "", files: [{ id: "g1", slot: "FR", variant: "normal", name: "FR.png", width: 3000, height: 3500, sizeMB: 0.8, transparent: true }] } },
  { ...newDraft(), id: "d3", name: "Floral · D2", updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4 },
];

/** Every image the render step would make: model set × used angle that takes a design × colour. */
export const plannedRenders = (draft) => {
  const slots = new Set(draft.design.files.map((f) => f.slot));
  const out = [];
  for (const setId of draft.modelSetIds) {
    for (const angle of draft.anglesBySet[setId] ?? []) {
      const takes = ANGLES.find((a) => a.key === angle).takes.filter((s) => slots.has(s));
      if (!takes.length) continue;
      for (const code of draft.colours) out.push({ id: `${setId}:${angle}:${code}`, setId, angle, code, slot: takes[0] });
    }
  }
  return out;
};
