<script setup lang="ts">
import { computed } from "vue";
import { mockInvoices } from "./data";

const stats = computed(() => {
  const total = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paid = mockInvoices.filter((i) => i.status === "paid");
  const pending = mockInvoices.filter((i) => i.status === "pending");
  const overdue = mockInvoices.filter((i) => i.status === "overdue");

  return {
    totalInvoices: mockInvoices.length,
    totalAmount: total,
    paidCount: paid.length,
    paidAmount: paid.reduce((s, i) => s + i.amount, 0),
    pendingCount: pending.length,
    pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
  };
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
</script>

<template>
  <div class="billing-stats">
    <div class="stats-header">
      <div class="flex items-center gap-sm">
        <h3 class="font-bold">Billing Overview</h3>
        <span class="mf-tag mf-tag-vue">Vue 3</span>
      </div>
      <p class="text-sm text-muted">Loaded on demand from billing remote (localhost:5002)</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Invoices</span>
        <span class="stat-value">{{ stats.totalInvoices }}</span>
        <span class="stat-sub">{{ formatCurrency(stats.totalAmount) }}</span>
      </div>
      <div class="stat-card stat-paid">
        <span class="stat-label">Paid</span>
        <span class="stat-value">{{ stats.paidCount }}</span>
        <span class="stat-sub">{{ formatCurrency(stats.paidAmount) }}</span>
      </div>
      <div class="stat-card stat-pending">
        <span class="stat-label">Pending</span>
        <span class="stat-value">{{ stats.pendingCount }}</span>
        <span class="stat-sub">{{ formatCurrency(stats.pendingAmount) }}</span>
      </div>
      <div class="stat-card stat-overdue">
        <span class="stat-label">Overdue</span>
        <span class="stat-value">{{ stats.overdueCount }}</span>
        <span class="stat-sub">{{ formatCurrency(stats.overdueAmount) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.billing-stats {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  background: var(--color-surface);
}

.stats-header {
  margin-bottom: var(--space-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.stat-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-sub {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-paid {
  border-color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 5%, transparent);
}

.stat-pending {
  border-color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 5%, transparent);
}

.stat-overdue {
  border-color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 5%, transparent);
}
</style>
