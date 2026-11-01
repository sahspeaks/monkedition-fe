import { useEffect, useState } from "react";
import { admin } from "../api";
import { Button, Card, Field, Input, Notice, Page, Spinner, Textarea, useAction, useLoad } from "../ui";

const Settings = () => {
  const { data, error, loading, reload } = useLoad(() => admin.get("/settings/cod"), []);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const { busy, error: saveError, run } = useAction();

  useEffect(() => {
    if (!data) return;
    setForm({
      enabled: data.enabled,
      maxOrder: data.maxOrderPaise == null ? "" : String(data.maxOrderPaise / 100),
      pincodes: (data.blockedPincodes ?? []).join(", "),
      maxReturned: data.maxReturnedParcels == null ? "" : String(data.maxReturnedParcels),
    });
  }, [data]);

  const set = (field, value) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await admin.put("/settings/cod", {
        enabled: form.enabled,
        maxOrderPaise: form.maxOrder === "" ? null : Math.round(Number(form.maxOrder) * 100),
        blockedPincodes: form.pincodes.split(/[\s,]+/).map((code) => code.trim()).filter(Boolean),
        maxReturnedParcels: form.maxReturned === "" ? null : Number(form.maxReturned),
      });
      await reload();
      setSaved(true);
    });
  };

  return (
    <Page title="Cash on delivery" subtitle="Checked when an order is placed. Customers also verify their email once before using COD.">
      <Notice>{error || saveError}</Notice>
      <Notice tone="success">{saved ? "Saved." : ""}</Notice>
      {loading && !form ? <Spinner /> : form && (
        <Card>
          <form onSubmit={save} className="space-y-4 max-w-lg">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
              Offer cash on delivery
            </label>
            <Field label="Largest COD order (₹)" hint="Empty means no limit">
              <Input type="number" min="1" step="1" value={form.maxOrder} onChange={(e) => set("maxOrder", e.target.value)} />
            </Field>
            <Field label="Blocked PIN codes" hint="Separate with commas or spaces">
              <Textarea rows={3} value={form.pincodes} onChange={(e) => set("pincodes", e.target.value)} />
            </Field>
            <Field label="Stop COD after this many returned parcels" hint="Counted per customer. Empty means never.">
              <Input type="number" min="1" step="1" value={form.maxReturned} onChange={(e) => set("maxReturned", e.target.value)} />
            </Field>
            <Button type="submit" variant="primary" disabled={busy}>Save</Button>
          </form>
        </Card>
      )}
    </Page>
  );
};

export default Settings;
