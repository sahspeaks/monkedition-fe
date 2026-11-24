// The 8 steps, and the rule that unlocks "Next" on each (docs/STUDIO_PLAN.md §5).
import { Crosshair, FileText, Images, Palette, Rocket, ScanBarcode, Upload, Users } from "lucide-react";
import { ANGLES, plannedRenders } from "./data/sample";

const slotsOf = (d) => new Set(d.design.files.map((f) => f.slot));
const usedAnglesNeedingBox = (d) => {
  const slots = slotsOf(d);
  return d.modelSetIds.flatMap((setId) =>
    (d.anglesBySet[setId] ?? [])
      .filter((angle) => ANGLES.find((a) => a.key === angle).takes.some((s) => slots.has(s)))
      .map((angle) => `${setId}:${angle}`),
  );
};

export const boxesToSet = usedAnglesNeedingBox;

export const STEPS = [
  {
    key: "design",
    label: "Design",
    icon: Upload,
    title: "Drop in the artwork",
    subtitle: "Upload the print files. FR, BK and LP are sorted by file name.",
    missing: (d) => (!d.design.name.trim() ? "Name the design" : !d.design.files.length ? "Add at least one print file" : null),
  },
  {
    key: "models",
    label: "Models",
    icon: Users,
    title: "Cast your models",
    subtitle: "Pick model sets from the library, or create a new one.",
    missing: (d) =>
      !d.modelSetIds.length ? "Pick at least one model set" : !usedAnglesNeedingBox(d).length ? "Choose an angle that can take one of the designs" : null,
  },
  {
    key: "colours",
    label: "Colours",
    icon: Palette,
    title: "Choose the colourways",
    subtitle: "Every colour is made from the same photo, so one box fits all.",
    missing: (d) => (!d.colours.length ? "Choose at least one colour" : null),
  },
  {
    key: "placement",
    label: "Placement",
    icon: Crosshair,
    title: "Place the print",
    subtitle: "Set the box once per angle. It is saved for every colour and future product.",
    missing: (d) => {
      const left = usedAnglesNeedingBox(d).filter((k) => !d.boxes[k]).length;
      return left ? `${left} angle${left > 1 ? "s" : ""} still need a box` : null;
    },
  },
  {
    key: "review",
    label: "Review",
    icon: Images,
    title: "Review the shots",
    subtitle: "Keep the best, star a main image for every colour.",
    missing: (d) => {
      const renders = plannedRenders(d);
      const bad = d.colours.filter(
        (code) => !renders.some((r) => r.code === code && d.review[r.id] !== "reject") || !d.mainByColour[code],
      );
      return bad.length ? `Star a main image for ${bad.length} colour${bad.length > 1 ? "s" : ""}` : null;
    },
  },
  {
    key: "details",
    label: "Details",
    icon: FileText,
    title: "Describe the product",
    subtitle: "What customers will read in the shop.",
    missing: (d) => {
      const x = d.details;
      if (!x.name.trim()) return "Add a product name";
      if (!x.category) return "Choose a category";
      if (!(Number(x.price) > 0)) return "Set a price";
      if (!x.details.trim()) return "Add at least one detail line";
      if (!x.sizes.length) return "Choose at least one size";
      return null;
    },
  },
  {
    key: "skus",
    label: "SKUs",
    icon: ScanBarcode,
    title: "Link Qikink SKUs",
    subtitle: "Each colour and size needs the SKU Qikink prints from.",
    missing: (d) => {
      const values = Object.values(d.skus).map((v) => v.trim()).filter(Boolean);
      if (!values.length) return "Add at least one SKU";
      if (new Set(values).size !== values.length) return "Two cells share the same SKU";
      return null;
    },
  },
  {
    key: "publish",
    label: "Publish",
    icon: Rocket,
    title: "Ready to launch",
    subtitle: "Check the summary, then publish to the shop.",
    missing: (d) => (d.published ? null : "Publish or save as a draft"),
  },
];

export const stepIndex = (key) => STEPS.findIndex((s) => s.key === key);

/** A step can be opened when every step before it is done. */
export const firstBlocked = (draft) => STEPS.findIndex((s) => s.missing(draft));
export const isReachable = (draft, index) => {
  const blocked = firstBlocked(draft);
  return blocked === -1 || index <= blocked;
};
