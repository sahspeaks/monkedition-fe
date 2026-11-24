// The model library = the sets that ship with Studio (BUILTIN_SETS, photos in
// public/) + the sets staff saved, stored in the backend's database
// (GET/POST/DELETE /api/v2/admin/studio/model-sets) with photos on Cloudinary.
import { admin, uploadImage } from "../dashboard/api";

/**
 * @typedef {object} ModelSet
 * @property {string} id
 * @property {string} name
 * @property {"Men"|"Women"} gender
 * @property {"Generated"|"Uploaded"} source
 * @property {string[]} angles   angle keys the set has
 * @property {string[]} boxes    angles whose print box is already saved
 * @property {Record<string,string>} photos  angle → image URL
 * @property {boolean} [builtin] ships with Studio; can't be deleted
 */

/**
 * Pre-loaded model sets: photos in public/studio/models/<id>/<angle>.webp
 * (1200×1500, 4:5). To add one, drop its photos in a new folder and add an
 * entry here.
 */
const photo = (id, file) => `/studio/models/${id}/${file}.webp`;
export const BUILTIN_SETS = [
  {
    id: "men-01",
    name: "Men 01 · studio grey",
    gender: "Men",
    source: "Generated",
    builtin: true,
    // no straight front shot yet: drop front.webp in the folder and add "front" here
    angles: ["front_45", "side", "back", "rear_45", "closeup"],
    boxes: [],
    photos: {
      front_45: photo("men-01", "front-45"),
      side: photo("men-01", "side"),
      back: photo("men-01", "back"),
      rear_45: photo("men-01", "rear-45"),
      closeup: photo("men-01", "closeup"),
    },
  },
];

export const fetchModelSets = async () => (await admin.get("/studio/model-sets")).items ?? [];
export const deleteModelSet = (id) => admin.delete(`/studio/model-sets/${id}`);

/** Every photo the library shows is 1200×1500 (4:5), cropped to the centre. */
const W = 1200;
const H = 1500;
export const toLibraryPhoto = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(W / img.width, H / img.height);
      const sw = W / scale;
      const sh = H / scale;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      canvas.getContext("2d").drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error(`${file.name}: could not be prepared`));
          // browsers without a WebP encoder hand back PNG; name the file to match
          const ext = blob.type === "image/png" ? "png" : "webp";
          resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type || "image/webp" }));
        },
        "image/webp",
        0.86,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name}: not an image Studio can read`));
    };
    img.src = url;
  });

/**
 * Uploads each photo to Cloudinary, then saves the set.
 * @param {{ name: string, gender: string, source: string, photos: Array<{ angle: string, file: File }> }} set
 * @param {(done: number, total: number) => void} [onProgress]
 */
export const createModelSet = async ({ name, gender, source, photos }, onProgress = () => {}) => {
  const urls = {};
  let done = 0;
  onProgress(0, photos.length);
  for (const { angle, file } of photos) {
    urls[angle] = await uploadImage(await toLibraryPhoto(file), { scope: "studio-model", name });
    onProgress(++done, photos.length);
  }
  return admin.post("/studio/model-sets", { name, gender, source, angles: Object.keys(urls), photos: urls });
};
