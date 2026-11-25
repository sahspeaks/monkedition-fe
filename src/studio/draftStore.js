// Studio drafts live in the backend, shared by all staff
// (GET/PUT/DELETE /api/v2/admin/studio/drafts). Each save carries the version
// it started from, so two people can't silently overwrite each other.
// Drafts made before this lived in the browser's localStorage; they are
// imported once (see useDrafts.js).
import { admin } from "../dashboard/api";
import { STEPS } from "./steps";
import { EMPTY_DETAILS } from "./details";

/** Steps with a real screen use their own rule (steps.js); the rest use "Mark as done". */
export const BUILT_STEPS = new Set(["design", "models", "colours", "placement", "review", "details", "skus", "publish"]);

const emptyDesign = () => ({ name: "", categoryId: null, series: "", categoryPath: "", files: [] });

export const normalise = (d) => ({
  ...d,
  name: typeof d.name === "string" && d.name ? d.name : "Untitled product",
  doneSteps: Array.isArray(d.doneSteps) ? d.doneSteps : [],
  design: { ...emptyDesign(), ...d.design },
  modelSetIds: Array.isArray(d.modelSetIds) ? d.modelSetIds : [],
  anglesBySet: d.anglesBySet && typeof d.anglesBySet === "object" ? d.anglesBySet : {},
  colours: Array.isArray(d.colours) ? d.colours : [],
  variantByColour: d.variantByColour && typeof d.variantByColour === "object" ? d.variantByColour : {},
  placements: d.placements && typeof d.placements === "object" ? d.placements : {},
  renders: d.renders && typeof d.renders === "object" ? d.renders : {},
  mainByColour: d.mainByColour && typeof d.mainByColour === "object" ? d.mainByColour : {},
  // older drafts kept sample details from the prototype: start them fresh
  details: d.details && "discount" in d.details && typeof d.details.seeded === "boolean" ? { ...EMPTY_DETAILS(), ...d.details } : EMPTY_DETAILS(),
  skus: d.skus && typeof d.skus === "object" ? d.skus : {},
  skuPattern: typeof d.skuPattern === "string" ? d.skuPattern : "",
  // the prototype stored `published: true`; only a real product id counts
  published: d.published?.productId ? d.published : null,
  createdAt: d.createdAt ?? Date.now(),
  updatedAt: d.updatedAt ?? Date.now(),
});

export const newDraft = () => {
  const now = Date.now();
  return normalise({ id: Math.random().toString(36).slice(2, 10), name: "Untitled product", createdAt: now, updatedAt: now });
};

export const stepDone = (draft, i) => {
  const step = STEPS[i];
  return BUILT_STEPS.has(step.key) ? !step.missing(draft) : draft.doneSteps.includes(step.key);
};

/** The step a draft should open on: the first one not done (the last if all are). */
export const resumeStep = (draft) => {
  const i = STEPS.findIndex((_, j) => !stepDone(draft, j));
  return STEPS[i === -1 ? STEPS.length - 1 : i];
};

export const doneCount = (draft) => STEPS.filter((_, i) => stepDone(draft, i)).length;

// ---- server ------------------------------------------------------------------

/** A small preview from Cloudinary (resized on their side) instead of an embedded image. */
const cloudThumb = (url) => (url.includes("res.cloudinary.com/") && !url.includes("/upload/w_") ? url.replace("/upload/", "/upload/w_480,c_limit,f_auto,q_auto/") : url);

/**
 * What gets stored: the draft without embedded images. Design previews made
 * in the browser (data: URLs, ~100 kB each) become Cloudinary preview links;
 * a file that never uploaded keeps no preview (step 1 asks to replace it).
 */
export const forServer = (draft) => {
  const { id, ...data } = draft; // eslint-disable-line no-unused-vars
  return {
    ...data,
    design: {
      ...data.design,
      files: data.design.files.map((f) => ({ ...f, thumb: f.url ? cloudThumb(f.url) : f.thumb?.startsWith("data:") ? "" : (f.thumb ?? "") })),
    },
  };
};

/** [{ draft, version }] */
export const fetchDrafts = async () => {
  const { items } = await admin.get("/studio/drafts");
  return (items ?? []).map((item) => ({ draft: normalise({ ...item.data, id: item.id }), version: item.version }));
};

/** Saves; resolves to the new version. A 409 means someone else saved first (err.body.errors = their draft). */
export const putDraft = async (draft, version) => (await admin.put(`/studio/drafts/${draft.id}`, { version, data: forServer(draft) })).version;

export const removeDraft = (id) => admin.delete(`/studio/drafts/${id}`);

// ---- the old browser copy, read once to import --------------------------------

const LOCAL_KEY = "monk-studio-drafts";

export const readLocalDrafts = () => {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((d) => d && d.id).map(normalise) : [];
  } catch {
    return [];
  }
};

/** Keeps only the drafts that failed to import (or clears the key). */
export const keepLocalDrafts = (drafts) => {
  try {
    if (drafts.length) localStorage.setItem(LOCAL_KEY, JSON.stringify(drafts));
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* storage blocked */
  }
};
