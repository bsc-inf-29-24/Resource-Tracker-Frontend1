import { useMemo } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Shield,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
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
  hideIdFields?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  expandableRecords?: boolean;
  depth?: number;
  fieldIcons?: boolean;
}

const fieldIconByKey: Record<string, LucideIcon> = {
  fullname: UserRound,
  name: UserRound,
  email: Mail,
  isactive: BadgeCheck,
  role: Shield,
  createdat: CalendarClock,
  updatedat: CalendarClock,
  dateofbirth: CalendarDays,
  phonenumber: Phone,
  address: MapPin,
  department: Building2,
  team: UsersRound,
};

function getFieldIcon(key: string) {
  return fieldIconByKey[key.toLowerCase().replace(/[_\-.\s]/g, "")];
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

function formatDateTime(value: unknown): string {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return formatApiValue(value);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? formatApiValue(value)
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function ApiDataView({
  data,
  title,
  hideIdFields = false,
  emptyTitle = "No records returned",
  emptyDescription = "The backend response did not contain any records.",
  depth = 0,
  fieldIcons = false,
}: ApiDataViewProps) {
  const response = unwrapApiResponse(data);
  const records = getApiRecords(response);
  const flatRecords = useMemo(() => records.map(flattenApiRecord), [records]);
  const columns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => {
    const keys = Array.from(
      new Set(flatRecords.flatMap((record) => Object.keys(record))),
    ).filter(
      (key) =>
        !hideIdFields ||
        (key.split(".").at(-1) ?? key).toLowerCase() !== "id",
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
      render: (record) => {
        const fieldName = (key.split(".").at(-1) ?? key)
          .toLowerCase()
          .replace(/[_\-\s]/g, "");
        return fieldName === "createdat" || fieldName === "updatedat"
          ? formatDateTime(record[key])
          : formatApiValue(record[key]);
      },
    }));
  }, [flatRecords, hideIdFields]);

  if (Array.isArray(response)) {
    if (response.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }
    if (records.length === 0) {
      return (
        <ul className={styles.apiDataList}>
          {response.map((item, index) => (
            <li key={index}>{formatApiValue(item)}</li>
          ))}
        </ul>
      );
    }
    if (columns.length === 0) {
      return (
        <EmptyState
          title={emptyTitle}
          description="The backend returned no displayable user details."
        />
      );
    }
    return (
      <DataTable
        title={title}
        columns={columns}
        rows={flatRecords}
        pageSize={expandableRecords ? 4 : undefined}
        expandable={expandableRecords}
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
    ([key, value]) =>
      !Array.isArray(value) &&
      (!hideIdFields ||
        (key.split(".").at(-1) ?? key).toLowerCase() !== "id"),
  );
  const nestedCollections = Object.entries(response).filter(([, value]) =>
    Array.isArray(value),
  );

  return (
    <div className={styles.apiData}>
      {entries.length > 0 ? (
        <dl className={styles.apiDataFields}>
          {entries.map(([key, value]) => (
            <div className={styles.apiDataField} key={key}>
              <dt className={fieldIcons ? styles.apiDataFieldLabel : undefined}>
                {fieldIcons && getFieldIcon(key) && (() => {
                  const Icon = getFieldIcon(key)!;
                  return <Icon aria-hidden="true" size={15} strokeWidth={1.8} />;
                })()}
                {humanizeApiKey(key)}
              </dt>
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
              hideIdFields={hideIdFields}
              emptyTitle={`No ${humanizeApiKey(key).toLowerCase()}`}
              emptyDescription="The backend returned an empty collection."
              expandableRecords={expandableRecords}
              depth={depth + 1}
            />
          </section>
        ))}
    </div>
  );
}
