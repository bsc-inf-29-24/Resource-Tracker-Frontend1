import { useState } from 'react';
import './ComponentShowcase.css';
import * as RT from './assets/components';

const {
  Button, PageHeader, Breadcrumb, StatusTag, StatusCard, DataTable, Pagination, FilterToolbar,
  ConfirmModal, Spinner, LoadingState, Skeleton, EmptyState, ErrorMessage, InlineError,
  FormSection, FormActions, TextInput, SelectInput, TextArea, DateSelect,
  FormField, SegmentedControl,
  RequestIcon, FileClockIcon, FileSearchIcon, FileCheckIcon, FileCrossIcon, ResetIcon, PlusIcon,
} = RT;

const STATUSES = ['Submitted', 'Pending', 'Queried', 'Approved', 'Rejected'];

const ROWS = [
  { id: 'RT-0401', resource: 'Laptop', project: 'Uni App', date: '2025-10-09', status: 'Pending' },
  { id: 'RT-0456', resource: 'Pens', project: 'Lab tech', date: '2025-10-05', status: 'Approved' },
  { id: 'RT-9901', resource: 'Office chairs', project: 'ICT labs', date: '2025-10-05', status: 'Queried' },
  { id: 'RT-0201', resource: 'Projector', project: 'Lab tech', date: '2025-09-07', status: 'Rejected' },
];

const COLUMNS = [
  { key: 'id', header: 'Request ID' },
  { key: 'resource', header: 'Resource' },
  { key: 'project', header: 'Project' },
  { key: 'date', header: 'Date' },
  { key: 'status', header: 'Status', type: 'status' },
];

/* Wrapper that gives every demo a title, a short description and a white stage. */
function Demo({ id, title, note, children }) {
  return (
    <section id={id} className="sc-demo">
      <h2>{title}</h2>
      {note && <p className="sc-note">{note}</p>}
      <div className="sc-stage">{children}</div>
    </section>
  );
}

function Label({ children }) {
  return <h3 className="sc-label">{children}</h3>;
}

