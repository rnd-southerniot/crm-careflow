"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/zustand-store/store";
import { usePermissions } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Package, 
  Workflow, 
  FileText, 
  HardDrive, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect to role-specific dashboard
  useEffect(() => {
    if (user?.role?.name) {
      const role = user.role.name;
      switch (role) {
        case 'ADMIN':
          router.replace('/admin/dashboard');
          break;
        case 'SALES':
          router.replace('/sales/dashboard');
          break;
        case 'IMPLEMENTATION_LEAD':
          router.replace('/implementation/dashboard');
          break;
        case 'HARDWARE_ENGINEER':
          router.replace('/hardware/dashboard');
          break;
        default:
          // Stay on generic dashboard
          break;
      }
    }
  }, [user?.role?.name, router]);

  // Show loading while redirecting
  if (user?.role?.name && ['ADMIN', 'SALES', 'IMPLEMENTATION_LEAD', 'HARDWARE_ENGINEER'].includes(user.role.name)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Generic dashboard for unknown roles (fallback)
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the CRM & Workflow System</p>
          </div>

          {/* Generic content for unknown roles */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Your role-specific dashboard is being prepared. Please contact your administrator if you continue to see this message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Role: {user?.role?.name || 'Unknown'}</h3>
                <p className="text-gray-600 mb-4">Please contact your system administrator for proper role assignment.</p>
                <Button asChild variant="outline">
                  <Link href="/profile">
                    View Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}