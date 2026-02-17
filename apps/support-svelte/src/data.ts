import type { Ticket } from "@mf-demo/shared";

export const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Cannot access billing dashboard",
    description: "Getting a 403 error when trying to view invoices.",
    status: "resolved",
    createdBy: "john@acme.com",
    createdAt: "2024-01-10",
  },
  {
    id: "TKT-002",
    title: "Incorrect charge on INV-003",
    description: "February infrastructure charge seems higher than expected. Please review.",
    status: "in-progress",
    createdBy: "jane.doe@acme.com",
    invoiceId: "INV-003",
    createdAt: "2024-02-18",
  },
  {
    id: "TKT-003",
    title: "Request for payment extension",
    description: "We need a 15-day extension on INV-005 due to budget approval delays.",
    status: "open",
    createdBy: "jane.doe@acme.com",
    invoiceId: "INV-005",
    createdAt: "2024-03-20",
  },
];
