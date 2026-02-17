import type { Invoice } from "@mf-demo/shared";

export const mockInvoices: Invoice[] = [
  { id: "INV-001", title: "Cloud Infrastructure — January", amount: 12450.0, status: "paid", date: "2024-01-15" },
  { id: "INV-002", title: "API Gateway Usage — January", amount: 3200.0, status: "paid", date: "2024-01-15" },
  { id: "INV-003", title: "Cloud Infrastructure — February", amount: 13100.0, status: "pending", date: "2024-02-15" },
  { id: "INV-004", title: "Data Storage — February", amount: 870.5, status: "pending", date: "2024-02-15" },
  { id: "INV-005", title: "Cloud Infrastructure — March", amount: 14200.0, status: "overdue", date: "2024-03-15" },
  { id: "INV-006", title: "Support Plan — Q1", amount: 5000.0, status: "paid", date: "2024-03-01" },
];
