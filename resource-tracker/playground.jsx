import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./assets/styles/global.css";
import LineManagerDashboard from "./assets/pages/line-manager/LineManagerDashboard";
import RequestDetails from "./assets/components/requests/RequestDetails";
import RequestTimeline from "./assets/components/requests/RequestTimeline";
import ReasonDialog from "./assets/components/dialogs/ReasonDialog";
import { mockRequests } from "./assets/data/mock-data";

function RequestPlayground() {
  const [requestId, setRequestId] = useState(mockRequests[0].id);
  const [dialog, setDialog] = useState(null); // "query" | "reject" | null
  const [lastReason, setLastReason] = useState("");

  const request = mockRequests.find((r) => r.id === requestId);

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: "0 16px" }}>
      <label>
        Request:{" "}
        <select value={requestId} onChange={(e) => setRequestId(e.target.value)}>
          {mockRequests.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.status})
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 16 }}>
        <RequestDetails
          request={request}
          actions={
            <>
              <button onClick={() => setDialog("query")}>Query</button>
              <button onClick={() => setDialog("reject")}>Reject</button>
            </>
          }
        />
      </div>

      <h3>History</h3>
      <RequestTimeline request={request} />

      {lastReason && <p>Last reason submitted: {lastReason}</p>}

      <ReasonDialog
        open={dialog === "query"}
        title="Query request"
        label="Explain what information is missing"
        submitLabel="Send query"
        onSubmit={(reason) => {
          setLastReason(`Query: ${reason}`);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
      <ReasonDialog
        open={dialog === "reject"}
        title="Reject request"
        label="Give the reason for rejection"
        submitLabel="Reject"
        onSubmit={(reason) => {
          setLastReason(`Reject: ${reason}`);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}

function Playground() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div>
      <nav style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>{" "}
        <button onClick={() => setTab("request")}>Request components</button>
      </nav>
      {tab === "dashboard" ? <LineManagerDashboard /> : <RequestPlayground />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Playground />);