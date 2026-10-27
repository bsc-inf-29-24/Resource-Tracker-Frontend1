import { HomeIcon, ChevronRightIcon } from '../icons/Icons';

/**
 * Top breadcrumb bar (Home > Page) – put it above the page content.
 * crumbs: [{ label, href? }]  – the last item is the current page.
 */
export function Breadcrumb({ crumbs = [], homeHref = '/' }) {
  return (
    <nav className="rt-breadcrumb" aria-label="Breadcrumb">
      <a href={homeHref} aria-label="Home"><HomeIcon size={22} /></a>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.label} style={{ display: 'contents' }}>
            <ChevronRightIcon size={16} />
            {last || !c.href
              ? <span aria-current={last ? 'page' : undefined}>{c.label}</span>
              : <a href={c.href}>{c.label}</a>}
          </span>
        );
      })}
    </nav>
  );
}

/** Page title, description and optional action button(s), e.g. "Hello, Wanangwa" + Create Resource Request. */
export default function PageHeader({ title, description, actions }) {
  return (
    <header className="rt-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </header>
  );
}
