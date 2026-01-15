import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// CRM System User Types
export type Permissions = Record<string, string[]>;

export interface Role {
  id: string;
  name: 'SALES' | 'IMPLEMENTATION_LEAD' | 'HARDWARE_ENGINEER' | 'ADMIN';
  permissions: Permissions;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: ({ token, user }: { token: string; user: User }) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: Role['name']) => boolean;
  setHasHydrated: (state: boolean) => void;
}

// Create the Zustand store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: ({ token, user }: { token: string; user: User }) =>
        set({ token, user, isAuthenticated: true }),

      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),

      hasPermission: (resource: string, action: string): boolean => {
        const { user } = get();
        if (!user?.role?.permissions) return false;

        const resourcePermissions = user.role.permissions[resource];
        if (!resourcePermissions) return false;

        return resourcePermissions.includes(action);
      },

      hasRole: (roleName: Role['name']): boolean => {
        const { user } = get();
        return user?.role?.name === roleName;
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "crm-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (rehydratedState, error) => {
          if (!error && rehydratedState) {
            rehydratedState.setHasHydrated(true);
          }
        };
      },
      partialize: (state: AuthState) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);