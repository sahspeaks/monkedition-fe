// Catalog calls against /api/v2, returning v1-shaped data (see adapters.js).
import { api } from "./client";
import { legacySlug, toCollectionsData, toLegacyListItem, toLegacyProduct } from "./adapters";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

let treePromise = null;

/** The category tree, fetched once per page load. */
export const getCategoryTree = () => {
  treePromise ??= api
    .get("/api/v2/categories/tree", { auth: false })
    .then((data) => data.items ?? [])
    .catch((error) => {
      treePromise = null; // let the next caller retry
      throw error;
    });
  return treePromise;
};

const categoriesById = async () => {
  const map = new Map();
  const walk = (nodes) =>
    nodes.forEach((node) => {
      map.set(node.id, node);
      walk(node.children ?? []);
    });
  walk(await getCategoryTree());
  return map;
};

export const getCollectionsData = async () => toCollectionsData(await getCategoryTree());

/** Every page of a product list (the storefront filters client-side). */
const allPages = async (path) => {
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const data = await api.get(`${path}${separator}page=${page}&size=${PAGE_SIZE}`, { auth: false });
    items.push(...data.items);
    if (page >= data.page.totalPages) break;
  }
  return items;
};

/**
 * Finds a subcategory from the route parameters the storefront has always
 * used: lowercased names with spaces as hyphens ("men's-clothing").
 */
const findSubcategory = (tree, categoryParam, subcategoryParam) => {
  const matches = (node, param) => {
    const wanted = decodeURIComponent(String(param ?? "")).toLowerCase();
    return [legacySlug(node.name), node.name.toLowerCase(), node.slug].includes(wanted);
  };
  const parent = tree.find((top) => matches(top, categoryParam));
  const candidates = parent ? parent.children ?? [] : tree.flatMap((top) => top.children ?? []);
  return candidates.find((child) => matches(child, subcategoryParam)) ?? null;
};

// Just long enough that going back to a list is instant. In memory only and
// successes only, so a failure is never remembered and prices stay current.
const LIST_MEMORY_MS = 60_000;
const listMemory = new Map();

const loadSubcategory = async (categoryParam, subcategoryParam) => {
  const tree = await getCategoryTree();
  const sub = findSubcategory(tree, categoryParam, subcategoryParam);
  if (!sub) return [];
  const byId = await categoriesById();
  return (await allPages(`/api/v2/categories/${sub.slug}/products`)).map((item) => toLegacyListItem(item, byId));
};

export const getProductsInSubcategory = (categoryParam, subcategoryParam) => {
  const key = `${categoryParam}/${subcategoryParam}`;
  const remembered = listMemory.get(key);
  if (remembered && Date.now() - remembered.at < LIST_MEMORY_MS) return remembered.list;
  const list = loadSubcategory(categoryParam, subcategoryParam);
  listMemory.set(key, { at: Date.now(), list });
  list.catch(() => listMemory.delete(key));
  return list;
};

export const getAllProducts = async () => {
  const byId = await categoriesById();
  return (await allPages("/api/v2/products")).map((item) => toLegacyListItem(item, byId));
};

const SUGGESTIONS = 5;

/** The first few matches, for the search box. */
export const getProductSuggestions = async (query) => {
  const data = await api.get(`/api/v2/products?q=${encodeURIComponent(query)}&size=${SUGGESTIONS}`, { auth: false });
  return (data.items ?? []).map((item) => toLegacyListItem(item));
};

/** Every match across the shop. */
export const searchProducts = async (query) => {
  const byId = await categoriesById();
  return (await allPages(`/api/v2/products?q=${encodeURIComponent(query)}`)).map((item) => toLegacyListItem(item, byId));
};

/** A product by id or slug, with its recommendations, as a v1 product. */
export const getProduct = async (idOrSlug) => {
  const [detail, recommendations] = await Promise.all([
    api.get(`/api/v2/products/${encodeURIComponent(idOrSlug)}`, { auth: false }),
    api
      .get(`/api/v2/products/${encodeURIComponent(idOrSlug)}/recommendations`, { auth: false })
      .then((data) => data.items)
      .catch(() => []),
  ]);
  const reviews = await api
    .get(`/api/v2/products/${detail.id}/reviews?size=50`, { auth: false })
    .then((data) => data.items ?? [])
    .catch(() => []);
  const product = toLegacyProduct(detail, recommendations, reviews);
  // The breadcrumb links to the category, whose address needs its parent.
  const byId = await categoriesById().catch(() => new Map());
  const parent = byId.get(byId.get(detail.category?.id)?.parentId);
  if (product.category && parent) product.category.parentCategory = { name: parent.name };
  return product;
};

export const getColourImages = async (idOrSlug, colourCode) => {
  const data = await api.get(
    `/api/v2/products/${encodeURIComponent(idOrSlug)}/media?colour=${encodeURIComponent(colourCode)}`,
    { auth: false },
  );
  return { success: true, images: data.images, colorCode: data.colour, totalImages: data.images.length };
};

export const getAllColourImages = async (idOrSlug) => {
  const data = await api.get(`/api/v2/products/${encodeURIComponent(idOrSlug)}/media`, { auth: false });
  const colorImages = data.byColour ?? {};
  return {
    success: true,
    colorImages,
    availableColors: Object.keys(colorImages),
    totalColors: Object.keys(colorImages).length,
  };
};

// --- wishlist (signed in; the user always comes from the token) ---------------

const toWishlistItems = (data) =>
  (data?.items ?? []).map((entry) => ({ product: toLegacyListItem(entry.product), addedAt: entry.addedAt }));

export const getWishlist = async () => toWishlistItems(await api.get("/api/v2/wishlist"));

export const addToWishlist = async (productId) =>
  toWishlistItems(await api.post("/api/v2/wishlist/items", { productId }));

export const removeFromWishlist = (productId) => api.delete(`/api/v2/wishlist/items/${productId}`);

export const clearWishlist = () => api.delete("/api/v2/wishlist");

export const getMyReview = (productId) => api.get(`/api/v2/products/${productId}/reviews/mine`);
export const saveMyReview = (productId, review) =>
  api.put(`/api/v2/products/${productId}/reviews/mine`, review);

const REVIEW_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Sends one photo straight to Cloudinary, signed by the server for this product. */
export const uploadReviewPhoto = async (productId, file) => {
  if (!REVIEW_PHOTO_TYPES.has(file.type)) throw new Error(`${file.name}: use a JPG, PNG, WebP or AVIF image`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: photos must be 10 MB or smaller`);
  const { uploadUrl, fields } = await api.post(`/api/v2/products/${productId}/reviews/photos/sign`, {});
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append("file", file);
  const response = await fetch(uploadUrl, { method: "POST", body: form });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${file.name}: ${data?.error?.message ?? "upload failed"}`);
  return data.secure_url;
};
