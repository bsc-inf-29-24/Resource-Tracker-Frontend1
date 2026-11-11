import { useMemo } from "react";
import EmptyState from "../../components/feedback/EmptyState";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import {
  flattenApiRecord,
  formatApiValue,
  getApiRecords,
  humanizeApiKey,
  isApiRecord,
  unwrapApiResponse,
} from "../../data/api-response";
import styles from "./ApiManagementPage.module.css";

interface ApiDataViewProps {
  data: unknown;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  depth?: number;
}

const preferredColumnOrder = [
  "id",
  "name",
  "fullName",
  "email",
  "role",
  "status",
  "itemDescription",
  "quantity",
  "price",
  "createdAt",
  "updatedAt",
];

export default function ApiDataView({
  data,
  title,
  emptyTitle = "No records returned",
  emptyDescription = "The backend returned no records.",
  depth = 0,
}: ApiDataViewProps) {
  const response = unwrapApiResponse(data);
  const records = getApiRecords(response);
  const flatRecords = useMemo(
    () => records.map(flattenApiRecord),
    [records],
  );
  const columns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => {
    const keys = Array.from(
      new Set(flatRecords.flatMap((record) => Object.keys(record))),
    );
    keys.sort((left, right) => {
      const leftKey = left.split(".").at(-1) ?? left;
      const rightKey = right.split(".").at(-1) ?? right;
      const leftRank = preferredColumnOrder.indexOf(leftKey);
      const rightRank = preferredColumnOrder.indexOf(rightKey);
      if (leftRank < 0 && rightRank < 0) return left.localeCompare(right);
      if (leftRank < 0) return 1;
      if (rightRank < 0) return -1;
      return leftRank - rightRank;
    });
    return keys.map((key) => ({
      key,
      header: humanizeApiKey(key.replaceAll(".", " ")),
      render: (record) => formatApiValue(record[key]),
    }));
  }, [flatRecords]);

  if (Array.isArray(response)) {
    if (response.length === 0) {
      return (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      );
    }
    if (records.length === 0 || columns.length === 0) {
      return (
        <ul className={styles.apiDataList}>
          {response.map((item, index) => (
            <li key={index}>{formatApiValue(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <DataTable
        title={title}
        columns={columns}
        rows={flatRecords}
        rowKey={(record, index) =>
          typeof record.id === "string" || typeof record.id === "number"
            ? record.id
            : index
        }
        itemLabel="record"
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }

  if (!isApiRecord(response)) {
    return response === null || response === undefined ? (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    ) : (
      <p className={styles.apiDataValue}>{formatApiValue(response)}</p>
    );
  }

  const entries = Object.entries(response).filter(
    ([, value]) => !Array.isArray(value),
  );
  const nestedCollections = Object.entries(response).filter(
    ([, value]) => Array.isArray(value),
  );

  return (
    <div className={styles.apiData}>
      {entries.length > 0 ? (
        <dl className={styles.apiDataFields}>
          {entries.map(([key, value]) => (
            <div className={styles.apiDataField} key={key}>
              <dt>{humanizeApiKey(key)}</dt>
              <dd>{formatApiValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
      {depth < 2 &&
        nestedCollections.map(([key, value]) => (
          <section className={styles.apiDataCollection} key={key}>
            <h3>{humanizeApiKey(key)}</h3>
            <ApiDataView
              data={value}
              emptyTitle={`No ${humanizeApiKey(key).toLowerCase()}`}
              emptyDescription="The backend returned an empty collection."
              depth={depth + 1}
            />
          </section>
        ))}
    </div>
  );
}
