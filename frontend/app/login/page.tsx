"use client";

import LoginForm from "@/components/auth/Login.Client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/zustand-store/store";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      // Redirect based on role
      const role = user.role.name;
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
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LoginForm />
    </div>
  );
}