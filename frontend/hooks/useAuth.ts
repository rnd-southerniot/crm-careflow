import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi, LoginRequest, LoginResponse, User } from '@/services/api';
import { useAuthStore } from '@/lib/zustand-store/store';

// Auth Query Keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Login Hook
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data: LoginResponse) => {
      // Store auth data
      setAuth({
        token: data.access_token,
        user: data.user,
      });

      toast.success('Login successful');
      
      // Redirect based on role
      const role = data.user.role.name;
      switch (role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'SALES':
          router.push('/sales/dashboard');
          break;
        case 'IMPLEMENTATION_LEAD':
          router.push('/implementation/dashboard');
          break;
        case 'HARDWARE_ENGINEER':
          router.push('/hardware/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
};

// Logout Hook
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: () => {
      // Clear auth even if logout API fails
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });
};

// Profile Hook
export const useProfile = () => {
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);

  const query = useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update user in store when data changes
  React.useEffect(() => {
    if (query.data) {
      updateUser(query.data);
    }
  }, [query.data, updateUser]);

  return query;
};

// Auth Guard Hook
export const useAuthGuard = (requiredRole?: string, requiredPermission?: { resource: string; action: string }) => {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuthStore();
  const router = useRouter();

  // Check authentication
  if (!isAuthenticated || !user) {
    router.push('/login');
    return { isAuthorized: false, isLoading: false };
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole as any)) {
    return { isAuthorized: false, isLoading: false, error: 'Insufficient role permissions' };
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return { isAuthorized: false, isLoading: false, error: 'Insufficient permissions' };
  }

  return { isAuthorized: true, isLoading: false };
};

// Permission Hook
export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuthStore();

  return {
    hasPermission,
    hasRole,
    user,
    canCreateTasks: hasRole('SALES') || hasRole('ADMIN'),
    canSubmitReports: hasRole('IMPLEMENTATION_LEAD') || hasRole('ADMIN'),
    canProvisionDevices: hasRole('HARDWARE_ENGINEER') || hasRole('ADMIN'),
    canManageUsers: hasRole('ADMIN'),
    canViewAllTasks: hasRole('ADMIN') || hasRole('IMPLEMENTATION_LEAD'),
  };
};