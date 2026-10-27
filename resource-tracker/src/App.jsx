import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  // layout
  Button, PageHeader, Breadcrumb,
  // display
  StatusCard, StatusTag, DataTable, FilterToolbar,
  // dialogs + feedback
  ConfirmModal, EmptyState, LoadingState, ErrorMessage, InlineError,
  // forms
  FormSection, FormActions, TextInput, SelectInput, TextArea, DateSelect,
  // icons
  DashboardIcon, RequestIcon, TeamIcon, ReportIcon, ProfileIcon, SettingsIcon, LogoutIcon,
  BellIcon, ChevronDownIcon, PlusIcon, ResetIcon, FileClockIcon, FileSearchIcon, FileCheckIcon,
} from './assets/components';

/* ------------------------------------------------------------------ */
/* Sample data (replace with calls to your NestJS API)                 */
/* ------------------------------------------------------------------ */
const REQUESTS = [
  { id: 'RT-0401', resource: 'Laptop', project: 'Uni App', date: '2025-10-09', status: 'Pending' },
  { id: 'RT-0456', resource: 'Pens', project: 'Lab tech', date: '2025-10-05', status: 'Pending' },
  { id: 'RT-9901', resource: 'Office chairs', project: 'ICT labs', date: '2025-10-05', status: 'Queried' },
  { id: 'RT-0402', resource: 'Printer', project: 'S.C office', date: '2025-10-01', status: 'Approved' },
  { id: 'RT-0471', resource: 'Markers', project: 'Lab tech', date: '2025-09-19', status: 'Pending' },
  { id: 'RT-0201', resource: 'Projector', project: 'Lab tech', date: '2025-09-07', status: 'Rejected' },
  { id: 'RT-0188', resource: 'Router', project: 'ICT labs', date: '2025-09-02', status: 'Approved' },
  { id: 'RT-0170', resource: 'Whiteboard', project: 'Uni App', date: '2025-08-28', status: 'Submitted' },
];

const ACTIVITY = [
  { text: 'Your request RT-0401 is now on pending review', time: '2 hours ago' },
  { text: 'Your RT-0456 was approved', time: '2 days ago' },
  { text: 'Manager added query to RT-0456', time: '5 days ago' },
  { text: 'You submitted request RT-0456', time: '1 week ago' },
  { text: 'Request RT-9087 was rejected', time: '2 weeks ago' },
];

const PAGE_SIZE = 5;

/* ------------------------------------------------------------------ */
/* Shell: sidebar + top bar                                            */
/* ------------------------------------------------------------------ */
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { key: 'request', label: 'Request', icon: RequestIcon },
  { key: 'team', label: 'Team members', icon: TeamIcon },
  { key: 'report', label: 'Report', icon: ReportIcon },
  { key: 'profile', label: 'Profile', icon: ProfileIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

function Sidebar({ current, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <div className="app-logo" aria-label="Resource Tracker">
        <span className="app-logo__mark">RT</span>
        <span className="app-logo__text">Resource<br />Tracker</span>
      </div>
      <nav aria-label="Main">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`app-nav${current === key ? ' is-active' : ''}`}
            aria-current={current === key ? 'page' : undefined}
            onClick={() => onNavigate(key)}
          >
            <Icon size={25} /> {label}
          </button>
        ))}
        <button className="app-nav"><LogoutIcon size={22} /> Logout</button>
      </nav>
      <p className="app-tagline">Smarter resources<br />Better Decisions.</p>
    </aside>
  );
}

