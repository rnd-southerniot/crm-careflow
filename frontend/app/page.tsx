"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/zustand-store/store";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Redirecting...</span>
      </div>
    </div>
  );
}
