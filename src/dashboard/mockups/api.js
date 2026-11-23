// Calls to the mockups service (monkedition-mockups), a separate API that puts
// print designs onto garment photos. It accepts the same staff token as the
// store API, so requests go through authFetch for the refresh-on-401 logic.
import { ApiError, authFetch } from "../../api/client";

const ROOT = (import.meta.env.VITE_MOCKUPS_API_URL ?? "").replace(/\/+$/, "");
const BASE = `${ROOT}/api/v1`;

/** FastAPI errors: { detail: "text" } or { detail: [{ loc, msg }] } for validation. */
const messageOf = (data) => {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(({ loc = [], msg }) => [loc.slice(1).join("."), msg].filter(Boolean).join(": ")).join("; ");
  }
  return "Something went wrong. Please try again.";
};

const call = async (path, { method = "GET", json, form, as = "json" } = {}) => {
  if (!ROOT) throw new ApiError("The mockup tool is not set up: add VITE_MOCKUPS_API_URL to the frontend .env.");
  let response;
  try {
    response = await authFetch(`${BASE}${path}`, {
      method,
      ...(json !== undefined && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) }),
      ...(form && { body: form }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Can't reach the mockup service. Check that it is running.");
  }
  if (!response.ok) {
    throw new ApiError(messageOf(await response.json().catch(() => null)), { status: response.status });
  }
  if (response.status === 204) return null;
  return as === "blob" ? response.blob() : response.json();
};

const formOf = (name, files) => {
  const form = new FormData();
  files.forEach((file) => form.append(name, file));
  return form;
};

export const mockupsApi = {
  /** @returns {Promise<{ id, name, width, height, quad_front, quad_back }>} */
  uploadPhoto: (file) => call("/mockups", { method: "POST", form: formOf("file", [file]) }),
  photo: (id) => call(`/mockups/${id}/image`, { as: "blob" }),
  /** @returns {Promise<Array<{ id, name, width, height, code, default_preset } | { name, error }>>} */
  uploadDesigns: (files) => call("/designs", { method: "POST", form: formOf("files", files) }),
  presets: () => call("/presets"),
  presetQuad: (presetId, body) => call(`/presets/${presetId}/quad`, { method: "POST", json: body }),
  savePreset: (body) => call("/presets", { method: "POST", json: body }),
  deletePreset: (presetId) => call(`/presets/${presetId}`, { method: "DELETE" }),
  render: (body) => call("/render", { method: "POST", json: body, as: "blob" }),
  startBulk: (body) => call("/bulk", { method: "POST", json: body }),
  bulkStatus: (jobId) => call(`/bulk/${jobId}`),
  bulkZip: (jobId) => call(`/bulk/${jobId}/zip`, { as: "blob" }),
};

/** Saves a Blob as a file. */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
