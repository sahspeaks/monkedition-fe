import { useState } from "react";
import { admin, query } from "../api";
import { Card, Notice, Page, Pagination, Spinner, Table, dateTime, useLoad } from "../ui";

const AuditLog = () => {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useLoad(() => admin.get(`/audit${query({ page })}`), [page]);

  return (
    <Page title="Activity log" subtitle="Every change made through this dashboard">
      <Notice>{error}</Notice>
      <Card>
        {loading && !data ? <Spinner /> : (
          <>
            <Table
              rows={data?.items}
              rowKey={(row) => row._id}
              empty="No changes yet."
              columns={[
                { label: "When", render: (a) => <span className="whitespace-nowrap">{dateTime(a.at)}</span> },
                { label: "Staff", render: (a) => <span className="break-all">{a.actorEmail ?? a.actorId ?? "—"}</span> },
                { label: "Action", render: (a) => a.method },
                { label: "What", render: (a) => <span className="break-all">{a.path.replace("/api/v2/admin", "")}</span> },
                { label: "Result", render: (a) => (a.status < 400 ? "Done" : `Failed (${a.status})`) },
              ]}
            />
            <Pagination page={data?.page} onChange={setPage} />
          </>
        )}
      </Card>
    </Page>
  );
};

export default AuditLog;
