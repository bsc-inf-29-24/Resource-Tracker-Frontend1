import PageHeader from "../../components/layout/PageHeader";
import TeamLeadTeamsTable from "./TeamLeadTeamsTable";
import styles from "../management/ApiManagementPage.module.css";

export default function TeamLeadTeamsPage() {
  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Teams"
        description="Review teams and update their status in this browser-only demonstration."
      />
      <TeamLeadTeamsTable />
    </section>
  );
}
