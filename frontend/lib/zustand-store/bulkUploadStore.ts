// lib/zustand-store/bulkUploadStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BulkUploadState {
  // Maps companyId → last step index
  currentStepByCompany: Record<number, number>;

  // SINGLE boolean: if true, wizard “remembers” step; if false, it never persists
  persistEnabled: boolean;

  // Turn persistence on or off
  setPersistEnabled: (enabled: boolean) => void;

  // Only updates the map if persistEnabled===true
  setStepForCompany: (companyId: number, stepIndex: number) => void;

  // Clear everything (resets the map and re-enables persistence)
  clearAll: () => void;
}

export const useBulkUploadStore = create<BulkUploadState>()(
  persist(
    (set, get) => ({
      // ───────────────────────────────────────────────────────────────────────────
      // default state:
      // ───────────────────────────────────────────────────────────────────────────
      currentStepByCompany: {},
      
      //! Change this to enable or disable persistancy.
      persistEnabled: false,

      // ───────────────────────────────────────────────────────────────────────────
      // Action to toggle persistence on/off
      // ───────────────────────────────────────────────────────────────────────────
      setPersistEnabled: (enabled: boolean) => {
        if (!enabled) {
          // If turning OFF persistence, immediately clear any saved steps
          set({ currentStepByCompany: {} });
        }
        set({ persistEnabled: enabled });
      },

      // ───────────────────────────────────────────────────────────────────────────
      // Action to update a given company’s last step, but only if persistence is ON
      // ───────────────────────────────────────────────────────────────────────────
      setStepForCompany: (companyId, stepIndex) => {
        if (!get().persistEnabled) {
          // If persistence is disabled, ignore
          return;
        }
        set((state) => ({
          currentStepByCompany: {
            ...state.currentStepByCompany,
            [companyId]: stepIndex,
          },
        }));
      },

      // ───────────────────────────────────────────────────────────────────────────
      // Clear all saved steps and re-enable persistence
      // ───────────────────────────────────────────────────────────────────────────
      clearAll: () => set({ currentStepByCompany: {}, persistEnabled: true }),
    }),
    {
      name: "bulk-upload-storage",
      storage: createJSONStorage(() => localStorage),
      // We only persist `currentStepByCompany`. We explicitly do NOT persist `persistEnabled`
      // so that toggling it will immediately clear out old data if you turn it off.
      partialize: (state) => ({
        currentStepByCompany: state.currentStepByCompany,
      }),
    }
  )
);
