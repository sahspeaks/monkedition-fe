import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterProducts,
  formatPrice,
  parsePrice,
  readFilters,
  sizesIn,
  slugOf,
  toggleFandom,
  toggleGender,
  uniqueProducts,
  withFilters,
} from "./collectionFilters.js";

const products = [
  { _id: "a", name: "Levi Tee", price: 749, size: ["S", "M"] },
  { _id: "b", name: "Moon Hoodie", price: 1299, size: ["M", "2XL"] },
  { _id: "c", name: "Levi Hoodie", price: 2600, size: ["S"] },
];
const names = (list) => list.map((product) => product._id).join("");
const none = { size: null, price: null };

test("the page's own category is selected when the query names none", () => {
  const filters = readFilters(new URLSearchParams(), "Men", "Anime Verse");
  assert.deepEqual(filters.fandoms, ["men:anime-verse"]);
  assert.deepEqual(filters.genders, ["men"]);
});

test("an emptied selection stays empty, instead of falling back to the page's", () => {
  const filters = readFilters(new URLSearchParams("fandoms=&genders="), "men", "anime-verse");
  assert.deepEqual(filters.fandoms, []);
  assert.deepEqual(filters.genders, []);
});

test("every filter applies together, in any order", () => {
  assert.equal(names(filterProducts(products, { ...none, size: "M" })), "ab");
  assert.equal(names(filterProducts(products, { size: "S", price: [500, 999] })), "a");
  assert.equal(names(filterProducts(products, { ...none, price: [2500] })), "c");
});

test("prices in the gap between ranges still land in a range", () => {
  assert.equal(names(filterProducts([{ _id: "x", name: "x", price: 999.5 }], { ...none, price: [500, 999] })), "x");
});

test("a price filter survives the URL, and nonsense is ignored", () => {
  assert.deepEqual(parsePrice(formatPrice([500, 999])), [500, 999]);
  assert.deepEqual(parsePrice(formatPrice([2500])), [2500]);
  assert.equal(parsePrice("<script>"), null);
  assert.equal(parsePrice(null), null);
});

test("clearing a gender clears its fandoms and leaves others", () => {
  const filters = { genders: ["men", "women"], fandoms: ["men:a", "women:b"] };
  assert.deepEqual(toggleGender(filters, "men"), { genders: ["women"], fandoms: ["women:b"] });
  assert.deepEqual(toggleFandom(filters, "men:a").fandoms, ["women:b"]);
  assert.deepEqual(toggleFandom(filters, "men:c").fandoms, ["men:a", "women:b", "men:c"]);
});

test("the query keeps what was not changed and drops what was cleared", () => {
  const next = withFilters(new URLSearchParams("price=500-999&size=M"), { size: null, fandoms: [] });
  assert.equal(next.get("price"), "500-999");
  assert.equal(next.has("size"), false);
  assert.equal(next.get("fandoms"), "");
});

test("the size list comes from the products, so 2XL and XXL both work", () => {
  assert.deepEqual(sizesIn(products, null), ["S", "M", "2XL"]);
  assert.deepEqual(sizesIn(products, "XL"), ["S", "M", "XL", "2XL"]);
});

test("a product in two selected fandoms appears once", () => {
  assert.equal(uniqueProducts([products[0], products[0]]).length, 1);
});

test("slugs match however the link was written", () => {
  assert.equal(slugOf("Anime Verse"), "anime-verse");
  assert.equal(slugOf("anime-verse"), "anime-verse");
});
