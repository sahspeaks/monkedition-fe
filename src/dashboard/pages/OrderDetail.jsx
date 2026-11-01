import { useState } from "react";
import { useParams } from "react-router-dom";
import { admin } from "../api";
import { LinkButton, Badge, Button, Card, Field, Input, Notice, Page, Select, Spinner, Textarea, dateTime, rupees, useAction, useLoad } from "../ui";

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900 text-right break-words min-w-0">{children ?? "—"}</span>
  </div>
);

const ShipmentForm = ({ order, onSubmit, busy }) => {
  const [status, setStatus] = useState(order.status === "SHIPPED" ? "DELIVERED" : "SHIPPED");
  const [awb, setAwb] = useState(order.shipment?.awb ?? "");
  const [courier, setCourier] = useState(order.shipment?.courier ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.shipment?.trackingUrl ?? "");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          status,
          ...(awb.trim() && { awb: awb.trim() }),
          ...(courier.trim() && { courier: courier.trim() }),
          ...(trackingUrl.trim() && { trackingUrl: trackingUrl.trim() }),
        });
      }}
    >
      <p className="text-xs text-gray-500">
        Qikink&apos;s status is also read automatically every 30 minutes. Use this if you need it sooner. The customer is emailed.
      </p>
      <Field label="New status">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {order.status !== "SHIPPED" && <option value="SHIPPED">Shipped</option>}
          <option value="DELIVERED">Delivered</option>
        </Select>
      </Field>
      <Field label="Tracking number (AWB)"><Input value={awb} onChange={(e) => setAwb(e.target.value)} /></Field>
      <Field label="Courier"><Input value={courier} onChange={(e) => setCourier(e.target.value)} /></Field>
      <Field label="Tracking link">
        <Input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://" />
      </Field>
      <Button type="submit" variant="primary" disabled={busy}>Save shipment</Button>
    </form>
  );
};

const ReasonForm = ({ label, buttonLabel, variant, busy, onSubmit, confirmText }) => {
  const [reason, setReason] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirmText || window.confirm(confirmText)) onSubmit(reason.trim());
      }}
    >
      <Field label={label}>
        <Textarea rows={2} required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Button type="submit" variant={variant} disabled={busy || !reason.trim()}>{buttonLabel}</Button>
    </form>
  );
};

