type Listener<T = unknown> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as Listener);

    // Return unsubscribe function
    return () => {
      set.delete(listener as Listener);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  emit<T = unknown>(event: string, payload: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => listener(payload));
    }
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Singleton: attach to window so all micro-frontends share the same instance
const GLOBAL_KEY = "__MF_EVENT_BUS__";

function getEventBus(): EventBus {
  if (typeof window !== "undefined") {
    const w = window as unknown as Record<string, unknown>;
    if (!w[GLOBAL_KEY]) {
      w[GLOBAL_KEY] = new EventBus();
    }
    return w[GLOBAL_KEY] as EventBus;
  }
  // SSR fallback
  return new EventBus();
}

export const eventBus = getEventBus();
export type { EventBus };
