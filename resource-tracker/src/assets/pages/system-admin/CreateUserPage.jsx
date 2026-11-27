import { departmentsApi, usersApi } from "../../data/api-services";
import CreateUserForm from "./CreateUserForm";
import styles from "./SystemAdminPage.module.css";

export default function CreateUserPage() {
  return (
    <div className={`rt-root ${styles.page}`}>
      {/* { <PageHeader
        title="Create user account"
        //description="Create an account using the fields and role values supported by the backend API."
      /> } */}
      <CreateUserForm
        onSave={async (input, departmentId) => {
          const response = await usersApi.create(input);
          if (!departmentId) return;

          const userId = response.user?.id;
          if (!userId) {
            return {
              departmentAssignmentError:
                "The user was created, but the backend did not return an ID needed for assignment.",
            };
          }

          try {
            await departmentsApi.assignHead(departmentId, userId, {
              successToast: false,
            });
          } catch (error) {
            return {
              departmentAssignmentError:
                error instanceof Error
                  ? error.message
                  : "The department head could not be assigned.",
            };
          }
        }}
      />
    </div>
  );
}
