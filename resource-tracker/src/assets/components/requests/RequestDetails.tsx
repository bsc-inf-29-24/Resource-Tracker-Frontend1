import type { ReactNode } from "react";
import type { ResourceRequest } from "../../types/resource-request";
import { formatCurrency, formatDate } from "../../utils/format";
import StatusLabel from "../status/StatusLabel";
import styles from "./RequestDetails.module.css";

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
        <section className={styles.card} aria-label={`Details for request ${request.id}`}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>{request.itemDescription}</h2>
                    <p className={styles.id}>{request.id}</p>
                </div>
                <StatusLabel status={request.status} />
            </header>

            <dl className={styles.grid}>
                <Field label="Manufacturer">{request.manufacturer || "Not provided"}</Field>
                <Field label="Required quantity">{request.quantity}</Field>
                <Field label="Estimated price">{formatCurrency(request.estimatedPrice)}</Field>
                {request.requiredByDate && (
                    <Field label="Required by date">{formatDate(request.requiredByDate)}</Field>
                )}
                <Field label="Submitted on">{formatDate(request.submittedAt)}</Field>
                <Field label="Department">{request.department || "Not provided"}</Field>
                <Field label="Vendor">{request.vendor || "Not provided"}</Field>
                <Field label="Project">{request.project || "Not provided"}</Field>
                <Field label="Requesting team">{request.team || "Not provided"}</Field>
                <Field label="Batch number">{request.batchNumber || "Not provided"}</Field>
            </dl>

            <div className={styles.summary}>
                <h3 className={styles.label}>Request summary</h3>
                <p>{request.summary || "No summary provided."}</p>
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