const OrderDetail = () => {
  const { orderNumber } = useParams();
  const path = `/orders/${encodeURIComponent(orderNumber)}`;
  const { data: order, setData, error, loading, reload } = useLoad(() => admin.get(path), [path]);
  const { busy, error: actionError, run } = useAction();

  const act = (suffix, body) =>
    run(async () => {
      setData(await admin.post(`${path}${suffix}`, body));
      // Refunds and stock follow in the background; show them when they land.
      setTimeout(reload, 4000);
    });

  const [qikinkStatus, setQikinkStatus] = useState("");
  const readQikink = () =>
    run(async () => {
      const { reading, order: fresh } = await admin.post(`${path}/qikink-sync`);
      setData(fresh);
      setQikinkStatus(reading.found ? `Qikink says: ${reading.status}` : "Qikink has no order with this ID.");
      setTimeout(reload, 4000);
    });

  if (loading && !order) return <Page title={orderNumber}><Spinner /></Page>;
  if (!order) return <Page title={orderNumber}><Notice>{error}</Notice></Page>;

  const canShip = ["CONFIRMED", "SHIPPED"].includes(order.status);
  const address = order.deliveryAddress ?? {};
  const paid = order.paymentMethod === "PREPAID" && order.paymentStatus === "PAID";

  return (
    <Page
      title={order.orderNumber}
      subtitle={`Placed ${dateTime(order.placedAt)}`}
      actions={
        <>
          <LinkButton to={`/orders/${order.orderNumber}/receipt?staff=1`}>Receipt</LinkButton>
          <LinkButton to="/dashboard/orders">All orders</LinkButton>
        </>
      }
    >
      <Notice>{actionError || error}</Notice>
      {order.fulfilment?.partnerCancelRequired && (
        <Notice tone="warning">
          This order may still be at Qikink. Qikink has no cancel API, so cancel it in Qikink&apos;s dashboard, then confirm below.
          <span className="block mt-2">
            <Button disabled={busy} onClick={() => act("/partner-cancelled")}>I cancelled it at Qikink</Button>
          </span>
        </Notice>
      )}
      {order.fulfilment?.status === "MANUAL_REVIEW" && (
        <Notice tone="warning">
          Sending this order to Qikink failed {order.fulfilment.attempts} times
          {order.fulfilment.lastError ? ` (${order.fulfilment.lastError})` : ""}.
          <span className="block mt-2">
            <Button disabled={busy} onClick={() => act("/retry-fulfilment")}>Try again</Button>
          </span>
        </Notice>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Items">
            <ul className="divide-y divide-gray-100">
              {order.lines.map((line) => (
                <li key={line.sku} className="flex justify-between gap-4 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block text-gray-900">{line.name}</span>
                    <span className="block text-xs text-gray-500 break-all">{line.sku} × {line.quantity}</span>
                  </span>
                  <span className="whitespace-nowrap">{rupees(line.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Row label="Subtotal">{rupees(order.subtotal)}</Row>
              {order.discount?.amount > 0 && <Row label="Discount">-{rupees(order.discount)}</Row>}
              {order.codFee && <Row label="COD fee">{rupees(order.codFee)}</Row>}
              {order.tax && <Row label="Tax included">{rupees(order.tax)}</Row>}
              <Row label="Total"><strong>{rupees(order.grandTotal)}</strong></Row>
            </div>
          </Card>

          {order.returns?.length > 0 && (
            <Card title="Returns" actions={<LinkButton to="/dashboard/returns">Manage returns</LinkButton>}>
              <ul className="space-y-2 text-sm">
                {order.returns.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">{item.items.map((line) => `${line.name} × ${line.quantity}`).join(", ")}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">{rupees(item.refund)} <Badge value={item.status} /></span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="History">
            <ol className="space-y-3">
              {order.history.map((entry, index) => (
                <li key={index} className="text-sm">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge value={entry.to} />
                    <span className="text-xs text-gray-500">{dateTime(entry.at)} · {entry.actor?.type ?? "—"}</span>
                  </span>
                  {entry.reason && <span className="block mt-1 text-gray-600 break-words">{entry.reason}</span>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Status">
            <Row label="Order"><Badge value={order.status} /></Row>
            <Row label="Payment">{order.paymentMethod} · <Badge value={order.paymentStatus} /></Row>
            <Row label="Qikink order">{order.partnerOrderId}</Row>
            <Row label="Sent to Qikink"><Badge value={order.fulfilment?.status} /></Row>
            {order.cancelReason && <Row label="Cancel reason">{order.cancelReason}</Row>}
            {order.refund && (
              <>
                <Row label="Refund"><Badge value={order.refund.status} /></Row>
                <Row label="Refund amount">{rupees(order.refund.amountPaise)}</Row>
                <Row label="Razorpay refund">{order.refund.gatewayRefundId}</Row>
              </>
            )}
          </Card>

          <Card title="Customer">
            <p className="text-sm text-gray-900">{address.fullName}</p>
            <p className="text-sm text-gray-600 break-words">{address.email}</p>
            <p className="text-sm text-gray-600">{address.phone}</p>
            <p className="mt-2 text-sm text-gray-600">
              {[address.line1, address.line2, address.landmark].filter(Boolean).join(", ")}
              <br />
              {address.city}, {address.state} - {address.pincode}
            </p>
          </Card>

          <Card title="Shipment">
            <Row label="Status"><Badge value={order.shipment?.status} /></Row>
            {order.shipment && (
              <div className="py-2">
                <Button disabled={busy} onClick={readQikink}>Check Qikink now</Button>
                {qikinkStatus && <p role="status" className="mt-2 text-xs text-gray-600">{qikinkStatus}</p>}
              </div>
            )}
            <Row label="AWB">{order.shipment?.awb}</Row>
            <Row label="Courier">{order.shipment?.courier}</Row>
            {order.shipment?.trackingUrl && (
              <Row label="Tracking">
                <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Open</a>
              </Row>
            )}
            {canShip && order.shipment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <ShipmentForm key={order.status} order={order} busy={busy} onSubmit={(body) => act("/shipment", body)} />
              </div>
            )}
          </Card>

          {order.canResolveDispute && (
            <Card title="Resolve dispute">
              <ReasonForm label="Why is this order fine?" buttonLabel="Confirm order" variant="primary" busy={busy} onSubmit={(reason) => act("/resolve-dispute", { reason })} />
            </Card>
          )}

          {order.canCancel && (
            <Card title="Cancel order">
              <ReasonForm
                label="Reason (kept internally)"
                buttonLabel={paid ? "Cancel and refund" : "Cancel order"}
                variant="danger"
                busy={busy}
                confirmText={paid ? `Cancel ${order.orderNumber} and refund ${rupees(order.grandTotal)}?` : `Cancel ${order.orderNumber}?`}
                onSubmit={(reason) => act("/cancel", { reason })}
              />
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
};

export default OrderDetail;
