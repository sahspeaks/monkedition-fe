import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { admin } from "../api";
import { COLOURS, SIZES } from "../colours";
import ImageDrop from "../ImageDrop";
import { LinkButton, Badge, Button, Card, Field, Input, Notice, Page, Select, Spinner, Textarea, useAction, useLoad } from "../ui";

const BLANK = {
  name: "",
  description: "",
  details: "",
  addInfo: "",
  category: "",
  productCategory: "",
  price: "",
  discountPercentage: "0",
  weight: "",
  color: [],
  size: [],
  skuByKey: {},
  imagesByColour: {},
  addImages: [],
  image: "",
  tags: "",
};

const toForm = (product) => ({
  name: product.name ?? "",
  description: product.description ?? "",
  details: (product.details ?? []).join("\n"),
  addInfo: product.addInfo ?? "",
  category: String(product.category ?? ""),
  productCategory: String(product.productCategory ?? ""),
  price: String(product.price ?? ""),
  discountPercentage: String(product.discountPercentage ?? 0),
  weight: String(product.weight ?? ""),
  color: product.color ?? [],
  // A size listed on the product without a Qikink SKU cannot be sold, so only
  // sizes with a SKU count.
  size: [...new Set((product.skus ?? []).map((sku) => sku.colorSize.split("-").slice(1).join("-")))],
  skuByKey: Object.fromEntries((product.skus ?? []).map((sku) => [sku.colorSize, sku.sku])),
  imagesByColour: Object.fromEntries((product.colorImages ?? []).map((entry) => [entry.color, entry.images])),
  addImages: product.addImages ?? [],
  image: product.image ?? "",
  tags: (product.tags ?? []).join(", "),
});

