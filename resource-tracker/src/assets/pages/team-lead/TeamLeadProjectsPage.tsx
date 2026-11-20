import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import {
  teamLeadProjects,
  type TeamLeadProject,
} from "../../data/team-lead-catalog";
import styles from "../management/ApiManagementPage.module.css";

const columns: DataTableColumn<TeamLeadProject>[] = [
  { key: "name", header: "Project" },
];

export default function TeamLeadProjectsPage() {
  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Projects"
        description="Browse projects in the Team Lead demonstration catalogue."
      />
      <DataTable
        title="All projects"
        columns={columns}
        rows={teamLeadProjects}
        itemLabel="project"
        emptyTitle="No projects available"
        emptyDescription="There are no projects in the demonstration catalogue."
      />
    </section>
  );
}
