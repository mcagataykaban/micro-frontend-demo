# Session Notes — Micro-Frontend Demo

**Duration**: 30–45 minutes
**Audience**: Frontend engineers, tech leads
**Format**: Live-coded demo + discussion

---

## Talk track

### 1. Introduction (5 min)

**Open with the problem:**
> "Imagine your company has 3 frontend teams. Billing uses Vue because they started with it. Support prefers Svelte for its simplicity. The platform team maintains a React shell. How do you ship a unified product without forcing everyone onto one framework?"

**Define micro-frontends:**
- Microservices for the UI
- Each team owns a vertical slice: their feature, their framework, their deploy pipeline
- The shell composes everything at runtime

**Show the architecture diagram** on the Home page (localhost:5001).

### 2. Module Federation walkthrough (5 min)

Open the code and briefly show:

1. **Remote config** (`apps/billing-vue/vite.config.ts`):
   - `exposes: { "./BillingPage": "./src/BillingPage.vue" }` — what the remote offers
   - `shared: ["vue"]` — shared dependency negotiation

2. **Host config** (`apps/host-react/vite.config.ts`):
   - `remotes: { billing: ... }` — where to find each remote
   - `shared: ["react", "react-dom"]`

3. **Lazy import** (`apps/host-react/src/App.tsx`):
   - `const BillingPage = lazy(() => import("billing/BillingPage"))`
   - Wrapped in `<Suspense>` + `<ErrorBoundary>`

**Key point**: The host has zero compile-time knowledge of Vue or Svelte. It just loads a JS module at runtime.

### 3. Live demo: Happy path (10 min)

**Steps:**

1. Start the demo: `pnpm dev`
2. Open http://localhost:5001
3. Show the Home page — point out framework tags (React, Vue, Svelte)
4. Click **Login** — show auth state changes in the nav
5. Navigate to **/billing**
   - Note the brief loading spinner (remote is loading)
   - Show "Logged in as jane.doe@acme.com" — auth state arrived via event bus
   - Filter invoices (all → overdue → pending)
   - Click on an invoice to see detail panel
6. Click **"Create Support Ticket"** on an invoice
   - This emits a `CREATE_TICKET` event via the shared bus
   - The app auto-navigates to /support
   - Show the prefilled ticket form in Svelte
   - Note "Creating as: jane.doe@acme.com" — auth state works here too
7. Submit the ticket — it appears at the top of the list
8. Navigate between pages freely — each micro-frontend loads independently

### 4. Live demo: Failure isolation (5 min)

**Steps:**

1. While the app is running, kill the billing preview server:
   ```bash
   lsof -ti:5002 | xargs kill
   ```
2. Navigate to **/billing** — the error boundary renders:
   > "Failed to load Billing — The Billing micro-frontend is unavailable."
3. Navigate to **/support** — works fine! This is the whole point.
4. Navigate to **Home** — also fine.
5. Restart the billing server and click **Retry** — it recovers.

**Key point**: One team's outage doesn't take down the whole app.

### 5. Cross-app communication deep dive (5 min)

Open `packages/shared/src/event-bus.ts`:

- Tiny pub/sub (~30 lines)
- Singleton via `window.__MF_EVENT_BUS__`
- Used by all three frameworks without any framework-specific adapter

Show the flow:
```
Host: Login button → eventBus.emit(AUTH_CHANGED, { isLoggedIn: true, ... })
Billing (Vue): eventBus.on(AUTH_CHANGED, (state) => { auth.value = state })
Support (Svelte): eventBus.on(AUTH_CHANGED, (state) => { auth = state })

Billing: "Create Support Ticket" → eventBus.emit(CREATE_TICKET, { invoiceId, title })
                                  → eventBus.emit(NAVIGATE, "/support")
Support: eventBus.on(CREATE_TICKET, (payload) => { prefill form })
Host: eventBus.on(NAVIGATE, (path) => { navigate(path) })
```

**Key point**: The bus is the contract. Add any framework — if it can call `eventBus.on()`, it participates.

### 6. Shared packages (3 min)

- `@mf-demo/shared`: Types + event bus + constants. Pure TS, no framework dep.
- `@mf-demo/ui`: CSS-only. Design tokens via CSS custom properties. Any framework can use `.btn`, `.card`, etc.

**Key point**: Keep shared packages framework-agnostic. Types and styles are the common ground.

### 7. Lazy loading demo: On-demand remote widget (5 min)

