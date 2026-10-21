import { useEffect, useState } from "react";
import { TextField, SelectField, SearchIcon } from "../forms/FormControls";
import Button from "../forms/Button";

/**
 * Search box + dropdown filters + reset.
 *  filters: [{ name: "status", label: "Status", options: ["Pending", ...], placeholder? }]
 *  filterValues: { status: "Pending" }
 * Search is debounced so the API (NestJS) is not hit on every key press.
 */
export default function SearchFilterBar({
  search = "", onSearchChange, searchPlaceholder = "Search...",
  filters = [], filterValues = {}, onFilterChange, onReset, debounceMs = 350,
}) {
  const [text, setText] = useState(search);
  useEffect(() => setText(search), [search]);
  useEffect(() => {
    if (text === search) return;
    const t = setTimeout(() => onSearchChange?.(text), debounceMs);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActive = text !== "" || Object.values(filterValues).some(Boolean);

  return (
    <div className="rt-root rt-filterbar" role="search">
      <div className="rt-filterbar__search">
        <TextField
          label="Search" type="search" value={text} placeholder={searchPlaceholder}
          icon={<SearchIcon />} onChange={(e) => setText(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <div key={f.name} className="rt-filterbar__filter">
          <SelectField
            label={f.label} options={f.options} placeholder={f.placeholder ?? `All`}
            value={filterValues[f.name] ?? ""} onChange={(e) => onFilterChange?.(f.name, e.target.value)}
          />
        </div>
      ))}
      <Button variant="outline" onClick={() => { setText(""); onReset?.(); }} disabled={!hasActive}>Reset</Button>
    </div>
  );
}
