import { resourcesApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

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
  { name: "batchNumber", label: "Batch number" },
];

const resourceUpdateFields: ApiField[] = resourceFields
  .filter((field) => field.name !== "type")
  .map((field) => ({ ...field, required: false, when: undefined }));

export default function ResourcesPage() {
  return (
    <ApiManagementPage
      title="Resources"
      description="Create and update resources using the documented insourced and outsourced field requirements."
      list={resourcesApi.list}
      get={resourcesApi.get}
      create={resourcesApi.create}
      update={resourcesApi.update}
      fields={resourceFields}
      updateFields={resourceUpdateFields}
    />
  );
}
