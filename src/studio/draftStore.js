// Drafts for the prototype, kept in this browser's localStorage so the list
// survives a refresh. In phase 4 they come from the backend (studioDrafts).
import { STEPS } from "./steps";
import { EMPTY_DETAILS } from "./details";

const KEY = "monk-studio-drafts";

/** Steps with a real screen use their own rule (steps.js); the rest use "Mark as done". */
export const BUILT_STEPS = new Set(["design", "models", "colours", "placement", "review", "details", "skus"]);

const emptyDesign = () => ({ name: "", categoryId: null, series: "", categoryPath: "", files: [] });

const normalise = (d) => ({
  ...d,
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
});

export const loadDrafts = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((d) => d && d.id).map(normalise) : [];
  } catch {
    return [];
  }
};

export const saveDrafts = (drafts) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false; // storage blocked or full: drafts live in memory only
  }
};

export const newDraft = () => {
  const now = Date.now();
  return { id: Math.random().toString(36).slice(2, 10), name: "Untitled product", doneSteps: [], design: emptyDesign(), modelSetIds: [], anglesBySet: {}, colours: [], variantByColour: {}, placements: {}, renders: {}, mainByColour: {}, details: EMPTY_DETAILS(), skus: {}, skuPattern: "", createdAt: now, updatedAt: now };
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
