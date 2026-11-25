import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import EmptyState from "../../components/feedback/EmptyState";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import LoadingState from "../../components/feedback/LoadingState";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { formatApiValue } from "../../data/api-response";
import { teamsApi } from "../../data/api-services";
import { getAssignedTeams, getTeamId, getTeamName, recordsFromResponse, relatedLabel } from "./manager-data";
import styles from "./LineManagerTeamsPage.module.css";

type RecordValue = Record<string, unknown>;

export default function LineManagerTeamsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const membersView = searchParams.get("view") === "members";
  const [teams, setTeams] = useState<RecordValue[]>([]);
  const [members, setMembers] = useState<RecordValue[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState("");
  const [membersError, setMembersError] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await teamsApi.list();
      const records = recordsFromResponse(response, "teams");
      const assigned = user ? getAssignedTeams(records, user) : [];
      setTeams(assigned);
      setSelectedTeamId((current) =>
        assigned.some((team) => getTeamId(team) === current)
          ? current
          : getTeamId(assigned[0] ?? {}),
      );
    } catch (requestError) {
      setTeams([]);
      setError(requestError instanceof Error ? requestError.message : "Assigned teams could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const selectedTeam = teams.find((team) => getTeamId(team) === selectedTeamId);

  const loadMembers = useCallback(async () => {
    if (!selectedTeamId) {
      setMembers([]);
      setMembersError("");
      return;
    }
    setMembersLoading(true);
    setMembersError("");
    try {
      const response = await teamsApi.users(selectedTeamId);
      setMembers(recordsFromResponse(response, "team members"));
    } catch (requestError) {
      setMembers([]);
      setMembersError(requestError instanceof Error ? requestError.message : "Team members could not be loaded.");
    } finally {
      setMembersLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (membersView) void loadMembers();
  }, [loadMembers, membersView]);

  const teamColumns = useMemo<DataTableColumn<RecordValue>[]>(() => [
    { key: "name", header: "Team", render: (team) => getTeamName(team) },
    { key: "department", header: "Department", render: (team) => formatApiValue(team.department ?? team.departmentName) },
    { key: "description", header: "Description", render: (team) => formatApiValue(team.description) },
    { key: "id", header: "Team ID", render: (team) => getTeamId(team) || "—" },
    {
      key: "members",
      header: "Members",
      render: (team) => {
        const id = getTeamId(team);
        return id ? (
          <button
            type="button"
            className={styles.inlineButton}
            onClick={() => {
              setSelectedTeamId(id);
              setSearchParams({ view: "members" });
            }}
          >
            View members
          </button>
        ) : "—";
      },
    },
  ], []);
  const memberColumns = useMemo<DataTableColumn<RecordValue>[]>(() => [
    { key: "name", header: "Name", render: (member) => relatedLabel(member.fullName ?? member.name) },
    { key: "email", header: "Email", render: (member) => formatApiValue(member.email) },
    { key: "role", header: "Role", render: (member) => formatApiValue(member.role) },
    { key: "status", header: "Status", render: (member) => formatApiValue(member.status ?? member.isActive) },
  ], []);

  return (
    <section className={`rt-root ${styles.page}`}>
      <PageHeader
        title="Assigned teams"
        description="View the teams associated with your authenticated manager profile and inspect their members."
      />
      {error && <ErrorMessage title="Assigned teams could not be loaded" message={error} onRetry={() => void loadTeams()} />}
      {loading ? <LoadingState message="Loading assigned teams…" /> : !error && !teams.length ? (
        <EmptyState title="No assigned teams returned" description="No team assignment was reported for this account." />
      ) : !error ? (
        <DataTable
          title={`${teams.length} assigned ${teams.length === 1 ? "team" : "teams"}`}
          columns={teamColumns}
          rows={teams}
          rowKey={(team, index) => getTeamId(team) || index}
          itemLabel="team"
        />
      ) : null}
      <section className={`rt-root rt-card ${styles.membersPanel}`}>
        <div className={styles.panelHeading}>
          <div><h2>Team members</h2><p>{selectedTeam ? `Members of ${getTeamName(selectedTeam)}` : "Choose an assigned team to see its members."}</p></div>
          <label>
            <span className={styles.visuallyHidden}>Assigned team</span>
            <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} disabled={loading || !teams.length}>
              {!teams.length && <option value="">No assigned teams</option>}
              {teams.map((team, index) => {
                const id = getTeamId(team);
                return id ? <option value={id} key={`${id}-${index}`}>{getTeamName(team)}</option> : null;
              })}
            </select>
          </label>
        </div>
        {membersError && <ErrorMessage title="Team members could not be loaded" message={membersError} onRetry={() => void loadMembers()} />}
        {membersLoading ? <LoadingState message="Loading team members…" /> : membersError ? null : members.length ? (
          <DataTable columns={memberColumns} rows={members} rowKey={(member, index) => String(member.id ?? index)} itemLabel="member" emptyTitle="No team members" />
        ) : selectedTeam ? (
          <EmptyState title="No team members returned" description="The selected team has no members in the backend response." />
        ) : null}
      </section>
    </section>
  );
}
