import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import DataTable from "../../components/tables/DataTable";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import FilterToolbar from "../../components/filters/filterToolbar";
import PageHeader from "../../components/layout/PageHeader";
import StatusLabel from "../../components/status/StatusLabel";
import {
  availableDepartments,
  setUserStatus,
  supportedRoles,
  useUsers,
} from "../../data/user-store";
import styles from "./SystemAdminPage.module.css";

const roleLabels = {
  "team-lead": "Team Lead",
  "line-manager": "Line Manager",
  "department-manager": "Department Manager",
  "system-admin": "System Administrator",
};

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { users, persistenceWarning } = useUsers();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [operationError, setOperationError] = useState("");
  const [feedback, setFeedback] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLocaleLowerCase().includes(query) ||
        user.email.toLocaleLowerCase().includes(query);
      return (
        matchesSearch &&
        (departmentFilter === "all" || user.department === departmentFilter) &&
        (roleFilter === "all" || user.role === roleFilter) &&
        (statusFilter === "all" || user.status === statusFilter)
      );
    });
  }, [users, search, departmentFilter, roleFilter, statusFilter]);

  const columns = [
    { key: "name", header: "User name" },
    { key: "email", header: "Email" },
    {
      key: "department",
      header: "Department",
      render: (user) => user.department || "Not assigned",
    },
    {
      key: "role",
      header: "Role",
      render: (user) => roleLabels[user.role] ?? user.role,
    },
    {
      key: "status",
      header: "Account status",
      render: (user) => <StatusLabel status={user.status} />,
    },
    {
      key: "actions",
      header: "Available actions",
      render: (user) => (
        <div className={styles.rowActions}>
          <button type="button" onClick={() => navigate(`/system-admin/users/${user.id}`)}>
            View
          </button>
          <button type="button" onClick={() => navigate(`/system-admin/users/${user.id}/edit`)}>
            Edit
          </button>
          <button
            type="button"
            className={user.status === "Active" ? styles.dangerAction : styles.activateAction}
            onClick={() => {
              setOperationError("");
              setFeedback("");
              setPendingStatusChange({
                user,
                status: user.status === "Active" ? "Inactive" : "Active",
              });
            }}
          >
            {user.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  function clearFilters() {
    setSearch("");
    setDepartmentFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function confirmStatusChange() {
    if (!pendingStatusChange) return;
    try {
      const updated = setUserStatus(pendingStatusChange.user.id, pendingStatusChange.status);
      setFeedback(`${updated.name}'s account status was changed to ${updated.status} in this browser.`);
      setOperationError("");
      setPendingStatusChange(null);
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "The account status could not be updated."
      );
      setPendingStatusChange(null);
    }
  }

  return (
    <div className={`rt-root ${styles.page}`}>
      <PageHeader
        title="User Management"
        description="Search, filter, and manage account records."
        supplementary={
          <button
            type="button"
            className="rt-root rt-btn rt-btn--primary"
            onClick={() => navigate("/system-admin/users/new")}
          >
            Create user
          </button>
        }
      />
      <p className={styles.previewNotice} role="note">
        Preview account records are stored in this browser. Activation does not grant secure login access; authentication is not connected.
      </p>
      {persistenceWarning && (
        <ErrorMessage title="Using demonstration accounts" message={persistenceWarning} />
      )}
      {operationError && (
        <ErrorMessage title="Account status not changed" message={operationError} />
      )}
      {feedback && <p className={styles.success} role="status">{feedback}</p>}

      <FilterToolbar
        searchLabel="Search name or email"
        searchPlaceholder="Search users"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: "user-department-filter",
            label: "Department",
            type: "select",
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { value: "all", label: "All departments" },
              ...[...new Set(availableDepartments.map((department) => department.name))].map(
                (department) => ({ value: department, label: department })
              ),
            ],
          },
          {
            id: "user-role-filter",
            label: "Role",
            type: "select",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "all", label: "All roles" },
              ...supportedRoles.map((role) => ({
                value: role.value,
                label: role.label,
              })),
            ],
          },
          {
            id: "user-status-filter",
            label: "Account status",
            type: "select",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ],
          },
        ]}
        onClear={clearFilters}
      />

      <DataTable
        title={`${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"}`}
        columns={columns}
        rows={filteredUsers}
        pageSize={8}
        itemLabel="user"
        emptyTitle="No users match these filters"
        emptyDescription="Try a different search or clear the selected filters."
        emptyActionLabel="Clear filters"
        onEmptyAction={clearFilters}
      />

      <ConfirmDialog
        open={Boolean(pendingStatusChange)}
        title={pendingStatusChange?.status === "Inactive" ? "Deactivate this account?" : "Activate this account?"}
        message={
          pendingStatusChange?.status === "Inactive"
            ? `${pendingStatusChange?.user.name}'s account record will be marked inactive. The record will remain available, and this preview does not enforce login access.`
            : `${pendingStatusChange?.user.name}'s account record will be marked active. This does not create or restore secure login access.`
        }
        confirmLabel={pendingStatusChange?.status === "Inactive" ? "Deactivate account" : "Activate account"}
        cancelLabel="Cancel"
        destructive={pendingStatusChange?.status === "Inactive"}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
