# Micro-Frontend Demo

A working multi-framework micro-frontend monorepo using **Module Federation** with Vite.

```
┌──────────────────────────────────────────────────────────────┐
│                     HOST (React + TS)                        │
│                     localhost:5001                           │
│                                                              │
│   ┌──────────┐   ┌────────────────┐   ┌───────────────────┐  │
│   │  Home    │   │  /billing ─────────> BILLING (Vue 3)   │  │
│   │  page    │   │                │   │  localhost:5002   │  │
│   │  (React) │   │  /support ─────────> SUPPORT (Svelte)  │  │
│   │          │   │                │   │  localhost:5003   │  │
│   └──────────┘   └────────────────┘   └───────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │          Shared Event Bus (window singleton)         │   │
│   │          @mf-demo/shared + @mf-demo/ui               │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## What are micro-frontends?

Micro-frontends extend the microservices idea to the frontend: split a monolithic UI into independent, deployable pieces owned by different teams. Each team picks its own framework, ships on its own schedule, and the host shell composes everything at runtime.

**Why multi-framework matters:** In real orgs, teams inherit legacy stacks or pick the best tool for their domain. Micro-frontends let a Vue billing team and a Svelte support team coexist inside a React shell — no big-bang rewrites needed.

## Tech stack

| App | Framework | Port | Role |
|-----|-----------|------|------|
| `host-react` | React 18 + TS | 5001 | Shell — routing, auth, error boundaries |
| `billing-vue` | Vue 3 + TS | 5002 | Remote — invoices, filters, ticket creation |
| `support-svelte` | Svelte 4 + TS | 5003 | Remote — tickets, cross-app event listener |

| Package | Purpose |
|---------|---------|
| `@mf-demo/shared` | Type-safe event bus, shared types, event constants |
| `@mf-demo/ui` | CSS design tokens + base component classes |

## Quick start

```bash
# Prerequisites: Node 18+, pnpm 8+
git clone <this-repo>
cd micro-frontend-demo

# Install
pnpm install

# Run everything (builds remotes, then serves all 3 apps)
pnpm dev
```

Then open **http://localhost:5001** in your browser.

## What to demo

1. **Home page** — architecture diagram, framework tags
2. **Login/Logout toggle** — broadcasts auth state via event bus
3. **Navigate to /billing** — Vue 3 remote loads inside React shell
4. **Filter invoices** — all/paid/pending/overdue
5. **Select an invoice → "Create Support Ticket"** — emits event, auto-navigates to /support
6. **Support page** — Svelte remote with prefilled ticket form from billing event
7. **Failure isolation** — stop the billing server, navigate to /billing → error boundary renders, rest of app works

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Build remotes + start all 3 apps concurrently |
| `pnpm build` | Production build of all apps |
| `pnpm preview` | Preview all production builds |

## Environment variables

Copy `.env.example` to `apps/host-react/.env` (already done by default):

```env
VITE_BILLING_REMOTE_URL=http://localhost:5002
VITE_SUPPORT_REMOTE_URL=http://localhost:5003
```

## Further reading

- [docs/architecture.md](docs/architecture.md) — integration patterns, pros/cons, failure modes
- [docs/session-notes.md](docs/session-notes.md) — 30-45 min talk track with demo steps
