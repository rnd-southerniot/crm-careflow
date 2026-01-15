"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowApi } from "@/services/api";
import { useAuthStore } from "@/lib/zustand-store/store";
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
  FileText,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Workflow,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function ImplementationDashboardPage() {
  const { user } = useAuthStore();

  // Fetch all tasks
  const { data: allTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: workflowApi.getTasks,
  });

  // Filter tasks assigned to current user or relevant for IMPLEMENTATION_LEAD (including completed ones for viewing)
  const assignedTasks = allTasks?.filter(task =>
    task.assignedUserId === user?.id ||
    task.currentStatus === 'INITIALIZATION' ||
    task.currentStatus === 'SCHEDULED_VISIT' ||
    task.currentStatus === 'REQUIREMENTS_COMPLETE'
  ) || [];

  const myTasks = allTasks?.filter(task => task.assignedUserId === user?.id) || [];
  const pendingReports = assignedTasks.filter(task =>
    task.currentStatus === 'INITIALIZATION' || task.currentStatus === 'SCHEDULED_VISIT'
  );
  const completedReports = myTasks.filter(task =>
    task.currentStatus === 'REQUIREMENTS_COMPLETE'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INITIALIZATION':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Needs Scheduling</Badge>;
      case 'SCHEDULED_VISIT':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Visit Scheduled</Badge>;
      case 'REQUIREMENTS_COMPLETE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Requirements Complete</Badge>;
      case 'HARDWARE_PROCUREMENT_COMPLETE':
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Hardware Procured</Badge>;
      case 'HARDWARE_PREPARED_COMPLETE':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Hardware Prepared</Badge>;
      case 'READY_FOR_INSTALLATION':
        return <Badge variant="secondary" className="bg-teal-100 text-teal-800">Ready for Install</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (task: any) => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated > 7) {
      return <Badge variant="destructive">High Priority</Badge>;
    } else if (daysSinceCreated > 3) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
  };

  return (
    <ProtectedRoute requiredRole={["IMPLEMENTATION_LEAD", "ADMIN"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Implementation Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage field operations and technical reports</p>
            </div>

            <Button asChild>
              <Link href="/tasks?assigned=me">
                <Workflow className="h-4 w-4 mr-2" />
                View My Tasks
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myTasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks assigned to you
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Surveys</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReports.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting site surveys
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Surveys</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedReports.length}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assignedTasks.filter(task => {
                    const daysSinceCreated = Math.floor(
                      (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysSinceCreated > 7;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overdue tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common implementation operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/tasks?assigned=me">
                    <Workflow className="h-4 w-4 mr-2" />
                    View My Tasks
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
                    <FileText className="h-4 w-4 mr-2" />
                    View Clients
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your planned activities for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Site Survey - ABC Corp</p>
                    <p className="text-xs text-gray-500">9:00 AM - 11:00 AM</p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Technical Report Review</p>
                    <p className="text-xs text-gray-500">2:00 PM - 3:00 PM</p>
                  </div>
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Client Meeting - XYZ Ltd</p>
                    <p className="text-xs text-gray-500">4:00 PM - 5:00 PM</p>
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Your Assigned Tasks</CardTitle>
              <CardDescription>
                Onboarding tasks requiring your attention
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
              ) : assignedTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.clientName}</TableCell>
                        <TableCell>{task.product.name}</TableCell>
                        <TableCell>{getStatusBadge(task.currentStatus)}</TableCell>
                        <TableCell>{getPriorityBadge(task)}</TableCell>
                        <TableCell>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {task.currentStatus === 'INITIALIZATION' && (
                              <Button asChild size="sm">
                                <Link href={`/reports/create?taskId=${task.id}`}>
                                  Submit Report
                                </Link>
                              </Button>
                            )}
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/tasks/${task.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                  <p className="text-gray-600 mb-4">You don't have any tasks assigned at the moment</p>
                  <Button asChild variant="outline">
                    <Link href="/tasks">
                      View All Tasks
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