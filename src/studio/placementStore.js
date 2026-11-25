// Saved print boxes: one per model set × angle × slot, shared by every product
// that uses the set (GET/PUT /api/v2/admin/studio/placements). Boxes are
// fractions of the photo: (TL, TR, BR, BL), each [x, y] in 0..1.
import { admin } from "../dashboard/api";
import { mockupsApi } from "../dashboard/mockups/api";

export const placementKey = (setId, angle, slot) => `${setId}:${angle}:${slot}`;

export const DEFAULT_PARAMS = { fold: 0.9, shadow: 1.1, opacity: 0.95, mask: 1 };

export const fetchPlacements = async (setIds) => {
  if (!setIds.length) return [];
  const { items } = await admin.get(`/studio/placements?sets=${encodeURIComponent(setIds.join(","))}`);
  return items ?? [];
};

export const savePlacement = (placement) => admin.put("/studio/placements", placement);

// ---- design files for the live preview ---------------------------------------
// The mockups service composites a design it holds in memory; uploads expire
// after a while, so an id is re-uploaded when the service no longer knows it.
const designIds = new Map(); // file id + content -> mockups design id

const fileFromDataUrl = async (dataUrl, name) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name.replace(/\.[^.]+$/, "") + (blob.type === "image/png" ? ".png" : ".webp"), { type: blob.type });
};

export const designIdFor = async (file, { fresh = false } = {}) => {
  const key = `${file.id}:${file.thumb.length}`;
  if (!fresh && designIds.has(key)) return designIds.get(key);
  const [uploaded] = await mockupsApi.uploadDesigns([await fileFromDataUrl(file.thumb, file.name)]);
  if (!uploaded?.id) throw new Error(uploaded?.error ?? `${file.name}: the preview service couldn't read it`);
  designIds.set(key, uploaded.id);
  return uploaded.id;
};

/** Renders, re-uploading the design once if the preview service has forgotten it. */
export const renderPreview = async ({ file, ...body }) => {
  // uploaded designs are read from Cloudinary at full quality
  if (file.url) return mockupsApi.studioRender({ ...body, design_url: file.url });
  try {
    return await mockupsApi.studioRender({ ...body, design_id: await designIdFor(file) });
  } catch (err) {
    if (err?.status !== 404) throw err;
    return mockupsApi.studioRender({ ...body, design_id: await designIdFor(file, { fresh: true }) });
  }
};
