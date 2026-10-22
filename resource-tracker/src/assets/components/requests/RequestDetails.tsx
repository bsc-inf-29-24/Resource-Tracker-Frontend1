import type { ReactNode } from "react";
import type { ResourceRequest } from "../../types/resource-request";
import {formatCurrency, formatDate} from "../../utils/format";
import styles from ".RequestDetails.module.css";

interface RequestDetailsProps {
    request: ResourceRequest;
    actions?: ReactNode;
}

interface FieldProps {
    label: string;
    children: ReactNode;
}

function Field({ label, children }: FieldProps) {
    return (
        <div className={styles.field}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>{children}</dd>
        </div>
    );
}

export default function RequestDetails({ request, actions }: RequestDetailsProps) {
    return (
        < section className={styles.card} aria-label={`Details for request ${request.id}`}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.tittle}>{request.itemDescription}</h2>
                    <p className={styles.id}>{request.id}</p>
                </div>
                <span className={styles.status}>{request.status}</span>
            </header>

            <dl className={styles.grid}>
              <Field label="Manufacturer">{request.manufacturer ?? "-"}</Field>
              <Field label="Quantity">{request.quantity}</Field>
              <Field label="Estimated price">{formatCurrency(request.estimatedPrice)}</Field>
              <Field label="Submitted on">{formatDate(request.submittedAt)}</Field>
              <Field label="Department">{request.department}</Field>
              <Field label="Project">{request.project}</Field>
              <Field label="Team">{request.team}</Field>
      </dl>

      <div className={styles.summary}>
        <h3 className={styles.label}>Request summary</h3>
        <p>{request.summary}</p>
      </div>

      {request.status === "Rejected" && request.rejectionReason && (
        <div className={styles.rejection} role="note">
            <h3 className={styles.label}>Reason for rejection</h3>
            <p>{request.rejectionReason}</p>
        </div>
      )}

        {actions && <footer className={styles.actions}>{actions}</footer>}
        </section>
    );
}