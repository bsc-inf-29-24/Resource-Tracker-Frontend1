/**
 * Page title block, e.g. "Hello, Wanangwa" + subtitle + "Create Resource Request" button.
 * breadcrumbs: [{ label, href? }]   actions: React node(s) shown on the right
 */
export default function PageHeading({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <header className="rt-root rt-heading">
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="rt-heading__crumbs">
            {breadcrumbs.map((c, i) => (
              <span key={c.label}>
                {i > 0 && <span aria-hidden="true"> › </span>}
                {c.href ? <a href={c.href}>{c.label}</a> : c.label}
              </span>
            ))}
          </nav>
        )}
        <h1 className="rt-heading__title">{title}</h1>
        {subtitle && <p className="rt-heading__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="rt-heading__actions">{actions}</div>}
    </header>
  );
}
