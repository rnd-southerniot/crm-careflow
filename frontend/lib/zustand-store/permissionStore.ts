import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define types for permissions based on UserDetailData
interface Permission {
  name: string;
  id: number;
}

interface Element {
  name: string;
  id: number;
  permissions: Permission[];
}

interface Submodule {
  name: string;
  id: number;
  elements: Element[];
}

interface Module {
  name: string;
  id: number;
  submodule: Submodule[];
}

interface PermissionsState {
  permissions: Module[] | null;
  setPermissions: (permissions: Module[]) => void;
  clearPermissions: () => void;
  hasPermission: ({
    moduleName,
    submoduleName,
    elementName,
    permissionName
  }: {
    moduleName: string;
    submoduleName: string;
    elementName: string;
    permissionName: string;
  }) => boolean;
  getModule: (moduleName: string) => Module | undefined;
  getSubmodule: ({
    moduleName,
    submoduleName
  }: {
    moduleName: string;
    submoduleName: string;
  }) => Submodule | undefined;
  getElement: ({
    moduleName,
    submoduleName,
    elementName
  }: {
    moduleName: string;
    submoduleName: string;
    elementName: string;
  }) => Element | undefined;
}

// Create the Zustand store with persistence
export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      permissions: null,
      setPermissions: (permissions: Module[]) => set({ permissions }),
      clearPermissions: () => set({ permissions: null }),
      hasPermission: ({
        moduleName,
        submoduleName,
        elementName,
        permissionName
      }: {
        moduleName: string;
        submoduleName: string;
        elementName: string;
        permissionName: string;
      }) => {
        const { permissions } = get();
        if (!permissions) return false;

        const module = permissions.find((m) => m.name === moduleName);
        if (!module) return false;

        const submodule = module.submodule.find((sm) => sm.name === submoduleName);
        if (!submodule) return false;

        const element = submodule.elements.find((e) => e.name === elementName);
        if (!element) return false;

        return element.permissions.some((p) => p.name === permissionName);
      },
      getModule: (moduleName: string) => {
        const { permissions } = get();
        return permissions?.find((m) => m.name === moduleName);
      },
      getSubmodule: ({
        moduleName,
        submoduleName
      }: {
        moduleName: string;
        submoduleName: string;
      }) => {
        const { permissions } = get();
        const module = permissions?.find((m) => m.name === moduleName);
        return module?.submodule.find((sm) => sm.name === submoduleName);
      },
      getElement: ({
        moduleName,
        submoduleName,
        elementName
      }: {
        moduleName: string;
        submoduleName: string;
        elementName: string;
      }) => {
        const { permissions } = get();
        const module = permissions?.find((m) => m.name === moduleName);
        const submodule = module?.submodule.find((sm) => sm.name === submoduleName);
        return submodule?.elements.find((e) => e.name === elementName);
      }
    }),
    {
      name: "permissions-storage",
      storage: createJSONStorage(() => {
        // Ensure localStorage is only accessed on the client-side
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // Return a no-op storage for server-side
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
      })
    }
  )
);
