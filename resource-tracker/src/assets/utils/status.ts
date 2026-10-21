import type { RequestStatus, ResourceRequest } from "../types/resource-request"

export const All_STATUSES: RequestStatus[]= [
    "Submitted",
    "Pending",
    "Queried",
    "Approved",
    "Rejected",
];

export function countByStatus(
    requests: ResourceRequest[]
): Record<RequestStatus, number> {
    const counts: Record<RequestStatus, number> = {
        Submitted: 0,
        Pending: 0,
        Queried: 0,
        Approved: 0,
        Rejected: 0,
    };

    for (const request of requests) {
        counts[request.status] += 1;
    }

    return counts;
}

export function filterByStatus(
    requests: ResourceRequest[],
    status: RequestStatus
): ResourceRequest[]{
    return requests.filter((request) => request.status === status);
}

function getLatestComment(request: ResourceRequest) {
    const sorted = [...request.comments].sort(
        (a,b) => new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );
    return sorted[sorted.length - 1];
}

export function hasTeamLeadReplied(request:  ResourceRequest): boolean {
    if (request.status !== "Queried") return false;

    const latest = getLatestComment(request);
    return latest !== undefined && latest.authorId === request.requestedById;
}

export function getRequestsAwaitingAction(
    requests: ResourceRequest[]
): ResourceRequest[] {
    return requests.filter(
        (request) => request.status === "Pending" || hasTeamLeadReplied(request)
    );
}