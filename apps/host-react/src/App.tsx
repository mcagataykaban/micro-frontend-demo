import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { eventBus, Events } from "@mf-demo/shared";
import type { AuthState } from "@mf-demo/shared";
import ErrorBoundary from "./ErrorBoundary";

// Lazy-load remote components
const BillingPage = lazy(() => import("billing/BillingPage"));
const SupportPage = lazy(() => import("support/SupportPage"));

const REMOTE_URLS: Record<string, string> = {
  billing: (window as any).__remotes__?.billing ?? "http://localhost:5002/assets/remoteEntry.js",
  support: (window as any).__remotes__?.support ?? "http://localhost:5003/assets/remoteEntry.js",
};

const HEALTH_INTERVAL = 5000;

function useRemoteHealth() {
  const [health, setHealth] = useState<Record<string, boolean>>({
    billing: true,
    support: true,
  });

  const check = useCallback(async () => {
    const results: Record<string, boolean> = {};
    await Promise.all(
      Object.entries(REMOTE_URLS).map(async ([name, url]) => {
        try {
          const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
          // no-cors returns opaque response (status 0) on success
          results[name] = res.status === 0 || res.ok;
        } catch {
          results[name] = false;
        }
      })
    );
    setHealth(results);
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, HEALTH_INTERVAL);
    return () => clearInterval(id);
  }, [check]);

  return health;
}

function LoadingFallback({ name }: { name: string }) {
  return (
    <div className="loading-fallback">
      <div className="spinner" />
      <span>Loading {name} micro-frontend...</span>
    </div>
  );
}

function HomePage() {
  const [showStats, setShowStats] = useState(false);
  const [StatsComponent, setStatsComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBillingStats = async () => {
    if (StatsComponent) {
      // Already loaded — just toggle visibility
      setShowStats((prev) => !prev);
      return;
    }
    setLoading(true);
    try {
      const mod = await import("billing/BillingStats");
      setStatsComponent(() => mod.default);
      setShowStats(true);
    } catch (err) {
      console.error("Failed to load BillingStats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>Micro-Frontend Demo</h1>
      <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
        This host application loads two independent remote micro-frontends at
        runtime using Module Federation.
      </p>
      <div className="arch-diagram">
        {`┌──────────────────────────────────────────────────┐
│                   HOST (React)                   │
│                  localhost:5001                  │
│                                                  │
│  ┌─────────────────┐    ┌──────────────────────┐ │
│  │  /billing ──────────> │  BILLING (Vue)      │ │
│  │                 │    │  localhost:5002      │ │
│  │                 │    └──────────────────────┘ │
│  │  /support ──────────> ┌──────────────────────┐│
│  │                 │    │  SUPPORT (Svelte)     ││
│  │                 │    │  localhost:5003       ││
│  └─────────────────┘    └───────────────────────┘│
│                                                  │
│          ┌──────────────────────┐                │
│          │  Shared Event Bus    │                │
│          │  (window singleton)  │                │
│          └──────────────────────┘                │
└──────────────────────────────────────────────────┘`}
      </div>
      <div className="features">
        <div className="card">
          <span className="mf-tag mf-tag-react">React</span>
          <h3 style={{ margin: "var(--space-sm) 0" }}>Host Shell</h3>
          <p className="text-sm text-muted">
            Routing, auth state, navigation, error boundaries
          </p>
        </div>
        <div className="card">
          <span className="mf-tag mf-tag-vue">Vue 3</span>
          <h3 style={{ margin: "var(--space-sm) 0" }}>Billing Remote</h3>
          <p className="text-sm text-muted">
            Invoices, filters, support ticket creation
          </p>
        </div>
        <div className="card">
          <span className="mf-tag mf-tag-svelte">Svelte</span>
          <h3 style={{ margin: "var(--space-sm) 0" }}>Support Remote</h3>
          <p className="text-sm text-muted">
            Tickets list, cross-app ticket creation
          </p>
        </div>
      </div>

      <div style={{ marginTop: "var(--space-xl)" }}>
        <h2 style={{ marginBottom: "var(--space-md)" }}>Lazy Loading Demo</h2>
        <p className="text-sm text-muted" style={{ marginBottom: "var(--space-md)" }}>
          The widget below is a Vue component served from the billing remote (localhost:5002).
          Open the <strong>Network tab</strong> and click the button — you'll see <code>remoteEntry.js</code> load on demand.
        </p>
        <button
          className={`btn ${showStats ? "" : "btn-primary"}`}
          onClick={loadBillingStats}
          disabled={loading}
        >
          {loading ? "Loading..." : showStats ? "Hide Billing Stats" : "Load Billing Stats Widget"}
        </button>
        {showStats && StatsComponent && (
          <div style={{ marginTop: "var(--space-md)" }}>
            <StatsComponent />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    username: "Guest",
  });
  const navigate = useNavigate();
  const remoteHealth = useRemoteHealth();

  useEffect(() => {
    // Listen for navigation events from remotes
    const unsub = eventBus.on<string>(Events.NAVIGATE, (path) => {
      navigate(path);
    });
    return unsub;
  }, [navigate]);

  const toggleAuth = () => {
    const next: AuthState = auth.isLoggedIn
      ? { isLoggedIn: false, username: "Guest" }
      : { isLoggedIn: true, username: "jane.doe@acme.com" };
    setAuth(next);
    eventBus.emit(Events.AUTH_CHANGED, next);
  };

  return (
    <>
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
          <span className="font-bold">
            <span className="mf-tag mf-tag-react">React Host</span>
          </span>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Home
            </NavLink>
            {remoteHealth.billing && (
              <NavLink to="/billing" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Billing
              </NavLink>
            )}
            {remoteHealth.support && (
              <NavLink to="/support" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                Support
              </NavLink>
            )}
          </div>
        </div>
        <div className="nav-right">
          <span className="auth-status">
            {auth.isLoggedIn ? `Logged in as ${auth.username}` : "Not logged in"}
          </span>
          <button className={`btn ${auth.isLoggedIn ? "" : "btn-primary"}`} onClick={toggleAuth}>
            {auth.isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </nav>

      <div className="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/billing"
            element={
              <ErrorBoundary name="Billing">
                <Suspense fallback={<LoadingFallback name="Billing" />}>
                  <BillingPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="/support"
            element={
              <ErrorBoundary name="Support">
                <Suspense fallback={<LoadingFallback name="Support" />}>
                  <SupportPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Routes>
      </div>
    </>
  );
}
