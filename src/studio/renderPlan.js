// What step 5 renders: one photo per model set × chosen angle × colour, with
// every print that angle takes (a front angle can carry chest and pocket).
// Each render records a signature of its inputs, so a changed box, colour or
// design file marks it as outdated.
import { ANGLES } from "./data/sample";
import { DEFAULT_PARAMS, placementKey } from "./placementStore";
import { colourOf, isDarkFabric } from "./palette";

export const renderId = (setId, angle, code) => `${setId}:${angle}:${code}`;

const fileFor = (draft, slot, colour) => {
  const files = draft.design.files;
  const hasDark = files.some((f) => f.slot === slot && f.variant === "dark");
  const dark = (draft.variantByColour[colour.code] ?? (isDarkFabric(colour.fabric) && hasDark ? "dark" : "main")) === "dark";
  return files.find((f) => f.slot === slot && f.variant === (dark ? "dark" : "normal")) ?? files.find((f) => f.slot === slot && f.variant === "normal") ?? files.find((f) => f.slot === slot);
};

/** [{ id, setId, angle, code, colour, src, prints, signature }] */
export const planRenders = (draft, modelSets) => {
  const slots = new Set(draft.design.files.map((f) => f.slot));
  const plan = [];
  for (const setId of draft.modelSetIds) {
    const set = modelSets.find((m) => m.id === setId);
    if (!set) continue;
    for (const angle of draft.anglesBySet[setId] ?? []) {
      const src = set.photos?.[angle];
      const takes = (ANGLES.find((a) => a.key === angle)?.takes ?? []).filter((s) => slots.has(s));
      if (!src || !takes.length) continue;
      for (const code of draft.colours) {
        const colour = colourOf(code);
        if (!colour) continue;
        const prints = takes
          .map((slot) => {
            const box = draft.placements[placementKey(setId, angle, slot)];
            const file = fileFor(draft, slot, colour);
            return box && file?.url
              ? { slot, design_url: file.url, quad: box.quad, fit: box.fit, anchor: box.anchor === "center" ? "center" : "top", params: { ...DEFAULT_PARAMS, ...box.params } }
              : null;
          })
          .filter(Boolean);
        if (!prints.length) continue;
        const body = { src, hex: colour.fabric, prints: prints.map(({ slot, ...p }) => p) }; // eslint-disable-line no-unused-vars
        plan.push({ id: renderId(setId, angle, code), setId, set, angle, code, colour, src, body, signature: JSON.stringify(body) });
      }
    }
  }
  return plan;
};
