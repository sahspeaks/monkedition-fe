// Building blocks shared by the dashboard's pages.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { errorText } from "./api";

export const rupees = (money) => {
  const paise = typeof money === "number" ? money : money?.amount;
  if (typeof paise !== "number") return "—";
  return (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
};

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

export const Page = ({ title, subtitle, actions, children }) => (
  <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
    <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
    {children}
  </div>
);

export const Card = ({ title, actions, children, className = "" }) => (
  <section className={`bg-white border border-gray-200 rounded-xl ${className}`}>
    {(title || actions) && (
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <h2 className="font-medium text-gray-800">{title}</h2>
        {actions}
      </div>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const VARIANTS = {
  primary: "bg-gray-900 text-white hover:bg-gray-700",
  accent: "bg-orange-400 text-black hover:bg-orange-500",
  secondary: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
  danger: "bg-white text-red-700 border border-red-300 hover:bg-red-50",
};

export const Button = ({ variant = "secondary", className = "", type = "button", ...props }) => (
  <button
    type={type}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    {...props}
  />
);

export const LinkButton = ({ variant = "secondary", className = "", ...props }) => (
  <Link
    className={`inline-block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`}
    {...props}
  />
);

const inputClass =
  "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400";

export const Field = ({ label, hint, children }) => (
  <label className="block text-sm font-medium text-gray-700">
    {label}
    {children}
    {hint && <span className="block mt-1 text-xs font-normal text-gray-500">{hint}</span>}
  </label>
);

export const Input = (props) => <input className={inputClass} {...props} />;
export const Textarea = (props) => <textarea className={inputClass} rows={4} {...props} />;
export const Select = ({ children, ...props }) => (
  <select className={inputClass} {...props}>
    {children}
  </select>
);

export const Notice = ({ tone = "error", children }) => {
  if (!children) return null;
  const tones = {
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-orange-50 text-orange-900 border-orange-200",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-4 p-3 rounded-lg border text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
};

const BADGE_TONES = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  PAID: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  SENT: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  ACCEPTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  DISPUTED: "bg-red-100 text-red-800",
  MANUAL_REVIEW: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  QUEUED: "bg-yellow-100 text-yellow-800",
};

export const Badge = ({ value }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_TONES[value] ?? "bg-gray-100 text-gray-700"}`}>
    {String(value ?? "—").replace(/_/g, " ")}
  </span>
);

export const Spinner = () => (
  <div className="flex justify-center p-10" aria-label="Loading">
    <Loader2 className="h-6 w-6 animate-spin text-orange-700" />
  </div>
);

export const Empty = ({ children }) => <p className="p-8 text-center text-sm text-gray-500">{children}</p>;

/** A scrollable table. columns: [{ label, render(row), className }] */
export const Table = ({ columns, rows, rowKey, onRowClick, empty = "Nothing here yet." }) => {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-gray-500 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th key={column.label} scope="col" className={`px-3 py-2 font-medium whitespace-nowrap ${column.className ?? ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-gray-100 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
            >
              {columns.map((column) => (
                <td key={column.label} className={`px-3 py-3 align-middle ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ page, onChange }) => {
  if (!page || page.totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 pt-4 text-sm text-gray-600" aria-label="Pages">
      <span>
        Page {page.number} of {page.totalPages} · {page.totalItems} total
      </span>
      <span className="flex gap-2">
        <Button disabled={page.number <= 1} onClick={() => onChange(page.number - 1)}>
          Previous
        </Button>
        <Button disabled={page.number >= page.totalPages} onClick={() => onChange(page.number + 1)}>
          Next
        </Button>
      </span>
    </nav>
  );
};

/** Loads something; reload() fetches it again. */
export const useLoad = (load, deps) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stable = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await stable());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [stable]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
};

/** Runs an action, tracking busy and error, and returns whether it worked. */
export const useAction = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
};

/** A search box that reports once typing pauses. */
export const SearchBox = ({ onSearch, placeholder = "Search" }) => {
  const [value, setValue] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="search"
      aria-label={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  );
};
