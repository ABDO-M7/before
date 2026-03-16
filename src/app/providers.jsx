"use client";

import { Providers as ReduxProvider } from "@/redux/store/providers";
import initFetchLogger from "@/utils/fetchLogger";
import NavigationProgress from "@/components/NavigationProgress/NavigationProgress";
import TokenAuthHandler from "@/components/Layout/TokenAuthHandler";

// Only initialize client-side fetch logger in development
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  initFetchLogger();
}

// ✅ Auto-clear service workers and caches in development mode
if (process.env.NODE_ENV === "development") {
  import("@/utils/devCacheClear");
}

// ✅ GoogleOAuthProvider removed: Login/Register use manual OAuth popup (no @react-oauth/google).
// Saves ~90 KiB unused JS (accounts.google.com/gsi/client) on every page load.
export default function AppProviders({ children }) {
  return (
    <ReduxProvider>
      <NavigationProgress />
      <TokenAuthHandler />
      {children}
    </ReduxProvider>
  );
}
