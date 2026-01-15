"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DrawerProps {
  isOpenState: boolean;
  drawerTitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "w-1/4" | "w-2/4" | "w-3/4" | "w-1/3" | "w-2/3" | "w-1/2" | "w-full" | string;
  className?: string;
}

export function CustomDrawer({
  isOpenState,
  drawerTitle = "Drawer",
  children,
  onClose,
  size = "w-1/4",
  className
}: DrawerProps) {
  return (
    <div className={`relative ${className ? className : ""}`}>
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 ${size} bg-background min-w-[250px] transform shadow-lg transition-transform duration-300 ease-in-out dark:border-l ${
          isOpenState ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold">{drawerTitle}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
