"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/zustand-store/store";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: Array<'SALES' | 'IMPLEMENTATION_LEAD' | 'HARDWARE_ENGINEER' | 'ADMIN'>;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: ReactNode;
  showFallback?: boolean;
}

export default function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
  showFallback = false
}: RoleGuardProps) {
  const { user } = useAuthStore();
  const { hasRole, hasPermission } = usePermissions();

  // Check if user has required role
  const hasRequiredRole = allowedRoles 
    ? allowedRoles.some(role => hasRole(role))
    : true;

  // Check if user has required permission
  const hasRequiredPermission = requiredPermission
    ? hasPermission(requiredPermission.resource, requiredPermission.action)
    : true;

  // If user doesn't meet requirements
  if (!hasRequiredRole || !hasRequiredPermission) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function SalesOnly({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['SALES', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function ImplementationOnly({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['IMPLEMENTATION_LEAD', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function HardwareOnly({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['HARDWARE_ENGINEER', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

// Permission-based guards
export function CanCreateTasks({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['SALES', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function CanSubmitReports({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['IMPLEMENTATION_LEAD', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function CanProvisionDevices({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['HARDWARE_ENGINEER', 'ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function CanManageUsers({ children, fallback, showFallback = false }: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['ADMIN']} 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}