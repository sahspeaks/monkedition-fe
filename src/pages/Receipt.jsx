// A printable order receipt. The business is not GST-registered yet, so this
// says plainly that it is not a tax invoice.
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const money = (value) =>
  value ? (value.amount / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" }) : "—";

const Receipt = () => {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const base = params.get("staff") ? "/api/v2/admin/orders" : "/api/v2/orders";

  useEffect(() => {
    api
      .get(`${base}/${encodeURIComponent(orderNumber)}`)
      .then(setOrder)
      .catch((err) => setError(err.message || "Could not load this order."));
  }, [base, orderNumber]);

  if (error) return <p role="alert" className="p-8 text-center text-red-700">{error}</p>;
  if (!order) return <p className="p-8 text-center text-gray-500">Loading...</p>;
  const address = order.deliveryAddress ?? {};

  return (
    <main className="max-w-2xl mx-auto bg-white p-6 sm:p-10 text-sm text-gray-800">
      <div className="flex justify-between gap-3 mb-6 print:hidden">
        <Link to={params.get("staff") ? `/dashboard/orders/${order.orderNumber}` : "/orders"} className="text-orange-600 hover:underline">
          Back
        </Link>
        <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-lg font-medium bg-orange-300 text-black">
          Print or save as PDF
        </button>
      </div>

      <header className="flex flex-wrap justify-between gap-4 border-b border-gray-200 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Moons Flare</h1>
          <p className="text-gray-600">store.moonsflare@gmail.com</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Order receipt</p>
          <p>{order.orderNumber}</p>
          <p className="text-gray-600">{new Date(order.placedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
      </header>

      <section className="mb-4">
        <h2 className="font-medium mb-1">Delivered to</h2>
        <p>{address.fullName}</p>
        <p className="text-gray-600">{[address.line1, address.line2, address.landmark].filter(Boolean).join(", ")}</p>
        <p className="text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
      </section>

      <table className="w-full text-left mb-4">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <tr>
            <th scope="col" className="py-2 font-medium">Item</th>
            <th scope="col" className="py-2 font-medium text-right">Qty</th>
            <th scope="col" className="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.sku} className="border-b border-gray-100">
              <td className="py-2">{line.name}</td>
              <td className="py-2 text-right">{line.quantity}</td>
              <td className="py-2 text-right">{money(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto w-full sm:w-64 space-y-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
        {order.discount?.amount > 0 && (
          <div className="flex justify-between"><dt>Discount</dt><dd>-{money(order.discount)}</dd></div>
        )}
        {order.codFee && <div className="flex justify-between"><dt>COD fee</dt><dd>{money(order.codFee)}</dd></div>}
        <div className="flex justify-between font-semibold border-t border-gray-200 pt-1"><dt>Total</dt><dd>{money(order.grandTotal)}</dd></div>
        <div className="flex justify-between text-gray-600">
          <dt>Payment</dt>
          <dd>{order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</dd>
        </div>
      </dl>

      <p className="mt-8 text-xs text-gray-500">This is an order receipt, not a tax invoice.</p>
    </main>
  );
};

export default Receipt;
