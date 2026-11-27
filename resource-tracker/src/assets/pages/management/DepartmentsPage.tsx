import { departmentsApi } from "../../data/api-services";
import ApiManagementPage, {
  type ApiField,
} from "./ApiManagementPage";

const departmentFields: ApiField[] = [
  { name: "name", label: "Department name", kind: "text", required: true },
  { name: "description", label: "Description", kind: "textarea", required: true },
];

function assignDepartmentHead(id: string, userId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    return Promise.reject(
      new Error("The department head ID must be a UUID."),
    );
  }
  return departmentsApi.assignHead(id, userId);
}

export default function DepartmentsPage() {
  return (
    <ApiManagementPage
      title="Departments"
      description="Department records returned by the departments endpoint."
      recordsTitle="Department records"
      createHeading="Create department"
      createButtonLabel="Create department"
      list={departmentsApi.list}
      get={departmentsApi.get}
      create={departmentsApi.create}
      update={departmentsApi.update}
      remove={departmentsApi.remove}
      fields={departmentFields}
      createInDialog
      selectionLabel="View"
      hideRecordActions
      assignmentsInDialog
      selectionDetailsInDialog
      updateInDialog
      updateHeading="Edit department"
      updateButtonLabel="Save changes"
      createAssignment={{
        label: "Department head",
        field: "headUserId",
        optional: true,
        run: assignDepartmentHead,
      }}
      assignments={[
        {
          label: "Assign department head",
          field: "headUserId",
          successMessage: "The department head was assigned.",
          run: assignDepartmentHead,
        },
        {
          label: "Delete department",
          field: "deleteDepartment",
          requiresValue: false,
          successMessage: "The department was deleted.",
          confirmation: {
            title: "Delete this department?",
            message:
              "This action cannot be undone. The backend may reject deletion if the department still has related records.",
            confirmLabel: "Delete department",
          },
          run: (id) => departmentsApi.remove(id),
        },
      ]}
    />
  );
}
