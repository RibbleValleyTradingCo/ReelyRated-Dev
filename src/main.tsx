import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnvironmentOrThrow } from "./lib/env-validation";
import { initCSPReporting } from "./lib/csp-reporting";
import { ThemeProvider } from "next-themes";

// SEC-003: Validate environment variables before app startup
// Fails fast with clear error messages if configuration is invalid
validateEnvironmentOrThrow();

// SEC-004: Initialise CSP violation monitoring
// Logs violations to console and optionally sends to server
initCSPReporting();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <App />
  </ThemeProvider>
);
