<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { eventBus, Events } from "@mf-demo/shared";
  import type { AuthState, Ticket, CreateTicketPayload } from "@mf-demo/shared";
  import { mockTickets } from "./data";

  let auth: AuthState = { isLoggedIn: false, username: "Guest" };
  let tickets: Ticket[] = [...mockTickets];
  let selectedTicket: Ticket | null = null;
  let showNewTicketForm = false;
  let newTicketTitle = "";
  let newTicketDescription = "";
  let newTicketInvoiceId = "";

  let unsubAuth: (() => void) | undefined;
  let unsubTicket: (() => void) | undefined;

  function handleCreateTicket(payload: CreateTicketPayload) {
    newTicketTitle = `Issue with ${payload.invoiceId}: ${payload.invoiceTitle}`;
    newTicketDescription = `Regarding invoice ${payload.invoiceId} — ${payload.invoiceTitle}.\n\nPlease describe the issue:`;
    newTicketInvoiceId = payload.invoiceId;
    showNewTicketForm = true;
    selectedTicket = null;
  }

  onMount(() => {
    unsubAuth = eventBus.on<AuthState>(Events.AUTH_CHANGED, (state) => {
      auth = state;
    });

    unsubTicket = eventBus.on<CreateTicketPayload>(Events.CREATE_TICKET, handleCreateTicket);

    // Check for pending CREATE_TICKET payload (handles race condition when navigating from Billing)
    // Don't delete immediately — React StrictMode may destroy and re-create this component.
    // The last mount wins, which is the one that survives.
    const w = window as any;
    if (w.__MF_PENDING_TICKET__) {
      handleCreateTicket(w.__MF_PENDING_TICKET__ as CreateTicketPayload);
      // Clean up after StrictMode settles
      setTimeout(() => { delete w.__MF_PENDING_TICKET__; }, 200);
    }
  });

  onDestroy(() => {
    unsubAuth?.();
    unsubTicket?.();
  });

  function badgeClass(status: Ticket["status"]): string {
    return {
      open: "badge badge-warning",
      "in-progress": "badge badge-info",
      resolved: "badge badge-success",
    }[status];
  }

  function submitTicket() {
    const ticket: Ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
      title: newTicketTitle,
      description: newTicketDescription,
      status: "open",
      createdBy: auth.isLoggedIn ? auth.username : "Guest",
      invoiceId: newTicketInvoiceId || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    tickets = [ticket, ...tickets];
    selectedTicket = ticket;
    showNewTicketForm = false;
    newTicketTitle = "";
    newTicketDescription = "";
    newTicketInvoiceId = "";
    eventBus.emit(Events.TICKET_CREATED, ticket);
  }

  function cancelForm() {
    showNewTicketForm = false;
    newTicketTitle = "";
    newTicketDescription = "";
    newTicketInvoiceId = "";
  }
</script>

<div class="support">
  <div class="flex items-center justify-between" style="margin-bottom: var(--space-lg)">
    <div>
      <div class="flex items-center gap-sm">
        <h2 class="text-xl font-bold">Support</h2>
        <span class="mf-tag mf-tag-svelte">Svelte</span>
      </div>
      <p class="text-sm text-muted" style="margin-top: var(--space-xs)">
        {auth.isLoggedIn ? `Logged in as ${auth.username}` : "Viewing as Guest"}
      </p>
    </div>
    <button class="btn btn-primary" on:click={() => { showNewTicketForm = true; selectedTicket = null; }}>
      + New Ticket
    </button>
  </div>

  <div class="support-layout">
    <div class="ticket-list">
      {#each tickets as ticket (ticket.id)}
        <div
          class="card card-hover ticket-item"
          class:selected={selectedTicket?.id === ticket.id}
          on:click={() => { selectedTicket = ticket; showNewTicketForm = false; }}
          on:keydown={(e) => { if (e.key === 'Enter') { selectedTicket = ticket; showNewTicketForm = false; } }}
          role="button"
          tabindex="0"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold">{ticket.id}</span>
            <span class={badgeClass(ticket.status)}>{ticket.status}</span>
          </div>
          <div style="margin-top: var(--space-sm)">{ticket.title}</div>
          <div class="flex items-center justify-between" style="margin-top: var(--space-sm)">
            <span class="text-sm text-muted">{ticket.createdBy}</span>
            <span class="text-sm text-muted">{ticket.createdAt}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="ticket-detail">
      {#if showNewTicketForm}
        <div class="card">
          <h3 style="margin-bottom: var(--space-md)">New Support Ticket</h3>
          <div class="form-group">
            <label class="text-sm text-muted" for="title">Title</label>
            <input id="title" class="input" bind:value={newTicketTitle} placeholder="Describe the issue..." />
          </div>
          {#if newTicketInvoiceId}
            <div class="form-group">
              <label class="text-sm text-muted" for="invoice">Related Invoice</label>
              <input id="invoice" class="input" value={newTicketInvoiceId} disabled />
            </div>
          {/if}
          <div class="form-group">
            <label class="text-sm text-muted" for="desc">Description</label>
            <textarea id="desc" class="input" rows="4" bind:value={newTicketDescription} placeholder="Provide details..."></textarea>
          </div>
          <div class="form-group">
            <span class="text-sm text-muted">
              Creating as: <strong>{auth.isLoggedIn ? auth.username : "Guest"}</strong>
            </span>
          </div>
          <div class="flex gap-sm" style="margin-top: var(--space-md)">
            <button class="btn btn-primary" on:click={submitTicket} disabled={!newTicketTitle}>
              Submit Ticket
            </button>
            <button class="btn" on:click={cancelForm}>Cancel</button>
          </div>
        </div>
      {:else if selectedTicket}
        <div class="card">
          <h3 style="margin-bottom: var(--space-md)">Ticket Detail</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="text-muted">ID</span>
              <span class="font-bold">{selectedTicket.id}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Title</span>
              <span>{selectedTicket.title}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Status</span>
              <span class={badgeClass(selectedTicket.status)}>{selectedTicket.status}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Created By</span>
              <span>{selectedTicket.createdBy}</span>
            </div>
            {#if selectedTicket.invoiceId}
              <div class="detail-row">
                <span class="text-muted">Invoice</span>
                <span class="font-bold">{selectedTicket.invoiceId}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="text-muted">Date</span>
              <span>{selectedTicket.createdAt}</span>
            </div>
          </div>
          <div style="margin-top: var(--space-lg); padding: var(--space-md); background: var(--color-bg); border-radius: var(--radius-md);">
            <p class="text-sm">{selectedTicket.description}</p>
          </div>
        </div>
      {:else}
        <div class="card" style="text-align: center; color: var(--color-text-muted); padding: var(--space-2xl)">
          <p>Select a ticket to view details</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .support-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: var(--space-lg);
  }

  .ticket-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .ticket-item {
    padding: var(--space-md);
  }

  .ticket-item.selected {
    border-color: var(--color-primary);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
  }

  .form-group label {
    font-size: 0.8rem;
  }

  textarea.input {
    resize: vertical;
    font-family: var(--font-sans);
  }

  .detail-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
    .support-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
