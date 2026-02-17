export const Events = {
  AUTH_CHANGED: "auth:changed",
  CREATE_TICKET: "ticket:create",
  TICKET_CREATED: "ticket:created",
  NAVIGATE: "app:navigate",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
