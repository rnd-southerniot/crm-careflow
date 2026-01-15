"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Package,
  Workflow,
  FileText,
  HardDrive,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Building2
} from "lucide-react";
import { useAuthStore } from "@/lib/zustand-store/store";
import { useLogout, usePermissions } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permission?: { resource: string; action: string };
}

const getNavigationForRole = (roleName: string): NavItem[] => {
  const baseNavigation: NavItem[] = [
    {
      name: "Dashboard",
      href: roleName === 'ADMIN' ? "/admin/dashboard" :
        roleName === 'SALES' ? "/sales/dashboard" :
          roleName === 'IMPLEMENTATION_LEAD' ? "/implementation/dashboard" :
            roleName === 'HARDWARE_ENGINEER' ? "/hardware/dashboard" :
              "/dashboard",
      icon: Home,
    },
  ];

  // Role-specific navigation items
  switch (roleName) {
    case 'ADMIN':
      return [
        ...baseNavigation,
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          name: "Products",
          href: "/admin/products",
          icon: Package,
        },
        {
          name: "Clients",
          href: "/clients",
          icon: Building2,
        },
        {
          name: "All Tasks",
          href: "/tasks",
          icon: Workflow,
        },
        {
          name: "Reports",
          href: "/reports",
          icon: FileText,
        },
        {
          name: "Hardware",
          href: "/admin/hardware-catalog",
          icon: HardDrive,
        },
        {
          name: "Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ];

    case 'SALES':
      return [
        ...baseNavigation,
        {
          name: "Create Task",
          href: "/tasks/create",
          icon: Workflow,
        },
        {
          name: "My Tasks",
          href: "/tasks?created=me",
          icon: Workflow,
        },
        {
          name: "Clients",
          href: "/clients",
          icon: Building2,
        },
      ];

    case 'IMPLEMENTATION_LEAD':
      return [
        ...baseNavigation,
        {
          name: "My Tasks",
          href: "/tasks?assigned=me",
          icon: Workflow,
        },
        {
          name: "All Tasks",
          href: "/tasks",
          icon: Workflow,
        },
      ];

    case 'HARDWARE_ENGINEER':
      return [
        ...baseNavigation,
        {
          name: "My Devices",
          href: "/hardware/devices",
          icon: HardDrive,
        },
        {
          name: "QR Codes",
          href: "/hardware/qr-codes",
          icon: Package,
        },
        {
          name: "Tasks",
          href: "/tasks?assigned=me",
          icon: Workflow,
        },
      ];

    default:
      return [
        ...baseNavigation,
        {
          name: "Tasks",
          href: "/tasks",
          icon: Workflow,
        },
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ];
  }
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { hasRole, hasPermission } = usePermissions();
  const logoutMutation = useLogout();
  const pathname = usePathname();

  // Get role-specific navigation
  const navigation = getNavigationForRole(user?.role.name || '');

  const filteredNavigation = navigation.filter((item) => {
    // Check role requirement
    if (item.roles && !item.roles.some(role => hasRole(role as any))) {
      return false;
    }

    // Check permission requirement
    if (item.permission && !hasPermission(item.permission.resource, item.permission.action)) {
      return false;
    }

    return true;
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">CRM System</h1>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.fullName}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {user?.role.name}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.fullName} />
                      <AvatarFallback>
                        {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}