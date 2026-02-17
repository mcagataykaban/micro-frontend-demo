export interface Invoice {
  id: string;
  title: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdBy: string;
  invoiceId?: string;
  createdAt: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  username: string;
}

export interface CreateTicketPayload {
  invoiceId: string;
  invoiceTitle: string;
}
