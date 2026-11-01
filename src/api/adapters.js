// v2 responses → the shapes the pages were written against (v1). Keeping
// the pages unchanged makes the switch to v2 small and easy to review; the
// pages can move to v2 shapes one at a time later.

/** { amount: paise, currency } → rupees as a number, or null. */
export const rupees = (money) => (money && typeof money.amount === "number" ? money.amount / 100 : null);

/** The URL form the storefront has always used for a category name. */
export const legacySlug = (name) => String(name ?? "").toLowerCase().replace(/\s+/g, "-");

/**
 * A v2 list card as a v1 product.
 * @param {object} item
 * @param {Map<string, { name: string }>} [categoriesById]
 */
export const toLegacyListItem = (item, categoriesById) => {
  const price = rupees(item.price);
  return {
    _id: item.id,
    slug: item.slug,
    name: item.name,
    price,
    mrp: rupees(item.listPrice) ?? price,
    discountPercentage: item.discountPercent ?? 0,
    image: item.image,
    color: (item.colours ?? []).map((colour) => colour.code),
    colours: item.colours ?? [],
    size: item.sizes ?? [],
    inStock: Boolean(item.inStock),
    category: item.categoryId
      ? { _id: item.categoryId, name: categoriesById?.get(item.categoryId)?.name ?? "" }
      : null,
    reviews: [],
  };
};

/** A v2 product detail (plus its recommendations) as a v1 product. */
export const toLegacyProduct = (detail, recommendations = [], reviews = []) => ({
  ...toLegacyListItem(detail),
  // The server gives a count only when it is low; otherwise any large number
  // reads as "In Stock".
  reviews: reviews.map((review) => ({
    rating: review.rating,
    comment: review.comment,
    photos: review.photos ?? [],
    user: { firstName: review.authorName },
  })),
  stock: detail.inStock ? detail.unitsLeft ?? Number.MAX_SAFE_INTEGER : 0,
  weightGrams: detail.weightGrams ?? null,
  description: detail.description ?? "",
  details: detail.details ?? [],
  addInfo: detail.additionalInfo ?? "",
  tags: detail.tags ?? [],
  addImages: detail.media?.gallery ?? [],
  colorImages: Object.entries(detail.media?.byColour ?? {}).map(([color, images]) => ({ color, images })),
  skus: (detail.variants ?? []).map((variant) => ({ colorSize: variant.variantId, sku: variant.sku })),
  variants: detail.variants ?? [],
  category: detail.category ? { _id: detail.category.id, name: detail.category.name, slug: detail.category.slug } : null,
  recommendations: recommendations.map((item) => toLegacyListItem(item)),
});

/**
 * The v2 profile as the user object the pages read (user._id, user.address).
 * The saved address is the default entry of the address book.
 */
export const toLegacyUser = (profile, defaultAddress) => ({
  _id: profile.id,
  id: profile.id,
  email: profile.email,
  firstName: profile.firstName ?? "",
  lastName: profile.lastName ?? "",
  phone: profile.phone ?? "",
  avatar: profile.avatar ?? undefined,
  provider: profile.provider,
  roles: profile.roles,
  emailVerified: profile.emailVerified,
  hasPassword: profile.hasPassword,
  address: defaultAddress
    ? {
        doorNo: "",
        street: [defaultAddress.line1, defaultAddress.line2, defaultAddress.landmark]
          .filter(Boolean)
          .join(", "),
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
        country: defaultAddress.country === "IN" ? "India" : defaultAddress.country,
      }
    : undefined,
});

/** The v2 category tree as v1's { "Men's Clothing": [subcategory, …] }. */
export const toCollectionsData = (tree) =>
  Object.fromEntries(
    (tree ?? []).map((top) => [
      top.name,
      (top.children ?? []).map((child) => ({
        id: child.id,
        slug: child.slug,
        name: child.name,
        level: child.level,
        thumbnail: child.thumbnail,
        parentCategory: top.name,
      })),
    ]),
  );
