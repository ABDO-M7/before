//provider.js
"use client";
import { Provider } from "react-redux";
import { store, persistor } from ".";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      {/* ✅ Error Boundary - Catches errors in Redux-connected components */}
      <ErrorBoundary>
        {/* ✅ PersistGate: waits for rehydration so cached settings/language/auth are available */}
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </ErrorBoundary>
    </Provider>
  );
}