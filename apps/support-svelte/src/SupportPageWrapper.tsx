import React, { useEffect, useRef } from "react";
import SupportPage from "./SupportPage.svelte";

const SupportPageWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && !componentRef.current) {
      // Create and mount Svelte component
      componentRef.current = new SupportPage({
        target: containerRef.current,
      });
    }

    return () => {
      // Cleanup Svelte component on unmount
      if (componentRef.current) {
        componentRef.current.$destroy();
        componentRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
};

export default SupportPageWrapper;
