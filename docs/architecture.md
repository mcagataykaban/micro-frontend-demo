# Architecture

## Integration patterns

There are several ways to integrate micro-frontends. This demo uses **runtime integration via Module Federation**.

### Build-time integration
- NPM packages consumed as dependencies
- Simple but defeats the purpose: you must rebuild + redeploy the host whenever a remote changes
- Tight coupling at the package level

### Server-side integration
- Edge/SSR composition (e.g., Podium, Tailor)
- Good for SEO-critical pages
- Harder to get client-side interactivity right

### Runtime integration via iframes
- Strongest isolation (separate browsing contexts)
- Painful for routing, resizing, communication, accessibility
- Used by legacy portals

### Runtime integration via Module Federation (this demo)
- Remotes expose ES modules; host imports them at runtime
- Shared dependencies are negotiated (e.g., only one copy of React)
- Good balance of isolation and integration
- Vite plugin: `@originjs/vite-plugin-federation`

## How this demo works

```
1. Remotes (billing-vue, support-svelte) are built with vite.
   Each produces dist/assets/remoteEntry.js — the federation manifest.

2. Host (host-react) is configured with remote URLs pointing to those entries.

3. At runtime, React.lazy(() => import("billing/BillingPage")) triggers:
   a. Fetch remoteEntry.js from billing remote
   b. Resolve the exposed module "./BillingPage"
   c. Execute and render the Vue component inside the React tree

4. The shared event bus (window singleton) connects all three frameworks.
```

## Shared libraries strategy

### `@mf-demo/shared`
- Pure TypeScript, no framework dependency
- Compiled to ESM (`tsc` → `dist/`)
- Consumed by all three apps via workspace dependency
- Contains: event bus, types (Invoice, Ticket, AuthState), event name constants
- The event bus attaches to `window.__MF_EVENT_BUS__` so all micro-frontends share one instance

### `@mf-demo/ui`
- CSS-only package — no build step
- Design tokens via CSS custom properties
- Base component classes (`.btn`, `.card`, `.input`, `.badge`)
- All frameworks import it: framework-agnostic styling

### Module Federation `shared` config
- React + ReactDOM are shared between host and any React remotes
- Vue is shared within the billing remote
- Svelte compiles away, so nothing to share

## Pros and cons

### Pros
- **Team autonomy**: each team picks its own framework, deploys independently
- **Incremental migration**: rewrite one section at a time (e.g., billing moves from Angular to Vue)
- **Fault isolation**: if billing crashes, support and the shell keep working
- **Independent scaling**: billing team ships daily, support team ships weekly — no coordination needed
- **Smaller bundles per team**: each remote is a small, focused build

### Cons
- **Complexity**: more moving parts (build config, remote URLs, shared state)
- **Duplicate dependencies**: multiple frameworks = larger total bundle
- **CSS conflicts**: global styles can leak between micro-frontends (mitigate with scoped styles / CSS modules)
- **Testing**: E2E testing across micro-frontends is harder
- **Shared state**: no shared React context — must use explicit mechanisms (event bus, URL params, shared store)
- **Version skew**: remote A may ship breaking changes to the shared contract before remote B catches up

## Failure modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Remote server down | That route shows error boundary | Error boundary with retry button; rest of app works |
| Remote JS error | Component crash | React error boundary catches it |
| Event bus message lost | Cross-app feature breaks | Design for eventual consistency; no critical paths through the bus |
| Shared type mismatch | Runtime errors | Keep `@mf-demo/shared` versioned; CI checks all consumers |
| Network latency | Slow remote load | Loading fallback UI; consider preloading critical remotes |

## Caching and versioning

### Development
- Remotes are built and served via `vite preview` (static file server)
- Host runs in `vite` dev mode with HMR

### Production considerations
- **Content-hash filenames**: Vite produces hashed chunk names automatically
- **remoteEntry.js**: This is the entry point and should have short/no cache (or be versioned)
- **Strategy**: remoteEntry.js with no-cache header; all other chunks with long-lived cache (immutable)
- **Version pinning**: host can reference a specific version of remoteEntry.js via URL (e.g., `/v2/assets/remoteEntry.js`)
- **Rollback**: since remotes are independent, rolling back = redeploying the previous build of that remote

## Communication patterns

```
Host ──(AUTH_CHANGED)──> Billing (listens)
Host ──(AUTH_CHANGED)──> Support (listens)
Billing ──(CREATE_TICKET)──> Support (listens, prefills form)
Billing ──(NAVIGATE)──> Host (navigates to /support)
```

All communication goes through the shared event bus — a simple pub/sub attached to `window`. No direct imports between micro-frontends.
