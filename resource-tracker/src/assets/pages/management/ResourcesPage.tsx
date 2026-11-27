import { resourcesApi } from "../../data/api-services";
import { formatApiValue } from "../../data/api-response";
import type { DataTableColumn } from "../../components/tables/type";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

type ResourceRecord = Record<string, unknown>;

const resourceFields: ApiField[] = [
  { name: "name", label: "Resource name", required: true },
  {
    name: "type",
    label: "Resource type",
    kind: "select",
    required: true,
    options: [
      { value: "insourced", label: "Insourced" },
      { value: "outsourced", label: "Outsourced" },
    ],
  },
  {
    name: "description",
    label: "Description",
    kind: "textarea",
    required: true,
    when: { field: "type", value: "insourced" },
  },
  {
    name: "departmentName",
    label: "Department name",
    kind: "select-options",
    optionSource: "departments",
    optionValue: "name",
    required: true,
    when: { field: "type", value: "insourced" },
  },
  {
    name: "price",
    label: "Unit price",
    kind: "number",
    required: true,
    when: { field: "type", value: "outsourced" },
  },
  {
    name: "label",
    label: "Manufacturer label",
    required: true,
    when: { field: "type", value: "outsourced" },
  },
  {
    name: "vendor",
    label: "Vendor",
    required: true,
    when: { field: "type", value: "outsourced" },
  },
  { name: "quantity", label: "Quantity", kind: "number", required: true },
  {
    name: "batchNumber",
    label: "Batch number",
    required: true,
    when: { field: "type", value: "outsourced" },
  },
];

function resourceCell(record: ResourceRecord, field: string): string {
  const value = record[field];
  return value === null || value === undefined || value === ""
    ? "—"
    : formatApiValue(value);
}

function resourceTypeCell(record: ResourceRecord): string {
  if (record.type === "insourced") return "Insourced";
  if (record.type === "outsourced") return "Outsourced";
  return resourceCell(record, "type");
}

function availabilityCell(record: ResourceRecord): string {
  if (record.status === "AVAILABLE") return "Available";
  if (record.status === "ASSIGNED") return "Assigned";
  return resourceCell(record, "status");
}

function createdAtCell(record: ResourceRecord): string {
  const value = record.createdAt;
  if (typeof value !== "string" || !value.trim()) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

const resourceColumns: DataTableColumn<ResourceRecord>[] = [
  {
    key: "name",
    header: "Resource name",
    render: (record) => resourceCell(record, "name"),
  },
  { key: "type", header: "Type", render: resourceTypeCell },
  { key: "status", header: "Availability", render: availabilityCell },
  {
    key: "quantity",
    header: "Quantity",
    render: (record) => resourceCell(record, "quantity"),
  },
  {
    key: "description",
    header: "Description",
    render: (record) => resourceCell(record, "description"),
  },
  {
    key: "departmentName",
    header: "Department",
    render: (record) => resourceCell(record, "departmentName"),
  },
  {
    key: "price",
    header: "Unit price",
    render: (record) => resourceCell(record, "price"),
  },
  {
    key: "label",
    header: "Manufacturer label",
    render: (record) => resourceCell(record, "label"),
  },
  {
    key: "vendor",
    header: "Vendor",
    render: (record) => resourceCell(record, "vendor"),
  },
  {
    key: "batchNumber",
    header: "Batch number",
    render: (record) => resourceCell(record, "batchNumber"),
  },
  { key: "createdAt", header: "Created", render: createdAtCell },
];

export default function ResourcesPage() {
  return (
    <ApiManagementPage
      title="Resources"
      recordsTitle="Available resources"
      description="Browse available resources and create insourced or outsourced resources."
      list={resourcesApi.list}
      create={resourcesApi.create}
      fields={resourceFields}
      tableColumns={resourceColumns}
      createHeading="Create resource"
      createButtonLabel="Create resource"
      createInDialog
      hideRecordActions
      showEmptyTable
    />
  );
}
