"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/zustand-store/store";
import { Loader2 } from "lucide-react";

type RoleName = 'SALES' | 'IMPLEMENTATION_LEAD' | 'HARDWARE_ENGINEER' | 'ADMIN';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RoleName | RoleName[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = "/login"
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole, hasPermission, _hasHydrated } = useAuthStore();
  const router = useRouter();

  // Helper to check if user has any of the required roles
  const hasRequiredRole = (): boolean => {
    if (!requiredRole) return true;
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => hasRole(role));
    }
    return hasRole(requiredRole);
  };

  useEffect(() => {
    if (!_hasHydrated) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push(fallbackPath);
      return;
    }

    // Check role if required
    if (requiredRole && !hasRequiredRole()) {
      router.push("/unauthorized");
      return;
    }

    // Check permission if required
    if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
      router.push("/unauthorized");
      return;
    }
  }, [isAuthenticated, user, requiredRole, requiredPermission, router, hasRole, hasPermission, fallbackPath]);

  // Show loading while checking authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Check role authorization
  if (requiredRole && !hasRequiredRole()) {
    const roleDisplay = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have the required role to access this page.</p>
          <p className="text-sm text-gray-500 mt-1">Required: {roleDisplay}</p>
        </div>
      </div>
    );
  }

  // Check permission authorization
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have the required permissions to access this page.</p>
          <p className="text-sm text-gray-500 mt-1">
            Required: {requiredPermission.action} on {requiredPermission.resource}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}