import { Link } from "react-router-dom";
import { admin } from "../api";
import { Badge, Card, Notice, Page, Spinner, rupees, useLoad } from "../ui";

const Stat = ({ label, value, to, warn }) => (
  <Link
    to={to}
    className={`block bg-white border rounded-xl p-4 hover:shadow-sm ${warn ? "border-orange-400" : "border-gray-200"}`}
  >
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${warn ? "text-orange-700" : "text-gray-900"}`}>{value}</p>
  </Link>
);

const STATUS_ORDER = [
  "PENDING_PAYMENT",
  "FULFILMENT_REQUESTED",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "DISPUTED",
  "CANCELLED",
  "REFUNDED",
];

const Overview = () => {
  const { data, error, loading } = useLoad(() => admin.get("/overview"), []);
  if (loading && !data) return <Page title="Overview"><Spinner /></Page>;
  return (
    <Page title="Overview" subtitle="What needs attention today">
      <Notice>{error}</Notice>
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Stat label="Orders today" value={data.orders.sinceOrders} to="/dashboard/orders" />
            <Stat label="Sales today" value={rupees(data.orders.sinceRevenue)} to="/dashboard/orders" />
            <Stat label="To process" value={data.orders.byStatus.CONFIRMED ?? 0} to="/dashboard/orders?status=CONFIRMED" />
            <Stat label="Low stock (10 or fewer)" value={data.lowStock} to="/dashboard/inventory" warn={data.lowStock > 0} />
            <Stat label="Open alerts" value={data.openAlerts} to="/dashboard/alerts" warn={data.openAlerts > 0} />
            <Stat
              label="Failed emails and stuck events"
              value={data.failedEmails + data.deadEvents}
              to={data.failedEmails ? "/dashboard/emails?status=FAILED" : "/dashboard/alerts"}
              warn={data.failedEmails + data.deadEvents > 0}
            />
          </div>
          <Card title="Orders by status">
            <div className="flex flex-wrap gap-3">
              {STATUS_ORDER.map((status) => (
                <Link key={status} to={`/dashboard/orders?status=${status}`} className="flex items-center gap-2 text-sm hover:underline">
                  <Badge value={status} />
                  <span className="font-medium">{data.orders.byStatus[status] ?? 0}</span>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </Page>
  );
};

export default Overview;
