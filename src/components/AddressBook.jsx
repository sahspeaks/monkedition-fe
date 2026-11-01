import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/NewAuthContext";
import * as auth from "../api/auth";
import { toLocalMobile } from "../utils/phone";
import { Title } from "./Title";

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };

const FIELDS = [
  { name: "fullName", title: "Full name", required: true },
  { name: "phone", title: "Phone", required: true, type: "tel" },
  { name: "line1", title: "Address", required: true },
  { name: "line2", title: "Address line 2" },
  { name: "landmark", title: "Landmark" },
  { name: "city", title: "City", required: true },
  { name: "state", title: "State", required: true },
  { name: "pincode", title: "PIN code", required: true },
];

// The fields the server names when it rejects a form, shown beside the message.
const fieldErrorMessage = (err) => {
  const details = (err.body?.errors ?? [])
    .map(({ path, message }) => (path ? `${path} ${message}` : message))
    .join("; ");
  return details || err.message || "Something went wrong. Please try again.";
};

const AddressBook = () => {
  const { fetchUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // null: not editing. { id: null }: adding. { id }: editing that address.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = async () => setAddresses(await auth.listAddresses());

  useEffect(() => {
    refresh()
      .catch((err) => setError(fieldErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Runs a change, then reloads the list and the user checkout prefills from.
  const run = async (change) => {
    setBusy(true);
    setError("");
    try {
      await change();
      await refresh();
      await fetchUser();
      return true;
    } catch (err) {
      setError(fieldErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const startAdd = () => {
    setForm(EMPTY);
    setEditing({ id: null });
  };

  const startEdit = (address) => {
    setForm({
      ...EMPTY,
      ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, address[key] ?? ""])),
      phone: toLocalMobile(address.phone),
    });
    setEditing({ id: address.id });
  };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, line2: form.line2.trim() || null, landmark: form.landmark.trim() || null };
    const saved = await run(() =>
      editing.id ? auth.updateAddress(editing.id, body) : auth.createAddress(body),
    );
    if (saved) setEditing(null);
  };

  const remove = (address) => {
    if (window.confirm("Delete this address?")) run(() => auth.deleteAddress(address.id));
  };

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center text-xl mb-4">
        <Title text1="SAVED" text2="ADDRESSES" />
        {!editing && (
          <button
            type="button"
            onClick={startAdd}
            className="px-3 py-1 text-sm bg-orange-500 text-black rounded hover:bg-orange-600"
          >
            Add address
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading && <Loader2 className="h-5 w-5 animate-spin text-orange-700" />}
      {!loading && !editing && addresses.length === 0 && (
        <p className="text-sm text-gray-600">No saved addresses yet.</p>
      )}

      {editing ? (
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(({ name, title, required, type = "text" }) => (
            <label key={name} className="text-sm text-gray-700">
              {title}
              <input
                type={type}
                name={name}
                required={required}
                value={form[name]}
                onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              />
            </label>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-sm bg-orange-500 text-black rounded disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save address"}
            </button>
          </div>
        </form>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-medium">
                {address.fullName}
                {address.isDefault && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100">Default</span>
                )}
              </p>
              <p className="text-gray-600">
                {[address.line1, address.line2, address.landmark].filter(Boolean).join(", ")}
              </p>
              <p className="text-gray-600">
                {address.city}, {address.state} - {address.pincode}
              </p>
              <p className="text-gray-600">Phone: {address.phone}</p>
              <div className="flex gap-4 mt-2 text-orange-700">
                <button type="button" disabled={busy} onClick={() => startEdit(address)} className="hover:underline">
                  Edit
                </button>
                <button type="button" disabled={busy} onClick={() => remove(address)} className="hover:underline">
                  Delete
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => auth.makeDefaultAddress(address.id))}
                    className="hover:underline"
                  >
                    Make default
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AddressBook;
