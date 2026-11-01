import { useState } from "react";
import { Link } from "react-router-dom";
import { admin, query } from "../api";
import { Badge, Button, Card, Empty, Field, Input, Notice, Page, Pagination, Select, Spinner, dateTime, rupees, useAction, useLoad } from "../ui";

const STATUSES = ["REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"];

const ReturnCard = ({ item, onChanged }) => {
  const { busy, error, run } = useAction();
  const [rejectReason, setRejectReason] = useState("");
  const [restock, setRestock] = useState(false);
  const [reference, setReference] = useState("");
  const act = (action, body) =>
    run(async () => {
      await admin.post(`/returns/${item.id}/${action}`, body);
      await onChanged();
    });

  return (
    <Card
      title={<Link to={`/dashboard/orders/${item.orderNumber}`} className="text-orange-700 hover:underline">{item.orderNumber}</Link>}
      actions={<span className="flex items-center gap-2 text-xs text-gray-500">{dateTime(item.createdAt)} <Badge value={item.status} /></span>}
    >
      <Notice>{error}</Notice>
      <ul className="text-sm mb-2">
        {item.items.map((line) => (
          <li key={line.sku} className="flex justify-between gap-3">
            <span className="min-w-0">{line.name} × {line.quantity}</span>
            <span className="whitespace-nowrap">{rupees(line.refund)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium">
        Refund {rupees(item.refund)} · {item.refundMethod === "GATEWAY" ? "automatic, through Razorpay" : "by hand (COD)"}
      </p>
      <p className="mt-2 text-sm text-gray-700 break-words">{item.reason}</p>
      {item.payoutDetails && <p className="mt-2 text-sm break-words"><span className="text-gray-500">Send to:</span> {item.payoutDetails}</p>}
      {item.manualRefundReference && <p className="mt-2 text-sm"><span className="text-gray-500">Reference:</span> {item.manualRefundReference}</p>}
      {item.rejectReason && <p className="mt-2 text-sm"><span className="text-gray-500">Rejected:</span> {item.rejectReason}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {item.photos.map((url, index) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt={`Defect ${index + 1}`} className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
          </a>
        ))}
      </div>

      {item.status === "REQUESTED" && (
        <div className="mt-4 space-y-3">
          <Button variant="primary" disabled={busy} onClick={() => act("approve")}>Approve</Button>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              act("reject", { reason: rejectReason.trim() });
            }}
          >
            <div className="flex-1 min-w-[12rem]">
              <Field label="Reject, telling the customer why">
                <Input required maxLength={300} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" variant="danger" disabled={busy || !rejectReason.trim()}>Reject</Button>
          </form>
        </div>
      )}

      {item.status === "APPROVED" && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">
            Arrange the pickup. Once the parcel is back and passes the quality check, mark it received.
            {item.refundMethod === "GATEWAY" ? " This sends the refund straight away." : ""}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
            Put these units back on sale
          </label>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => {
              const refundNote = item.refundMethod === "GATEWAY" ? ` and refund ${rupees(item.refund)}` : "";
              if (window.confirm(`Mark this return received${refundNote}?`)) act("received", { restock });
            }}
          >
            Passed check: mark received
          </Button>
        </div>
      )}

      {item.status === "RECEIVED" && item.refundMethod === "MANUAL" && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act("manual-refund", { reference: reference.trim() });
          }}
        >
          <div className="flex-1 min-w-[12rem]">
            <Field label={`After sending ${rupees(item.refund)}, enter the UPI or bank reference`}>
              <Input required maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" variant="primary" disabled={busy || !reference.trim()}>Record refund</Button>
        </form>
      )}
      {item.status === "RECEIVED" && item.refundMethod === "GATEWAY" && (
        <p className="mt-4 text-xs text-gray-500">Razorpay is processing the refund. This moves on by itself.</p>
      )}
    </Card>
  );
};

const Returns = () => {
  const [status, setStatus] = useState("REQUESTED");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad(() => admin.get(`/returns${query({ status, page })}`), [status, page]);

  return (
    <Page title="Returns" subtitle="Manufacturing defects, within 7 days of delivery, as the return policy says">
      <div className="w-full sm:w-56 mb-4">
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <Notice>{error}</Notice>
      {loading && !data ? <Spinner /> : !data?.items?.length ? <Card><Empty>No returns here.</Empty></Card> : (
        <div className="grid lg:grid-cols-2 gap-4">
          {data.items.map((item) => <ReturnCard key={item.id} item={item} onChanged={reload} />)}
        </div>
      )}
      <Pagination page={data?.page} onChange={setPage} />
    </Page>
  );
};

export default Returns;
