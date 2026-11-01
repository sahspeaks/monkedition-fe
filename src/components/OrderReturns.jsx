// Returns on a delivered order, per the published policy: manufacturing
// defects, within 7 days of delivery, with photos.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Upload, X } from "lucide-react";
import { listReturns, requestReturn, uploadReturnPhoto } from "../api/orders";

const STATUS_TEXT = {
  REQUESTED: "We are reviewing your request",
  APPROVED: "Approved: a pickup will be arranged within 24-48 hours",
  RECEIVED: "Received: your refund is being processed",
  REFUNDED: "Refunded",
  REJECTED: "Not accepted",
};

const money = (value) =>
  (value / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

const errorText = (err) => {
  const details = (err?.body?.errors ?? []).map?.((e) => e.message).join("; ");
  return details || err?.message || "Something went wrong. Please try again.";
};

const OrderReturns = ({ order }) => {
  const [returns, setReturns] = useState([]);
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState("");
  const [payout, setPayout] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const isCod = order.paymentMethod === "COD";

  const load = () =>
    listReturns(order.orderId)
      .then(setReturns)
      .catch(() => {});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.orderId]);

  // Units already in a request that is open or done cannot be asked for again.
  const taken = (sku) =>
    returns
      .filter((r) => r.status !== "REJECTED")
      .flatMap((r) => r.items)
      .filter((item) => item.sku === sku)
      .reduce((sum, item) => sum + item.quantity, 0);
  const returnable = order.items
    .map((item) => ({ ...item, left: item.quantity - taken(item.sku) }))
    .filter((item) => item.left > 0);

  const addPhotos = async (files) => {
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const file of [...files].slice(0, 6 - photos.length)) {
        urls.push(await uploadReturnPhoto(order.orderId, file));
      }
      setPhotos((current) => [...current, ...urls]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([sku, quantity]) => ({ sku, quantity }));
    if (!items.length) return setError("Choose at least one item.");
    if (!photos.length) return setError("Add at least one photo of the defect.");
    setBusy(true);
    setError("");
    try {
      await requestReturn(order.orderId, {
        items,
        reason: reason.trim(),
        photos,
        ...(isCod && { payoutDetails: payout.trim() }),
      });
      setOpen(false);
      setQuantities({});
      setReason("");
      setPayout("");
      setPhotos([]);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  if (!returns.length && !order.canReturn) return null;

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">Returns</h4>
      <div className="space-y-3">
        {returns.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-lg text-sm">
            <p className="font-medium">{STATUS_TEXT[item.status] ?? item.status}</p>
            <p className="text-gray-600">
              {item.items.map((line) => `${line.name} × ${line.quantity}`).join(", ")} · {money(item.refund.amount)}
            </p>
            {item.rejectReason && <p className="text-gray-600">Reason: {item.rejectReason}</p>}
          </div>
        ))}

        {order.canReturn && returnable.length > 0 && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100"
          >
            Report a defect
          </button>
        )}

        {open && (
          <form onSubmit={submit} className="bg-white p-3 rounded-lg space-y-3 text-sm">
            <p className="text-xs text-gray-600">
              We accept returns for manufacturing defects within 7 days of delivery, not for size issues. See our{" "}
              <Link to="/return" className="text-orange-600 hover:underline">return policy</Link>.
            </p>
            {returnable.map((item) => (
              <label key={item.sku} className="flex items-center justify-between gap-3">
                <span className="min-w-0">{item.productName}</span>
                <select
                  aria-label={`Quantity of ${item.productName} to return`}
                  value={quantities[item.sku] ?? 0}
                  onChange={(e) => setQuantities({ ...quantities, [item.sku]: Number(e.target.value) })}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {Array.from({ length: item.left + 1 }, (_, n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="block">
              What is wrong?
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              />
            </label>
            {isCod && (
              <label className="block">
                Where should we send your refund?
                <input
                  required
                  minLength={5}
                  maxLength={300}
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  placeholder="UPI ID, or bank account number and IFSC"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </label>
            )}
            <div>
              <p className="mb-1">Photos of the defect (up to 6)</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((url, index) => (
                  <span key={url} className="relative">
                    <img src={url} alt={`Defect ${index + 1}`} className="h-16 w-16 object-cover rounded border border-gray-200" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => setPhotos(photos.filter((photo) => photo !== url))}
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {photos.length < 6 && (
                  <button
                    type="button"
                    aria-label="Add photos"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="h-16 w-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy || uploading} className="px-4 py-2 rounded-lg font-medium bg-orange-300 text-black disabled:opacity-50">
                {busy ? "Sending..." : "Send request"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderReturns;
