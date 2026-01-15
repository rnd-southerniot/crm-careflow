import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RouteStore {
  routes: string[];
  setRoutes: (routes: string[]) => void;
  getRoutes: () => string[];
}

export const useRouteStore = create<RouteStore>()(
  persist(
    (set, get) => ({
      routes: [],
      setRoutes: (routes: string[]) => set({ routes }),
      getRoutes: () => get().routes,
    }),
    {
      name: 'route-store', // Storage key
      storage: createJSONStorage(() => localStorage), // Use localStorage or another storage mechanism
    }
  )
);
