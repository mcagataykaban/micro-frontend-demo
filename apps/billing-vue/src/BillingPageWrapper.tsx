import React, { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import BillingPage from "./BillingPage.vue";

const BillingPageWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (containerRef.current && !appRef.current) {
      // Create and mount Vue app
      appRef.current = createApp(BillingPage);
      appRef.current.mount(containerRef.current);
    }

    return () => {
      // Cleanup Vue app on unmount
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
};

export default BillingPageWrapper;
