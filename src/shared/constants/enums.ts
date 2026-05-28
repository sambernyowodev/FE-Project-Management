export const ProjectStatus = {
    PLANNING: 'PLANNING',
    IN_PROGRESS: 'IN PROGRESS',
    SIT: 'SIT',
    UAT: 'UAT',
    CLOSED: 'CLOSED',
    ON_HOLD: 'ON HOLD',
    CANCELLED: 'CANCELLED',
    FUT: 'FUT',
} as const;

export const ProjectPhase = {
    FCAB: 'FCAB',
    REQUIREMENT: 'REQUIREMENT',
    ANALYSIS: 'ANALYSIS',
    DESIGN: 'DESIGN',
    SRS: 'SRS',
    CRQ: 'CRQ',
    DEVELOPMENT: 'DEVELOPMENT',
    UT_SIT: 'UT SIT',
    TRA_TC: 'TRA TC',
    REVIEW: 'REVIEW',
    SIT: 'SIT',
    UAT: 'UAT',
    NFT: 'NFT',
    SECURITY: 'SECURITY',
    RFS: 'RFS',
    FUT: 'FUT',
} as const;

export const PurchaseOrderStatus = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    IN_PROGRESS: 'IN PROGRESS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
} as const;

export const SalesOrderStatus = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    IN_PROGRESS: 'IN PROGRESS',
    DELIVERED: 'DELIVERED',
    INVOICED: 'INVOICED',
    PAID: 'PAID',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
} as const;

export const SupportTicketStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN PROGRESS',
    DEV_DONE: 'DEV DONE',
    SIT_DONE: 'SIT DONE',
    UAT_DONE: 'UAT DONE',
    DONE: 'DONE',
    ON_HOLD: 'ON HOLD',
    CANCELLED: 'CANCELLED',
} as const;

export const SupportTicketDetailStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN PROGRESS',
    DONE: 'DONE',
    ON_HOLD: 'ON HOLD',
} as const;

export const InvoiceStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
} as const;

export const ProjectType = {
    NEW: 'New',
    SUPPORT: 'Support',
} as const;