const lines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState("");
  const { busy, error, setError, run } = useAction();

  const { data: taxonomy, error: taxonomyError } = useLoad(() => admin.get("/categories"), []);
  const { data: product, error: loadError, loading, reload } = useLoad(
    () => (isNew ? Promise.resolve(null) : admin.get(`/products/${id}`)),
    [id, isNew],
  );

  useEffect(() => {
    if (product) setForm(toForm(product));
  }, [product]);

  const set = (field, value) => {
    setSaved("");
    setForm((current) => ({ ...current, [field]: value }));
  };
  // A type's standard weight fills the box, unless someone typed their own.
  const standardWeight = (typeId) =>
    taxonomy?.productTypes?.find((type) => type.id === typeId)?.defaultWeightGrams ?? null;
  const chooseType = (typeId) => {
    setSaved("");
    setForm((current) => {
      const previous = standardWeight(current.productCategory);
      const untouched = current.weight === "" || current.weight === String(previous ?? "");
      const next = standardWeight(typeId);
      return {
        ...current,
        productCategory: typeId,
        weight: untouched ? String(next ?? "") : current.weight,
      };
    });
  };

  const toggle = (field, value) =>
    set(field, form[field].includes(value) ? form[field].filter((v) => v !== value) : [...form[field], value]);

  const categories = useMemo(() => {
    const items = taxonomy?.items ?? [];
    const byId = new Map(items.map((c) => [c.id, c]));
    const path = (c) => (c.parentId && byId.get(c.parentId) ? `${path(byId.get(c.parentId))} › ${c.name}` : c.name);
    return items.map((c) => ({ id: c.id, label: path(c) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [taxonomy]);

  const uploadTarget = {
    scope: "product",
    productName: form.name.trim(),
    category: form.category,
    productCategory: form.productCategory,
  };
  const uploadBlocked =
    form.name.trim() && form.category && form.productCategory
      ? null
      : "Choose a name, category and product type first: they decide the Cloudinary folder.";
  const folderPreview = uploadBlocked
    ? null
    : ["monkedition",
        taxonomy?.productTypes?.find((t) => t.id === form.productCategory)?.name,
        ...(categories.find((c) => c.id === form.category)?.label.split(" › ") ?? []),
        form.name.trim()].filter(Boolean).join(" / ");

  const allImages = [...form.color.flatMap((c) => form.imagesByColour[c] ?? []), ...form.addImages];
  const mainImage = allImages.includes(form.image) ? form.image : allImages[0] ?? "";
  const keys = form.color.flatMap((c) => form.size.map((s) => `${c}-${s}`));
  const live = !isNew && product?.status !== "ARCHIVED";

  const mainBadge = (url) => (
    <button
      type="button"
      title={url === mainImage ? "Main image" : "Make this the main image"}
      aria-label={url === mainImage ? "Main image" : "Make this the main image"}
      onClick={() => set("image", url)}
      className={`absolute bottom-1 left-1 rounded-full p-1 ${url === mainImage ? "bg-orange-400 text-black" : "bg-white/90 text-gray-500 hover:text-black"}`}
    >
      <Star className="h-3 w-3" />
    </button>
  );

  const save = (e) => {
    e.preventDefault();
    const sold = keys.filter((key) => form.skuByKey[key]?.trim());
    if (!keys.length) return setError("Choose at least one colour and one size.");
    if (!sold.length) return setError("Enter the Qikink SKU for at least one variant.");
    if (!mainImage) return setError("Add at least one image.");
    if (!lines(form.details).length) return setError("Add at least one detail line.");
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      details: lines(form.details),
      addInfo: form.addInfo.trim(),
      category: form.category,
      productCategory: form.productCategory,
      price: Number(form.price),
      discountPercentage: Number(form.discountPercentage),
      weight: form.weight === "" ? null : Number(form.weight),
      color: form.color,
      size: form.size,
      skus: sold.map((key) => ({ colorSize: key, sku: form.skuByKey[key].trim() })),
      image: mainImage,
      addImages: form.addImages,
      colorImages: form.color
        .filter((c) => form.imagesByColour[c]?.length)
        .map((c) => ({ color: c, images: form.imagesByColour[c] })),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    return run(async () => {
      if (isNew) {
        const created = await admin.post("/products", body);
        navigate(`/dashboard/products/${created.id}`, { replace: true });
      } else {
        await admin.put(`/products/${id}`, body);
        setSaved("Saved. The shop has the new details.");
        reload();
      }
    });
  };

  const setStatus = (status) =>
    run(async () => {
      await admin.patch(`/products/${id}/status`, { status });
      reload();
    });

  if (!isNew && loading && !product) return <Page title="Product"><Spinner /></Page>;

  return (
    <Page
      title={isNew ? "Add product" : form.name || "Product"}
      subtitle={!isNew && product?.slug ? `/${product.slug}` : undefined}
      actions={
        <>
          <LinkButton to="/dashboard/products">All products</LinkButton>
          {!isNew && (
            <Button variant={live ? "danger" : "secondary"} disabled={busy} onClick={() => setStatus(live ? "ARCHIVED" : "ACTIVE")}>
              {live ? "Remove from shop" : "Put back in shop"}
            </Button>
          )}
        </>
      }
    >
      <Notice>{error || loadError || taxonomyError}</Notice>
      <Notice tone="success">{saved}</Notice>
      <form onSubmit={save} className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Name"><Input required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Description"><Textarea required maxLength={5000} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
              <Field label="Details" hint="One per line, e.g. Fabric: 100% Cotton">
                <Textarea value={form.details} onChange={(e) => set("details", e.target.value)} />
              </Field>
              <Field label="Additional information"><Textarea rows={2} maxLength={2000} value={form.addInfo} onChange={(e) => set("addInfo", e.target.value)} /></Field>
              <Field label="Tags" hint="Separate with commas"><Input value={form.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
            </div>
          </Card>

          <Card title="Colours and sizes">
            <p className="text-sm font-medium text-gray-700 mb-2">Colours</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOURS.map(({ code, name, hex }) => {
                const on = form.color.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={on}
                    aria-label={name}
                    title={name}
                    onClick={() => toggle("color", code)}
                    style={{ backgroundColor: hex }}
                    className={`h-8 w-8 rounded-full border flex items-center justify-center ${on ? "ring-2 ring-offset-2 ring-orange-500 border-gray-700" : "border-gray-300"}`}
                  >
                    {on && <Check className="h-4 w-4 text-white mix-blend-difference" />}
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sizes</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[...new Set([...SIZES, ...form.size])].map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={form.size.includes(size)}
                  onClick={() => toggle("size", size)}
                  className={`px-3 py-1 rounded-lg border text-sm ${form.size.includes(size) ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {size}
                </button>
              ))}
            </div>
            {keys.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Qikink SKU for each variant</p>
                <p className="text-xs text-gray-500">Leave one blank if you do not sell that combination.</p>
                {keys.map((key) => {
                  const sku = form.skuByKey[key] ?? "";
                  const item = product?.stockByKey?.[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm text-gray-600">{key}</span>
                      <input
                        aria-label={`Qikink SKU for ${key}`}
                        value={sku}
                        maxLength={64}
                        onChange={(e) => set("skuByKey", { ...form.skuByKey, [key]: e.target.value })}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      {item && <span className="text-xs text-gray-500 whitespace-nowrap">{item.available} in stock</span>}
                    </div>
                  );
                })}
                <p className="text-xs text-gray-500">
                  New variants start with no stock. Add units under <Link to="/dashboard/inventory" className="text-orange-700 hover:underline">Inventory</Link>.
                </p>
              </div>
            )}
          </Card>

          <Card title="Images">
            {folderPreview && <p className="mb-4 text-xs text-gray-500 break-words">Uploading to: {folderPreview}</p>}
            {form.color.length === 0 && <p className="text-sm text-gray-500 mb-4">Choose a colour to add its images.</p>}
            <div className="space-y-5">
              {form.color.map((code) => (
                <div key={code}>
                  <p className="text-sm font-medium text-gray-700 mb-2">{COLOURS.find((c) => c.code === code)?.name ?? code}</p>
                  <ImageDrop
                    images={form.imagesByColour[code] ?? []}
                    onChange={(images) => set("imagesByColour", { ...form.imagesByColour, [code]: images })}
                    target={uploadTarget}
                    disabledReason={uploadBlocked}
                    extra={mainBadge}
                  />
                </div>
              ))}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Other images (size chart etc.)</p>
                <ImageDrop
                  images={form.addImages}
                  onChange={(images) => set("addImages", images)}
                  target={uploadTarget}
                  disabledReason={uploadBlocked}
                  extra={mainBadge}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Organisation">
            <div className="space-y-4">
              {!isNew && <p className="text-sm">Status: <Badge value={product?.status ?? "ACTIVE"} /></p>}
              <Field label="Category">
                <Select required value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Choose</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Product type">
                <Select required value={form.productCategory} onChange={(e) => chooseType(e.target.value)}>
                  <option value="">Choose</option>
                  {taxonomy?.productTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>
          </Card>
          <Card title="Price">
            <div className="space-y-4">
              <Field label="Selling price (₹)" hint="Includes GST and shipping">
                <Input type="number" required min="1" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <Field label="Discount shown (%)" hint="MRP is worked out from this">
                <Input type="number" required min="0" max="90" value={form.discountPercentage} onChange={(e) => set("discountPercentage", e.target.value)} />
              </Field>
              <Field label="Weight (grams)" hint="Filled in from the product type. Change it if this product differs.">
                <Input type="number" min="1" step="1" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
              </Field>
            </div>
          </Card>
          <Button type="submit" variant="accent" disabled={busy} className="w-full">
            {busy ? "Saving..." : isNew ? "Create product" : "Save changes"}
          </Button>
        </div>
      </form>
    </Page>
  );
};

export default ProductEditor;
