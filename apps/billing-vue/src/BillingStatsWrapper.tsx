import React, { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import BillingStats from "./BillingStats.vue";

const BillingStatsWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (containerRef.current && !appRef.current) {
      appRef.current = createApp(BillingStats);
      appRef.current.mount(containerRef.current);
    }

    return () => {
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
};

export default BillingStatsWrapper;
