import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/index.css";

// Register Service Worker for PWA offline in-store capability with automatic update detection
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("FSA Scanner Service Worker registered:", reg.scope);
        // Force check for sw.js updates immediately on page load
        reg.update().catch(() => {});

        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.info("New FSA Scanner version installed. Cache updated.");
              }
            });
          }
        });
      })
      .catch((err) => console.warn("Service Worker registration failed:", err));

    // Reload seamlessly when the new service worker activates to load fresh bundles
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
