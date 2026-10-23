export type RequestStatus = 
        "Submitted"|
        "Pending"|
        "Queried"|
        "Approved"|
        "Rejected";
    

export interface RequestComment {
        id: string;
        authorId: string;
        authorName: string;
        message: string;
        createdAt: string;

}

export interface StatusChange {
    status: RequestStatus;
    changedAt: string;
    changedBy: string;
    note?: string;
}

export interface ResourceRequest {
    id: string;
    itemDescription: string;
    manufacturer?: string;
    quantity: number;
    estimatedPrice: number;
    department: string;
    project: string;
    team: string;
    summary: string;
    status: RequestStatus
    submittedAt: string;
    requestedById: string;
    comments: RequestComment[];
    rejectionReason?: string;
    history: StatusChange[];
}