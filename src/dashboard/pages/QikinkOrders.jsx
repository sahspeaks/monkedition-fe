import { useState } from "react";
import { Link } from "react-router-dom";
import { admin, query } from "../api";
import { Badge, Button, Card, Field, Input, Notice, Page, Select, Spinner, Table, useLoad } from "../ui";

const STATUSES = [
  "On Hold", "Live", "To be Printed", "Partially Printed", "Printed", "S-Printed", "Stitched/QC",
  "Partitally Picklisted", "Dispatch Ready", "Manifested", "PIcked Up", "In-Transit", "Out for Delivery",
  "Delivered", "Delivery rescheduled", "Consignee unavailable", "Not attempted", "Maximum attempts reached",
  "Incorrect/incomplete Address", "Refused to accept", "Open delivery refused", "OTP not shared",
  "OTP verification cancelled", "Residence / office closed", "Self collect", "ODA", "Misrouted",
  "RTO Initiated", "Returned", "Partially Returned", "Reverse Pickup Initiated", "Cancelled",
  "Out Of Stock", "Live-OOS", "Exception", "Lost", "No-Data", "Archived",
];

const QikinkOrders = () => {
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad(
    () => admin.get(`/qikink/orders${query({ status, reference: search, page })}`),
    [status, search, page],
  );
  const pick = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <Page
      title="Qikink orders"
      subtitle="Read live from Qikink, 10 per page, covering the recent period Qikink allows"
      actions={
        <>
          <Button variant={status === "On Hold" ? "accent" : "secondary"} onClick={() => pick(status === "On Hold" ? "" : "On Hold")}>
            Waiting for release
          </Button>
          <Button onClick={reload} disabled={loading}>Refresh</Button>
          <a
            href="https://dashboard.qikink.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
          >
            Open Qikink
          </a>
        </>
      }
    >
      <Notice>{error}</Notice>
      {status === "On Hold" && (
        <Notice tone="warning">
          These stay on hold until someone releases them in Qikink&apos;s dashboard. Check the payment first: while the shop uses Razorpay test keys, a test-card order looks paid.
        </Notice>
      )}
      <Card>
        <form
          className="grid sm:grid-cols-3 gap-3 mb-4 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(reference.trim());
          }}
        >
          <Field label="Status">
            <Select value={status} onChange={(e) => pick(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field label="Order reference">
            <Input maxLength={22} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="MF2610Q6CNGCNT" />
          </Field>
          <Button type="submit" variant="primary" className="mb-px">Search</Button>
        </form>

        {loading && !data ? (
          <Spinner />
        ) : (
          <>
            <Table
              rows={data?.orders}
              rowKey={(order) => order.partnerOrderId}
              empty="Qikink has no orders matching this."
              columns={[
                { label: "Qikink ID", render: (o) => o.partnerOrderId },
                { label: "Reference", render: (o) => <span className="break-all">{o.number}</span> },
                {
                  label: "Our order",
                  render: (o) =>
                    o.orderNumber ? (
                      <Link to={`/dashboard/orders/${o.orderNumber}`} className="text-orange-700 hover:underline whitespace-nowrap">
                        {o.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Not from this system</span>
                    ),
                },
                { label: "Status", render: (o) => <Badge value={o.status} /> },
                { label: "Payment", render: (o) => o.paymentType ?? "—" },
                { label: "Value", render: (o) => (o.totalOrderValue != null ? `₹${o.totalOrderValue}` : "—"), className: "text-right" },
                {
                  label: "Items",
                  render: (o) => o.lineItems?.map((line) => `${line.sku} × ${line.quantity}`).join(", ") || "—",
                },
                {
                  label: "Tracking",
                  render: (o) =>
                    o.shipping?.awb ? (
                      <a href={o.shipping.tracking_link} target="_blank" rel="noopener noreferrer" className="text-orange-700 hover:underline whitespace-nowrap">
                        {o.shipping.courier_provider_name?.trim() || "Track"}
                      </a>
                    ) : (
                      "—"
                    ),
                },
                { label: "Created", render: (o) => <span className="whitespace-nowrap">{o.createdOn ?? "—"}</span> },
              ]}
            />
            {data?.totalPages > 1 && (
              <nav className="flex items-center justify-between gap-3 pt-4 text-sm text-gray-600" aria-label="Pages">
                <span>Page {data.page} of {data.totalPages} · {data.totalResults} total</span>
                <span className="flex gap-2">
                  <Button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</Button>
                  <Button disabled={!data.hasNext} onClick={() => setPage(data.page + 1)}>Next</Button>
                </span>
              </nav>
            )}
          </>
        )}
      </Card>
    </Page>
  );
};

export default QikinkOrders;
