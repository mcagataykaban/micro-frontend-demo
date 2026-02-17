import "@mf-demo/ui/styles.css";
import SupportPage from "./SupportPage.svelte";

// Standalone mount (for independent development)
const app = new SupportPage({
  target: document.getElementById("app")!,
});

export default app;
