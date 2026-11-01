// What the product list shows, worked out from the URL alone. One pure
// calculation, so filters cannot disagree with each other, and refresh, back
// and shared links all give the same page.

/** The URL form of a category name; matches adapters.js. */
export const slugOf = (name) => String(name ?? "").toLowerCase().replace(/\s+/g, "-");

const list = (value) => (value ? value.split(",").filter(Boolean) : []);

/** "500-999" → [500, 999]; "2500-" → [2500]; anything else → null. */
export const parsePrice = (value) => {
  const match = /^(\d+)-(\d*)$/.exec(value ?? "");
  if (!match) return null;
  return match[2] ? [Number(match[1]), Number(match[2])] : [Number(match[1])];
};

export const formatPrice = (range) => (range ? `${range[0]}-${range[1] ?? ""}` : "");

/**
 * Reads the filters. With no gender or fandom in the query, the page's own
 * category is what is selected.
 * @param {URLSearchParams} params
 * @param {string} routeCategory
 * @param {string} routeSubcategory
 */
export const readFilters = (params, routeCategory, routeSubcategory) => {
  const category = slugOf(routeCategory);
  const subcategory = slugOf(routeSubcategory);
  const fandoms = params.has("fandoms") ? list(params.get("fandoms")) : [`${category}:${subcategory}`];
  const genders = params.has("genders") ? list(params.get("genders")) : [category];
  return {
    fandoms,
    // A selected fandom always shows its gender as selected.
    genders: [...new Set([...genders, ...fandoms.map((key) => key.split(":")[0])])],
    size: params.get("size") || null,
    price: parsePrice(params.get("price")),
    q: params.get("q") ?? "",
  };
};

/** Merges changes into the query, dropping empty values. */
export const withFilters = (params, changes) => {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    // An empty fandom list is meaningful: it means nothing is selected.
    if (key === "fandoms" || key === "genders") next.set(key, value.join(","));
    else if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
};

/** Selects or clears a gender; clearing one clears its fandoms too. */
export const toggleGender = (filters, gender) =>
  filters.genders.includes(gender)
    ? {
        genders: filters.genders.filter((item) => item !== gender),
        fandoms: filters.fandoms.filter((key) => key.split(":")[0] !== gender),
      }
    : { genders: [...filters.genders, gender], fandoms: filters.fandoms };

export const toggleFandom = (filters, key) => ({
  genders: filters.genders,
  fandoms: filters.fandoms.includes(key)
    ? filters.fandoms.filter((item) => item !== key)
    : [...filters.fandoms, key],
});

/** The products that pass the size, price and search filters. */
export const filterProducts = (products, { size, price, q }) => {
  const query = q.trim().toLowerCase();
  return products.filter((product) => {
    if (size && !product.size?.includes(size)) return false;
    if (price) {
      const amount = Math.floor(Number(product.price));
      if (amount < price[0] || (price.length === 2 && amount > price[1])) return false;
    }
    return !query || product.name?.toLowerCase().includes(query);
  });
};

/** The same product can be in two selected fandoms' results. */
export const uniqueProducts = (products) => [
  ...new Map(products.map((product) => [product._id, product])).values(),
];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL"];

/** The sizes these products actually come in, smallest first. */
export const sizesIn = (products, selected) => {
  const sizes = new Set(products.flatMap((product) => product.size ?? []));
  if (selected) sizes.add(selected);
  const rank = (size) => {
    const index = SIZE_ORDER.indexOf(size);
    return index === -1 ? SIZE_ORDER.length : index;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};
