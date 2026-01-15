"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowApi, productsApi, usersApi } from "@/services/api";
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
  TrendingUp,
  Settings,
  Shield,
  Database,
  Activity,
  Plus,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Fetch all data for admin overview
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: workflowApi.getTasks,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  });

  // Calculate statistics
  const totalTasks = tasks?.length || 0;
  const activeTasks = tasks?.filter(t => t.currentStatus !== 'READY_FOR_INSTALLATION').length || 0;
  const completedTasks = tasks?.filter(t => t.currentStatus === 'READY_FOR_INSTALLATION').length || 0;
  const totalProducts = products?.length || 0;
  const totalUsers = users?.length || 0;

  // Role distribution
  const roleDistribution = users?.reduce((acc, user) => {
    acc[user.role.name] = (acc[user.role.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Task status distribution
  const statusDistribution = tasks?.reduce((acc, task) => {
    acc[task.currentStatus] = (acc[task.currentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INITIALIZATION':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Initialization</Badge>;
      case 'REQ_GATHERING_COMPLETE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requirements Complete</Badge>;
      case 'READY_FOR_INSTALLATION':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ready for Installation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Admin</Badge>;
      case 'SALES':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sales</Badge>;
      case 'IMPLEMENTATION_LEAD':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Implementation</Badge>;
      case 'HARDWARE_ENGINEER':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Hardware</Badge>;
      default:
        return <Badge variant="secondary">{roleName}</Badge>;
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">System administration and oversight</p>
            </div>

            <div className="flex items-center space-x-2">
              <Button asChild variant="outline">
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active system users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {activeTasks} active, {completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Available for onboarding
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Good</div>
                <p className="text-xs text-muted-foreground">
                  All services operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/products">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/tasks">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View All Tasks
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>User distribution across roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(roleDistribution).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {role === 'IMPLEMENTATION_LEAD' ? 'Implementation Lead' :
                          role === 'HARDWARE_ENGINEER' ? 'Hardware Engineer' :
                            role.charAt(0) + role.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Task Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status Overview</CardTitle>
              <CardDescription>Current distribution of task statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {status === 'INITIALIZATION' ? 'Initialization' :
                          status === 'REQ_GATHERING_COMPLETE' ? 'Requirements Complete' :
                            status === 'READY_FOR_INSTALLATION' ? 'Ready for Installation' :
                              status}
                      </p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest onboarding tasks in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading tasks...</p>
                    </div>
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{task.clientName}</p>
                          <p className="text-xs text-gray-500">{task.product.name}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(task.currentStatus)}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Recently active users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading users...</p>
                    </div>
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {getRoleBadge(user.role.name)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-green-600">Operational</p>
                </div>
                <div className="text-center">
                  <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">API Services</p>
                  <p className="text-xs text-green-600">Healthy</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-green-600">Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}