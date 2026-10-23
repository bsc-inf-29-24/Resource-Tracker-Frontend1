import PageHeader from "../../components/layout/PageHeader";
import ErrorMessage from "../../components/feedback/ErrorMessage";

// This will be used to test the ErrorMessage Component
function RequestHistoryPage() {
  return (
    <section>
      <PageHeader
        title="Resource Request History"
        description="Your Requested Resources"
      />

      <ErrorMessage
        title="Unable to load resources"
        message="Please check your connection and try again."
        onRetry={() => window.location.reload()}
      />
    </section>
  );
}

export default RequestHistoryPage;
