import { SearchIcon, ResetIcon } from '../icons/Icons';
import Button from '../layout/Button';

/**
 * Search box + dropdown filters + optional date range + reset.
 * filters: [{ name, label, options, value }]
 * onFilterChange(name, value)
 */
export default function FilterToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  onFilterChange,
  dateFrom,
  dateTo,
  onDateChange,       // (field: 'from' | 'to', value: string)
  onReset,
}) {
  return (
    <div className="rt-filter" role="search">
      <div className="rt-filter__search">
        <SearchIcon />
        <input
          type="search"
          className="rt-control"
          value={search}
          placeholder={searchPlaceholder}
          aria-label="Search"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <div className="rt-field" key={f.name}>
          <label className="rt-field__label" htmlFor={`rt-f-${f.name}`}>{f.label}</label>
          <select id={`rt-f-${f.name}`} className="rt-control" value={f.value ?? ''} onChange={(e) => onFilterChange?.(f.name, e.target.value)}>
            <option value="">All</option>
            {f.options.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
        </div>
      ))}
      {onDateChange && (
        <>
          <div className="rt-field">
            <label className="rt-field__label" htmlFor="rt-f-from">From</label>
            <input id="rt-f-from" type="date" className="rt-control" value={dateFrom ?? ''} onChange={(e) => onDateChange('from', e.target.value)} />
          </div>
          <div className="rt-field">
            <label className="rt-field__label" htmlFor="rt-f-to">To</label>
            <input id="rt-f-to" type="date" className="rt-control" value={dateTo ?? ''} onChange={(e) => onDateChange('to', e.target.value)} />
          </div>
        </>
      )}
      {onReset && <Button variant="secondary" icon={<ResetIcon size={18} />} onClick={onReset}>Reset</Button>}
    </div>
  );
}
