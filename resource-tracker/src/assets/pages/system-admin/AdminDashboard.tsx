import PageHeader from "../../components/layout/PageHeader";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import EmptyState from "../../components/feedback/EmptyState";
import LoadingState from "../../components/feedback/LoadingState";


function AdminDashboard() {
  return (
    <section>
      <PageHeader
        title="System Administrator Dashboard"
        description="Welcome back! Here's an overview of your resource requests"
      />

      <p>Your Content dashboard will appear here.</p>

    </section>
  );
}

export default AdminDashboard;
/*
   <EmptyState title="No Resource requests"
      message="You have not submitted any resource requests yet."/>

       <ErrorMessage
        title="Unable to load resources"
        message="Please check your connection and try again."
        onRetry={() => window.location.reload()}
      />
*/
