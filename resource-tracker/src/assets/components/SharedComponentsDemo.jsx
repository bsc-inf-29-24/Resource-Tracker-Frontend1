import { useMemo, useState } from "react";
import {
  PageHeading, Button, StatusCard, StatusCardGrid, DataTable, statusColumn,
  SearchFilterBar, ConfirmDialog, TextField, SelectField, TextAreaField, ErrorMessage, EmptyState,
} from "./index";
import { DocumentIcon } from "./icons";

const REQUESTS = [
  { id: "RT-0401", resource: "Laptop", project: "Uni App", date: "2025-10-09", status: "Pending" },
  { id: "RT-0456", resource: "Pens", project: "Lab tech", date: "2025-10-05", status: "Pending" },
  { id: "RT-9901", resource: "Office chairs", project: "ICT labs", date: "2025-10-05", status: "Queried" },
  { id: "RT-0402", resource: "Printer", project: "S.C office", date: "2025-10-01", status: "Approved" },
  { id: "RT-0471", resource: "Markers", project: "Lab tech", date: "2025-09-19", status: "Pending" },
  { id: "RT-0201", resource: "Projector", project: "Lab tech", date: "2025-09-07", status: "Declined" },
];

const COLUMNS = [
  { key: "id", header: "Request ID" },
  { key: "resource", header: "Resource" },
  { key: "project", header: "Project" },
  { key: "date", header: "Date" },
  statusColumn("status"),
];

export default function SharedComponentsDemo() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "" });
  const [page, setPage] = useState(1);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [form, setForm] = useState({ item: "", dept: "", reason: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const filtered = useMemo(() => REQUESTS.filter((r) =>
    (!filters.status || r.status === filters.status) &&
    (!search || `${r.id} ${r.resource} ${r.project}`.toLowerCase().includes(search.toLowerCase()))
  ), [search, filters]);

  const pageSize = 4;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const count = (s) => REQUESTS.filter((r) => r.status === s).length;

  return (
    <main className="rt-root" style={{ background: "var(--rt-bg)", padding: 24, display: "grid", gap: 24 }}>
      <PageHeading
        title="Hello, Wanangwa"
        subtitle="Manage your resource request and track their progress"
        actions={<Button>+ Create Resource Request</Button>}
      />

      <StatusCardGrid>
        <StatusCard label="Total Request" value={REQUESTS.length} icon={<DocumentIcon />} />
        <StatusCard label="Pending" value={count("Pending")} icon={<DocumentIcon />} onClick={() => setFilters({ status: "Pending" })} />
        <StatusCard label="Queried" value={count("Queried")} icon={<DocumentIcon />} onClick={() => setFilters({ status: "Queried" })} />
        <StatusCard label="Approved" value={count("Approved")} icon={<DocumentIcon />} onClick={() => setFilters({ status: "Approved" })} />
      </StatusCardGrid>

      <SearchFilterBar
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by ID, resource or project"
        filters={[{ name: "status", label: "Status", options: ["Pending", "Queried", "Approved", "Declined"] }]}
        filterValues={filters} onFilterChange={(n, v) => { setFilters({ ...filters, [n]: v }); setPage(1); }}
        onReset={() => { setSearch(""); setFilters({ status: "" }); setPage(1); }}
      />

      <DataTable
        title="My Request" columns={COLUMNS} rows={pageRows} rowKey="id"
        page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage}
        emptyTitle="No requests match your search" emptyDescription="Try a different keyword or clear the filters."
      />

      <section className="rt-card" style={{ display: "grid", gap: 16 }}>
        <h2 className="rt-card__title" style={{ margin: 0 }}>Resource Details</h2>
        <TextField label="Item Name" placeholder="e.g. Laptop, Projector" value={form.item} onChange={set("item")}
          required error={form.item === "" ? "Enter the item name" : undefined} />
        <SelectField label="Department" options={["ICT", "Science", "Administration"]} placeholder="Select department" value={form.dept} onChange={set("dept")} />
        <TextAreaField label="Purpose / Justification" placeholder="Explaining why this resource is needed..." value={form.reason} onChange={set("reason")} />
      </section>

      <ErrorMessage message="The server did not respond. Check your connection and try again." onRetry={() => {}} />
      <EmptyState title="No requests yet" description="Create your first resource request to start tracking it here." actionLabel="Create Resource Request" onAction={() => {}} />

      <div><Button variant="outline" onClick={() => setLogoutOpen(true)}>Logout</Button></div>
      <ConfirmDialog
        open={logoutOpen} title="Are you sure you want to Logout ?" confirmLabel="Logout"
        onCancel={() => setLogoutOpen(false)} onConfirm={() => setLogoutOpen(false)}
      />
    </main>
  );
}
