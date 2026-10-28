import PageHeader from "../../components/layout/PageHeader";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import EmptyState from "../../components/feedback/EmptyState";
import LoadingState from "../../components/feedback/LoadingState";


function DepartmentDashboard() {
  return (
    <section>
      <PageHeader
        title="Department Manager Dashboard"
        description="Welcome back! Here's an overview of your resource requests"
      />

      <p>Your Content dashboard will appear here.</p>

    </section>
  );
}

export default DepartmentDashboard;