**Setup:** Open the **Network tab** in DevTools before starting. Filter by JS requests.

**Steps:**

1. Navigate to the **Home page** (localhost:5001)
2. Point out the "Lazy Loading Demo" section at the bottom
3. Note: **no `remoteEntry.js` from localhost:5002 has loaded yet** — the billing remote is not fetched on the home page
4. Click **"Load Billing Stats Widget"**
   - Watch the Network tab: `remoteEntry.js` + `BillingStats-*.js` + `vue-*.js` load on demand
   - The Billing Stats widget (Vue component) appears with invoice summary cards
5. Click **"Hide Billing Stats"** — the widget hides, but no new network requests
6. Click **"Load Billing Stats Widget"** again — it reappears instantly (already cached)

**Show the code** (`apps/host-react/src/App.tsx` — `HomePage` component):

```tsx
const loadBillingStats = async () => {
  const mod = await import("billing/BillingStats");   // dynamic import → triggers remoteEntry.js fetch
  setStatsComponent(() => mod.default);
  setShowStats(true);
};
```

**Key points:**
- No `React.lazy()` or `<Suspense>` needed — just a plain dynamic `import()` triggered by user action
- The remote entry and its chunk are fetched **only when the button is clicked**
- The Vue component renders inside the React host via a thin wrapper (`BillingStatsWrapper.tsx`)
- After the first load, the module is cached — subsequent toggles are instant

**Config highlight** (`apps/billing-vue/vite.config.ts`):
```ts
exposes: {
  "./BillingPage": "./src/BillingPageWrapper.tsx",    // full page (loaded via route)
  "./BillingStats": "./src/BillingStatsWrapper.tsx",  // widget (loaded on demand)
}
```
A single remote can expose multiple components — pages, widgets, sidebars — each loaded independently.

### 8. Discussion: When to use micro-frontends (5–10 min)

**Good fit:**
- Multiple teams that need deployment autonomy
- Incremental migration from one framework to another
- Large apps with clearly separable domains (billing, support, analytics)
- Organizations where team boundaries align with feature boundaries

**Bad fit:**
- Small teams / single-team projects — the overhead isn't worth it
- Tightly coupled features that share a lot of state
- Performance-critical apps where extra JS bundles matter
- When you can just use a monolith with good module boundaries

---

## Common Q&A

**Q: Doesn't loading multiple frameworks kill performance?**
A: Yes, there's overhead. In this demo: React (~45KB gz) + Vue (~70KB gz) + Svelte (~0KB runtime). In practice, most orgs use 1–2 frameworks max. The trade-off is team velocity vs. bundle size.

**Q: How do you handle shared state beyond the event bus?**
A: For simple cases, the event bus is enough. For complex shared state, consider:
- URL params (works across any framework)
- A shared store (e.g., a framework-agnostic Zustand-like store on window)
- Backend-driven state (API calls)
- Avoid shared React/Vue contexts — they don't cross framework boundaries

**Q: How do you test across micro-frontends?**
A: Unit tests per remote (standard Jest/Vitest). Integration tests with Playwright/Cypress that spin up all remotes. Contract tests for the event bus (both sides agree on event shapes).

**Q: What about CSS conflicts?**
A: This demo uses scoped styles (Vue `<style scoped>`, Svelte auto-scoping) + shared CSS custom properties. In production, also consider CSS modules or a naming convention (BEM).

**Q: How does deployment work in production?**
A: Each remote is independently built and deployed (e.g., to its own S3 bucket / CDN path). The host references remote entry URLs that can be updated without redeploying the host. Use content-hashed filenames for cache busting.

**Q: Can two remotes communicate directly?**
A: Through the event bus, yes (Billing → Support via CREATE_TICKET). Direct imports between remotes are not recommended — it creates tight coupling.

---

## Demo checklist

Before the session:

- [ ] `pnpm install` runs cleanly
- [ ] `pnpm dev` starts all three apps
- [ ] http://localhost:5001 loads the host
- [ ] /billing loads the Vue remote
- [ ] /support loads the Svelte remote
- [ ] Login/Logout toggle works and propagates
- [ ] "Create Support Ticket" from billing navigates to support with prefilled form
- [ ] "Load Billing Stats Widget" on Home loads remoteEntry.js on demand (check Network tab)
- [ ] Hiding and re-showing the widget doesn't trigger new network requests
- [ ] Killing port 5002 shows error boundary on /billing
- [ ] Other routes still work when one remote is down
