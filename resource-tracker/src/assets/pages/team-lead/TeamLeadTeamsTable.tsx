import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorMessage from "../../components/feedback/ErrorMessage";
import DataTable from "../../components/tables/DataTable";
import type { DataTableColumn } from "../../components/tables/type";
import StatusLabel from "../../components/status/StatusLabel";
import {
  TEAM_LEAD_TEAM_STATUS_STORAGE_KEY,
  teamLeadTeams,
  type TeamLeadTeam,
} from "../../data/team-lead-catalog";

type TeamStatuses = Record<string, boolean>;

function isTeamStatuses(value: unknown): value is TeamStatuses {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (status) => typeof status === "boolean",
  );
}

export default function TeamLeadTeamsTable() {
  const [statuses, setStatuses] = useState<TeamStatuses>({});
  const [loading, setLoading] = useState(true);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadStatuses = useCallback(() => {
    setLoading(true);
    setError("");
    try {
      const saved = window.localStorage.getItem(
        TEAM_LEAD_TEAM_STATUS_STORAGE_KEY,
      );
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isTeamStatuses(parsed)) {
          throw new Error("Saved team statuses have an invalid format.");
        }
        setStatuses(parsed);
      } else {
        setStatuses({});
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Team statuses could not be loaded from this browser.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const toggleTeam = useCallback(
    (team: TeamLeadTeam, isActive: boolean) => {
      const nextStatuses = { ...statuses, [team.id]: !isActive };
      setBusyTeamId(team.id);
      setError("");
      try {
        window.localStorage.setItem(
          TEAM_LEAD_TEAM_STATUS_STORAGE_KEY,
          JSON.stringify(nextStatuses),
        );
        setStatuses(nextStatuses);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "The team status could not be saved in this browser.",
        );
      } finally {
        setBusyTeamId(null);
      }
    },
    [statuses],
  );

  const columns = useMemo<DataTableColumn<TeamLeadTeam>[]>(
    () => [
      { key: "name", header: "Team" },
      { key: "department", header: "Department" },
      {
        key: "status",
        header: "Status",
        render: (team) => (
          <StatusLabel
            status={statuses[team.id] === false ? "inactive" : "active"}
          />
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (team) => {
          const isActive = statuses[team.id] !== false;
          return (
            <button
              type="button"
              className="rt-root rt-btn rt-btn--outline"
              disabled={loading || busyTeamId !== null || Boolean(error)}
              aria-label={`${isActive ? "Deactivate" : "Activate"} ${team.name}`}
              onClick={() => toggleTeam(team, isActive)}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          );
        },
      },
    ],
    [busyTeamId, error, loading, statuses, toggleTeam],
  );

  return (
    <>
      {error && (
        <ErrorMessage
          title="Team status unavailable"
          message={error}
          onRetry={loadStatuses}
        />
      )}
      <DataTable
        title="All teams"
        columns={columns}
        rows={teamLeadTeams}
        loading={loading}
        itemLabel="team"
        emptyTitle="No teams available"
        emptyDescription="There are no teams in the demonstration catalogue."
      />
    </>
  );
}