function TopBar({ crumb }) {
  return (
    <div className="app-topbar">
      <Breadcrumb crumbs={[{ label: crumb }]} />
      <div className="app-user">
        <BellIcon size={25} />
        <span className="app-avatar">WN</span>
        <span>Wanangwa Nyirenda</span>
        <ChevronDownIcon size={14} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard page                                                      */
/* ------------------------------------------------------------------ */
function DashboardPage({ onCreate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [toDelete, setToDelete] = useState(null);

  // fake API delay so you can see the loading state
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, [error]);

  const filtered = useMemo(
    () => REQUESTS.filter((r) =>
      (!status || r.status === status) &&
      (!search || `${r.id} ${r.resource} ${r.project}`.toLowerCase().includes(search.toLowerCase()))),
    [search, status],
  );
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'id', header: 'Request ID' },
    { key: 'resource', header: 'Resource' },
    { key: 'project', header: 'Project' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status', render: (r) => <StatusTag status={r.status} /> },
    { key: 'actions', header: '', render: (r) => (
      <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setToDelete(r); }}>Delete</Button>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Hello, Wanangwa"
        description="Manage your resource request and track their progress"
        actions={<Button size="lg" icon={<PlusIcon size={20} />} onClick={onCreate}>Create Resource Request</Button>}
      />

      {/* Status cards */}
      <div className="rt-card-grid app-cards">
        <StatusCard title="Total Request" count={32} icon={<RequestIcon />} />
        <StatusCard title="Pending" count={12} tone="pending" icon={<FileClockIcon />} />
        <StatusCard title="Queried" count={14} tone="queried" icon={<FileSearchIcon />} />
        <StatusCard title="Approved" count={7} tone="approved" icon={<FileCheckIcon />} />
      </div>

      <div className="app-grid">
        <section className="rt-panel">
          <h2 className="rt-panel__title">My Request</h2>

          <FilterToolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by ID, resource or project"
            filters={[{ name: 'status', label: 'Status', options: ['Submitted', 'Pending', 'Queried', 'Approved', 'Rejected'], value: status }]}
            onFilterChange={(_, v) => { setStatus(v); setPage(1); }}
            onReset={() => { setSearch(''); setStatus(''); setPage(1); }}
          />

          <DataTable
            caption="My resource requests"
            columns={columns}
            data={rows}
            loading={loading}
            error={error ? 'The server did not respond. Check your connection and try again.' : undefined}
            onRetry={() => setError(false)}
            emptyTitle="No requests match your filters"
            emptyMessage="Try a different search or reset the filters."
            pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
          />

          {/* Review helpers – remove once you are happy with the components */}
          <div className="app-review">
            <Button variant="secondary" onClick={() => setError(true)}>Simulate error</Button>
            <Button variant="secondary" onClick={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 1200); }}>
              Simulate loading
            </Button>
          </div>
        </section>

        <section className="rt-panel">
          <h2 className="rt-panel__title">Recent Activity</h2>
          {loading ? <LoadingState message="Loading activity…" /> : (
            <ul className="app-activity">
              {ACTIVITY.map((a) => (
                <li key={a.text}><strong>{a.text}</strong><span>{a.time}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        variant="danger"
        title="Delete this request?"
        message={toDelete ? `${toDelete.id} (${toDelete.resource}) will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete request"
        onConfirm={() => setToDelete(null)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Create Resource Request page                                        */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  item: '', quantity: '', price: '', supplier: '',
  department: '', team: '', project: '', purpose: '',
  date: { day: 1, month: 8, year: new Date().getFullYear() },
};

function RequestPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.item.trim()) e.item = 'Enter the item name.';
    if (!form.quantity || Number(form.quantity) < 1) e.quantity = 'Enter a quantity of 1 or more.';
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter the estimated price.';
    if (!form.department) e.department = 'Select a department.';
    if (!form.purpose.trim()) e.purpose = 'Explain why this resource is needed.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    setSaving(true);
    setSubmitError('');
    setTimeout(() => { setSaving(false); setConfirm(false); setForm(EMPTY_FORM); }, 900); // replace with API call
  };

  return (
    <>
      <PageHeader title="Create Resource request" />

      <FormSection icon={<RequestIcon />} title="Resource Details" hint="Enter the resource item details">
        <TextInput label="Item Name" placeholder="e.g Laptop, Projector" value={form.item} onChange={set('item')} error={errors.item} />
        <TextInput label="Quantity" type="number" placeholder="e.g 2" value={form.quantity} onChange={set('quantity')} error={errors.quantity} />
        <TextInput label="Estimated Price" type="number" placeholder="e.g 150000" value={form.price} onChange={set('price')} error={errors.price} />
        <TextInput label="Supplier" optional placeholder="e.g Xyzozell tm company" value={form.supplier} onChange={set('supplier')} />
      </FormSection>

      <FormSection icon={<TeamIcon />} title="Request Information" hint="Select the relevant department, project and team">
        <SelectInput label="Department" placeholder="Select department" options={['ICT', 'Finance', 'Administration']}
          value={form.department} onChange={set('department')} error={errors.department} />
        <SelectInput label="Project" placeholder="Select project" options={['Uni App', 'Lab tech', 'ICT labs']}
          value={form.project} onChange={set('project')} />
        <SelectInput label="Requesting Team" placeholder="Select team" options={['Development', 'Support', 'Operations']}
          value={form.team} onChange={set('team')} />
        <DateSelect value={form.date} onChange={(date) => setForm({ ...form, date })} />
        <TextArea label="Purpose / Justification" placeholder="Explaining why this resource is needed…"
          value={form.purpose} onChange={set('purpose')} error={errors.purpose} />
      </FormSection>

      <InlineError>{submitError}</InlineError>

      <FormActions>
        <Button variant="secondary" icon={<ResetIcon size={20} />} onClick={() => { setForm(EMPTY_FORM); setErrors({}); }}>Reset</Button>
        <Button onClick={() => validate() && setConfirm(true)}>Review Request</Button>
      </FormActions>

      <ConfirmModal
        open={confirm}
        title="Submit this request?"
        message="Your manager will be notified and you can track progress from the dashboard."
        confirmLabel="Submit request"
        loading={saving}
        onConfirm={submit}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Team members page (empty state until the API is ready)              */
/* ------------------------------------------------------------------ */
function TeamPage() {
  return (
    <>
      <PageHeader title="Team members" description="View all team allocated members" />
      <section className="rt-panel">
        <EmptyState
          icon={<TeamIcon size={56} />}
          title="No team members yet"
          message="Members allocated to your team will show up here."
        />
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  const [page, setPage] = useState('dashboard');
  const label = NAV.find((n) => n.key === page)?.label ?? 'Dashboard';

  return (
    <div className="app-shell">
      <Sidebar current={page} onNavigate={setPage} />
      <div className="app-main">
        <TopBar crumb={label} />
        <main className="app-content">
          {page === 'dashboard' && <DashboardPage onCreate={() => setPage('request')} />}
          {page === 'request' && <RequestPage />}
          {page === 'team' && <TeamPage />}
          {['report', 'profile', 'settings'].includes(page) && (
            <EmptyState title={`${label} is coming soon`} message="This page has not been built yet." />
          )}
        </main>
      </div>
    </div>
  );
}
