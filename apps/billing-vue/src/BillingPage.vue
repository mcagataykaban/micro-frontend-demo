<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { eventBus, Events } from "@mf-demo/shared";
import type { AuthState, Invoice, CreateTicketPayload } from "@mf-demo/shared";
import { mockInvoices } from "./data";

const auth = ref<AuthState>({ isLoggedIn: false, username: "Guest" });
const filter = ref<"all" | Invoice["status"]>("all");
const selectedInvoice = ref<Invoice | null>(null);

const filteredInvoices = computed(() => {
  if (filter.value === "all") return mockInvoices;
  return mockInvoices.filter((inv) => inv.status === filter.value);
});

function createTicket(invoice: Invoice) {
  const payload: CreateTicketPayload = {
    invoiceId: invoice.id,
    invoiceTitle: invoice.title,
  };
  // Store on window to survive navigation (event bus might miss due to lazy loading race)
  (window as any).__MF_PENDING_TICKET__ = payload;
  console.log('[Billing] Created pending ticket:', payload);
  eventBus.emit(Events.CREATE_TICKET, payload);
  eventBus.emit(Events.NAVIGATE, "/support");
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function badgeClass(status: Invoice["status"]) {
  return {
    paid: "badge badge-success",
    pending: "badge badge-warning",
    overdue: "badge badge-danger",
  }[status];
}

let unsub: (() => void) | undefined;
onMounted(() => {
  unsub = eventBus.on<AuthState>(Events.AUTH_CHANGED, (state) => {
    auth.value = state;
  });
});
onUnmounted(() => unsub?.());
</script>

<template>
  <div class="billing">
    <div class="flex items-center justify-between" style="margin-bottom: var(--space-lg)">
      <div>
        <div class="flex items-center gap-sm">
          <h2 class="text-xl font-bold">Billing</h2>
          <span class="mf-tag mf-tag-vue">Vue 3</span>
        </div>
        <p class="text-sm text-muted" style="margin-top: var(--space-xs)">
          {{ auth.isLoggedIn ? `Logged in as ${auth.username}` : "Viewing as Guest" }}
        </p>
      </div>
      <div class="flex gap-sm">
        <button
          v-for="f in (['all', 'paid', 'pending', 'overdue'] as const)"
          :key="f"
          :class="['btn btn-sm', filter === f ? 'btn-primary' : '']"
          @click="filter = f"
        >
          {{ f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) }}
        </button>
      </div>
    </div>

    <div class="billing-layout">
      <div class="invoice-list">
        <div
          v-for="inv in filteredInvoices"
          :key="inv.id"
          :class="['card card-hover invoice-item', { selected: selectedInvoice?.id === inv.id }]"
          @click="selectedInvoice = inv"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold">{{ inv.id }}</span>
            <span :class="badgeClass(inv.status)">{{ inv.status }}</span>
          </div>
          <div style="margin-top: var(--space-sm)">{{ inv.title }}</div>
          <div class="flex items-center justify-between" style="margin-top: var(--space-sm)">
            <span class="font-bold">{{ formatCurrency(inv.amount) }}</span>
            <span class="text-sm text-muted">{{ inv.date }}</span>
          </div>
        </div>
      </div>

      <div class="invoice-detail">
        <div v-if="selectedInvoice" class="card">
          <h3 style="margin-bottom: var(--space-md)">Invoice Detail</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="text-muted">ID</span>
              <span class="font-bold">{{ selectedInvoice.id }}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Title</span>
              <span>{{ selectedInvoice.title }}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Amount</span>
              <span class="font-bold">{{ formatCurrency(selectedInvoice.amount) }}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Status</span>
              <span :class="badgeClass(selectedInvoice.status)">{{ selectedInvoice.status }}</span>
            </div>
            <div class="detail-row">
              <span class="text-muted">Date</span>
              <span>{{ selectedInvoice.date }}</span>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top: var(--space-lg); width: 100%" @click="createTicket(selectedInvoice!)">
            Create Support Ticket
          </button>
        </div>
        <div v-else class="card" style="text-align: center; color: var(--color-text-muted); padding: var(--space-2xl)">
          <p>Select an invoice to view details</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.billing-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--space-lg);
}

.invoice-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.invoice-item {
  padding: var(--space-md);
}

.invoice-item.selected {
  border-color: var(--color-primary);
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
  .billing-layout {
    grid-template-columns: 1fr;
  }
}
</style>