export default function ComponentShowcase() {
  // table + pagination
  const [page, setPage] = useState(1);
  const [clicked, setClicked] = useState('');

  // filter toolbar
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // form controls
  const [form, setForm] = useState({ item: '', price: '', dept: '', why: '' });
  const [date, setDate] = useState({ day: 1, month: 8, year: new Date().getFullYear() });

  const [urgency, setUrgency] = useState('Medium');

  // dialogs
  const [dialog, setDialog] = useState(null); // 'confirm' | 'danger' | null
  const [busy, setBusy] = useState(false);

  const iconNames = Object.keys(RT).filter((k) => k.endsWith('Icon')).sort();

  const sections = [
    ['buttons', 'Buttons'], ['header', 'Page header'], ['status', 'Status tags'], ['cards', 'Status cards'],
    ['tables', 'Data table'], ['filters', 'Filter toolbar'], ['forms', 'Form controls'],
    ['dialogs', 'Dialogs'], ['feedback', 'Feedback states'], ['icons', 'Icons'],
  ];

  return (
    <div className="sc-page">
      <header className="sc-top">
        <h1>Resource Tracker components</h1>
        <p>Every reusable component, with its variants and states.</p>
        <nav aria-label="Sections">
          {sections.map(([id, label]) => (<a key={id} href={`#${id}`}>{label}</a>))}
        </nav>
      </header>

      {/* ---------------- Buttons ---------------- */}
      <Demo id="buttons" title="Button" note="variant: primary | secondary | danger. size: md | lg. Also block, icon, disabled.">
        <div className="sc-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button icon={<PlusIcon size={18} />}>With icon</Button>
          <Button variant="secondary" icon={<ResetIcon size={18} />}>Reset</Button>
          <Button size="lg">Large</Button>
        </div>
        <Label>Block</Label>
        <Button block>Full-width button</Button>
      </Demo>

      {/* ---------------- Page header ---------------- */}
      <Demo id="header" title="PageHeader and Breadcrumb">
        <div className="sc-bleed"><Breadcrumb crumbs={[{ label: 'Request', href: '#header' }, { label: 'Create' }]} /></div>
        <PageHeader
          title="Hello, Wanangwa"
          description="Manage your resource request and track their progress"
          actions={<Button size="lg" icon={<PlusIcon size={20} />}>Create Resource Request</Button>}
        />
        <PageHeader title="Team members" description="View all team allocated members" />
      </Demo>

      {/* ---------------- Status tag ---------------- */}
      <Demo id="status" title="StatusTag" note="Each status has its own icon, and the icon takes the same colour as the text. 'Declined' is shown as Rejected.">
        <div className="sc-row">
          {STATUSES.map((s) => <StatusTag key={s} status={s} />)}
          <StatusTag status="Declined" />
        </div>
      </Demo>

      {/* ---------------- Status card ---------------- */}
      <Demo id="cards" title="StatusCard" note="tone colours the icon, title and count to match the tag. Static, clickable (onClick) or a link (href). The grid shares the row and wraps when the window shrinks.">
        <div className="rt-card-grid">
          <StatusCard title="Total Request" count={32} icon={<RequestIcon />} />
          <StatusCard title="Pending" count={12} tone="pending" icon={<FileClockIcon />} onClick={() => setClicked('Pending card clicked')} />
          <StatusCard title="Queried" count={14} tone="queried" icon={<FileSearchIcon />} href="#cards" />
          <StatusCard title="Approved" count={7} tone="approved" icon={<FileCheckIcon />} />
          <StatusCard title="Rejected" count={3} tone="rejected" icon={<FileCrossIcon />} />
        </div>
        {clicked && <p className="sc-note" role="status">{clicked}</p>}
      </Demo>

      {/* ---------------- Data table ---------------- */}
      <Demo id="tables" title="DataTable and Pagination">
        <Label>Default, with pagination and clickable rows</Label>
        <DataTable
          columns={COLUMNS}
          data={ROWS}
          caption="Example requests"
          onRowClick={(r) => setClicked(`Opened ${r.id}`)}
          pagination={{ page, pageSize: 4, total: 15, onPageChange: setPage }}
        />
        <Label>Loading</Label>
        <DataTable columns={COLUMNS} data={[]} loading pagination={{ page: 1, pageSize: 3, total: 0, onPageChange() {} }} />
        <Label>Empty</Label>
        <DataTable columns={COLUMNS} data={[]} emptyTitle="No requests yet" emptyMessage="Requests you create will appear here." />
        <Label>Error</Label>
        <DataTable columns={COLUMNS} data={[]} error="The server did not respond. Check your connection and try again." onRetry={() => setClicked('Retry clicked')} />
        <Label>Pagination on its own</Label>
        <Pagination page={2} pageSize={5} total={15} onPageChange={() => {}} />
      </Demo>

      {/* ---------------- Filter toolbar ---------------- */}
      <Demo id="filters" title="FilterToolbar" note="Search, dropdown filters, optional date range (add onDateChange) and Reset.">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by ID, resource or project"
          filters={[{ name: 'status', label: 'Status', options: STATUSES, value: status }]}
          onFilterChange={(_, v) => setStatus(v)}
          dateFrom={from}
          dateTo={to}
          onDateChange={(f, v) => (f === 'from' ? setFrom(v) : setTo(v))}
          onReset={() => { setSearch(''); setStatus(''); setFrom(''); setTo(''); }}
        />
        <p className="sc-note">Current values: search "{search}", status "{status || 'All'}", from "{from || '-'}", to "{to || '-'}"</p>
      </Demo>

      {/* ---------------- Forms ---------------- */}
      <Demo id="forms" title="Form controls">
        <FormSection icon={<RequestIcon />} title="Resource Details" hint="Enter the resource item details">
          <TextInput label="Item Name" placeholder="e.g Laptop, Projector" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          <TextInput label="Supplier" optional placeholder="e.g Xyzozell tm company" />
          <TextInput label="Estimated Price" type="number" placeholder="e.g 150000" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={form.price && Number(form.price) < 1 ? 'Enter a price above 0.' : undefined} />
          <SelectInput label="Department" placeholder="Select department" options={['ICT', 'Finance', 'Administration']}
            value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} />
          <TextInput label="Field with error" defaultValue="abc" error="This is how a validation message looks." />
          <DateSelect value={date} onChange={setDate} />
          <TextArea label="Purpose / Justification" placeholder="Explaining why this resource is needed…" value={form.why}
            onChange={(e) => setForm({ ...form, why: e.target.value })} />
        </FormSection>
        <FormActions>
          <Button variant="secondary" icon={<ResetIcon size={20} />} onClick={() => setForm({ item: '', price: '', dept: '', why: '' })}>Reset</Button>
          <Button>Review Request</Button>
        </FormActions>
        <Label>FormField with a custom control (SegmentedControl)</Label>
        <FormField label="Urgency">
          {(a11y) => (
            <SegmentedControl {...a11y} label="Urgency" options={['Low', 'Medium', 'High']} value={urgency} onChange={setUrgency} />
          )}
        </FormField>
      </Demo>

      {/* ---------------- Dialogs ---------------- */}
      <Demo id="dialogs" title="ConfirmModal" note="Press Escape or click the dark backdrop to close.">
        <div className="sc-row">
          <Button onClick={() => setDialog('confirm')}>Open confirmation</Button>
          <Button variant="danger" onClick={() => setDialog('danger')}>Open danger dialog</Button>
        </div>
        <ConfirmModal
          open={dialog === 'confirm'}
          title="Approve this request?"
          message="The requester will be notified straight away."
          confirmLabel="Approve request"
          loading={busy}
          onConfirm={() => { setBusy(true); setTimeout(() => { setBusy(false); setDialog(null); }, 900); }}
          onCancel={() => setDialog(null)}
        />
        <ConfirmModal
          open={dialog === 'danger'}
          variant="danger"
          title="Delete this request?"
          message="RT-0401 (Laptop) will be permanently removed. This cannot be undone."
          confirmLabel="Delete request"
          onConfirm={() => setDialog(null)}
          onCancel={() => setDialog(null)}
        />
      </Demo>

      {/* ---------------- Feedback ---------------- */}
      <Demo id="feedback" title="Loading, empty and error states">
        <Label>Spinner</Label>
        <div className="sc-row"><Spinner /></div>
        <Label>LoadingState</Label>
        <LoadingState message="Loading your requests…" />
        <Label>Skeleton</Label>
        <div className="sc-stack"><Skeleton width="60%" /><Skeleton /><Skeleton width="80%" height={24} /></div>
        <Label>EmptyState</Label>
        <EmptyState title="No requests yet" message="Create your first resource request to get started." actionLabel="Create Resource Request" onAction={() => {}} />
        <Label>ErrorMessage</Label>
        <ErrorMessage message="We could not load this section." onRetry={() => {}} />
        <Label>InlineError</Label>
        <InlineError>Your request could not be saved. Try again.</InlineError>
      </Demo>

      {/* ---------------- Icons ---------------- */}
      <Demo id="icons" title="Icons" note="Every icon exported from icons/Icons.jsx. They inherit the text colour and accept size.">
        <ul className="sc-icons">
          {iconNames.map((name) => {
            const Icon = RT[name];
            return (
              <li key={name}>
                <Icon size={32} />
                <span>{name}</span>
              </li>
            );
          })}
        </ul>
      </Demo>
    </div>
  );
}
