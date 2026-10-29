import styles from "./FilterToolbar.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

export type ToolbarFilter =
  | {
      id: string;
      label: string;
      type: "select";
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    }
  | {
      id: string;
      label: string;
      type: "date";
      value: string;
      min?: string;
      max?: string;
      onChange: (value: string) => void;
    };

type FilterToolbarProps = {
  filters: ToolbarFilter[];
  searchValue?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onClear?: () => void;
};

export default function FilterToolbar({
  filters,
  searchValue = "",
  searchLabel = "Search",
  searchPlaceholder = "Search",
  onSearchChange,
  onClear,
}: FilterToolbarProps) {
  return (
    <div className={styles.toolbar} role="search" aria-label="Search and filters">
      {onSearchChange && (
        <div className={styles.field}>
          <label htmlFor="filter-toolbar-search">{searchLabel}</label>
          <input
            id="filter-toolbar-search"
            type="search"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
      )}
      {filters.map((filter) => (
        <div className={styles.field} key={filter.id}>
          <label htmlFor={filter.id}>{filter.label}</label>
          {filter.type === "select" ? (
            <select
              id={filter.id}
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={filter.id}
              type="date"
              value={filter.value}
              min={filter.min}
              max={filter.max}
              onChange={(event) => filter.onChange(event.target.value)}
            />
          )}
        </div>
      ))}
      {onClear && (
        <button className={styles.clear} type="button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
