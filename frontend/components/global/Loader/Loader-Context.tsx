// apps/main-app/lib/LoadingContext.tsx
"use client"; // Mark as Client Component

import { createContext, useContext, useState, ReactNode } from "react";
import { LoadingOverlay } from "./LoadingOverlay";

interface LoadingState {
  isLoading: boolean;
  loaderText: string;
}

interface LoadingContextType {
  isLoading: boolean;
  loaderText: string;
  setLoading: (isLoading: boolean, loaderText?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loaderText: "Loading"
  });

  const setLoading = (isLoading: boolean, loaderText?: string) => {
    setLoadingState({
      isLoading,
      loaderText: loaderText || "Loading"
    });
  };

  return (
    <LoadingContext.Provider value={{ ...loadingState, setLoading }}>
      <LoadingOverlay isLoading={loadingState.isLoading} loaderText={loadingState.loaderText} />
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook to use the context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
