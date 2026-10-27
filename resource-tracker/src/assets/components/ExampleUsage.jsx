import { useState } from 'react';
import {
  PageHeader, Breadcrumb, Button, StatusCard, DataTable, StatusTag, ConfirmModal,
  FormSection, FormActions, TextInput, SelectInput, TextArea, DateSelect,
  RequestIcon, ReportIcon, PlusIcon, ResetIcon, TeamIcon,
} from './index';

const rows = [
  { id: 'RT-0401', resource: 'Laptop', project: 'Uni App', date: '2025-10-09', status: 'Pending' },
  { id: 'RT-0456', resource: 'Pens', project: 'Lab tech', date: '2025-10-05', status: 'Pending' },
  { id: 'RT-9901', resource: 'Office chairs', project: 'ICT labs', date: '2025-10-05', status: 'Queried' },
  { id: 'RT-0201', resource: 'Projector', project: 'Lab tech', date: '2025-09-07', status: 'Declined' },
];

const columns = [
  { key: 'id', header: 'Request ID' },
  { key: 'resource', header: 'Resource' },
  { key: 'project', header: 'Project' },
  { key: 'date', header: 'Date' },
  { key: 'status', header: 'Status', render: (r) => <StatusTag status={r.status} /> },
];

/** Dashboard example – mirrors the Dashboard screen. */
export function DashboardExample() {
  const [page, setPage] = useState(1);
  return (
    <>
      <Breadcrumb crumbs={[{ label: 'Dashboard' }]} />
      <main style={{ padding: 24 }}>
        <PageHeader
          title="Hello, Wanangwa"
          description="Manage your resource request and track their progress"
          actions={<Button size="lg" icon={<PlusIcon size={20} />}>Create Resource Request</Button>}
        />
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatusCard title="Total Request" count={32} icon={<RequestIcon size={48} />} href="/requests" />
          <StatusCard title="Pending" count={12} icon={<ReportIcon size={48} />} />
          <StatusCard title="Queried" count={14} icon={<TeamIcon size={48} />} />
        </div>
        <section className="rt-panel">
          <h2 className="rt-panel__title">My Request</h2>
          <DataTable
            columns={columns}
            data={rows}
            pagination={{ page, pageSize: 5, total: 15, onPageChange: setPage }}
          />
        </section>
      </main>
    </>
  );
}

/** Form example – mirrors the Create Resource Request screen. */
export function RequestFormExample() {
  const [f, setF] = useState({ item: '', qty: '', price: '', supplier: '', why: '', date: { day: 1, month: 8, year: 2026 } });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Breadcrumb crumbs={[{ label: 'Request' }]} />
      <main style={{ padding: 24 }}>
        <PageHeader title="Create Resource request" />
        <FormSection icon={<RequestIcon />} title="Resource Details" hint="Enter the resource item details">
          <TextInput label="Item Name" placeholder="e.g Laptop, Projector" value={f.item} onChange={set('item')} />
          <TextInput label="Quantity" placeholder="e.g 2" value={f.qty} onChange={set('qty')} />
          <TextInput label="Estimated Price" placeholder="e.g 150000" value={f.price} onChange={set('price')} />
          <TextInput label="Supplier" optional placeholder="e.g Xyzozell tm company" value={f.supplier} onChange={set('supplier')} />
        </FormSection>
        <FormSection icon={<TeamIcon />} title="Request Information" hint="Select the relevant department, project and team">
          <SelectInput label="Department" placeholder="Select department" options={['ICT', 'Finance']} />
          <DateSelect value={f.date} onChange={(date) => setF({ ...f, date })} />
          <TextArea label="Purpose / Justification" placeholder="Explaining why this resource is needed…" value={f.why} onChange={set('why')} />
        </FormSection>
        <FormActions>
          <Button variant="secondary" icon={<ResetIcon size={20} />}>Reset</Button>
          <Button onClick={() => setConfirm(true)}>Review Request</Button>
        </FormActions>
      </main>
      <ConfirmModal
        open={confirm}
        title="Submit this request?"
        message="Your manager will be notified and you can track progress from the dashboard."
        confirmLabel="Submit request"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
