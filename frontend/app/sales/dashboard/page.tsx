"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowApi, productsApi } from "@/services/api";
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
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  Users,
  Workflow
} from "lucide-react";
import Link from "next/link";

export default function SalesDashboardPage() {
  // Fetch onboarding tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: workflowApi.getTasks,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  });

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

  const recentTasks = tasks?.slice(0, 5) || [];
  const initializationTasks = tasks?.filter(t => t.currentStatus === 'INITIALIZATION').length || 0;
  const completedTasks = tasks?.filter(t => t.currentStatus === 'READY_FOR_INSTALLATION').length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <ProtectedRoute requiredRole="SALES">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage client onboarding and track sales progress</p>
            </div>

            <Button asChild>
              <Link href="/tasks/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Onboarding Task
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Active onboarding processes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initializationTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting requirements gathering
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for installation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Available for onboarding
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common sales operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/tasks/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Onboarding Task
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/tasks">
                    <Workflow className="h-4 w-4 mr-2" />
                    View All Tasks
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/clients">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Clients
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Your sales performance this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tasks Created</span>
                  <span className="text-2xl font-bold">{totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-2xl font-bold">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Processing Time</span>
                  <span className="text-2xl font-bold">5.2d</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Onboarding Tasks</CardTitle>
              <CardDescription>
                Latest client onboarding processes you've initiated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading tasks...</p>
                  </div>
                </div>
              ) : recentTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.clientName}</TableCell>
                        <TableCell>{task.product.name}</TableCell>
                        <TableCell>{getStatusBadge(task.currentStatus)}</TableCell>
                        <TableCell>
                          {task.assignedUser ? task.assignedUser.fullName : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-600 mb-4">Create your first onboarding task to get started</p>
                  <Button asChild>
                    <Link href="/tasks/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}