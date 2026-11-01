import { useState } from "react";
import { admin, query } from "../api";
import { Badge, Button, Card, Notice, Page, Pagination, Select, Spinner, Table, dateTime, useAction, useLoad } from "../ui";

const Reviews = () => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad(() => admin.get(`/reviews${query({ status, page })}`), [status, page]);
  const { busy, error: actionError, run } = useAction();
  const setVisibility = (review, next) =>
    run(async () => {
      await admin.patch(`/reviews/${review.id}`, { status: next });
      await reload();
    });
  const remove = (review) => {
    if (!window.confirm("Delete this review for good?")) return;
    run(async () => {
      await admin.delete(`/reviews/${review.id}`);
      await reload();
    });
  };

  return (
    <Page title="Reviews" subtitle="Only customers whose order arrived can review. LEGACY reviews came from the old system, with no proof of purchase, and are hidden.">
      <Notice>{error || actionError}</Notice>
      <Card>
        <div className="w-full sm:w-56 mb-4">
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All reviews</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
            <option value="LEGACY">Legacy</option>
          </Select>
        </div>
        {loading && !data ? <Spinner /> : (
          <>
            <Table
              rows={data?.items}
              rowKey={(row) => row.id}
              empty="No reviews yet."
              columns={[
                { label: "Rating", render: (r) => `${r.rating}/5` },
                { label: "Comment", render: (r) => <span className="break-words">{r.comment || "—"}</span> },
                { label: "By", render: (r) => r.authorName },
                { label: "Status", render: (r) => <Badge value={r.status} /> },
                { label: "Date", render: (r) => <span className="whitespace-nowrap">{dateTime(r.createdAt)}</span> },
                {
                  label: "",
                  className: "text-right whitespace-nowrap",
                  render: (r) => (
                    <span className="inline-flex gap-2">
                      <Button disabled={busy} onClick={() => setVisibility(r, r.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")}>
                        {r.status === "PUBLISHED" ? "Hide" : "Publish"}
                      </Button>
                      <Button variant="danger" disabled={busy} onClick={() => remove(r)}>Delete</Button>
                    </span>
                  ),
                },
              ]}
            />
            <Pagination page={data?.page} onChange={setPage} />
          </>
        )}
      </Card>
    </Page>
  );
};

export default Reviews;
