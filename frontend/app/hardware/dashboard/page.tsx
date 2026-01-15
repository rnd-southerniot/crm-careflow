"use client";

import { useQuery } from "@tanstack/react-query";
import { workflowApi, hardwareApi } from "@/services/api";
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
  HardDrive,
  QrCode,
  CheckCircle,
  Clock,
  Zap,
  Workflow,
  AlertTriangle,
  Plus
} from "lucide-react";
import Link from "next/link";

export default function HardwareDashboardPage() {
  const { user } = useAuthStore();

  // Fetch tasks ready for hardware provisioning
  const { data: allTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: workflowApi.getTasks,
  });

  // Filter tasks that need hardware provisioning
  const readyForProvisioning = allTasks?.filter(task =>
    task.currentStatus === 'REQUIREMENTS_COMPLETE'
  ) || [];

  const provisionedTasks = allTasks?.filter(task =>
    task.currentStatus === 'READY_FOR_INSTALLATION' &&
    task.deviceProvisionings.length > 0
  ) || [];

  const totalDevices = allTasks?.reduce((acc, task) =>
    acc + task.deviceProvisionings.length, 0
  ) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUIREMENTS_COMPLETE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ready for Provisioning</Badge>;
      case 'HARDWARE_PROCUREMENT_COMPLETE':
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Provisioned</Badge>;
      case 'HARDWARE_PREPARED_COMPLETE':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Prepared</Badge>;
      case 'READY_FOR_INSTALLATION':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ready for Install</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (task: any) => {
    const daysSinceReportComplete = task.technicalReports.length > 0
      ? Math.floor(
        (new Date().getTime() - new Date(task.technicalReports[0].submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      : 0;

    if (daysSinceReportComplete > 5) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (daysSinceReportComplete > 2) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Soon</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
  };

  return (
    <ProtectedRoute requiredRole={["HARDWARE_ENGINEER", "ADMIN"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hardware Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage hardware preparation and installations</p>
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
                <CardTitle className="text-sm font-medium">Ready for Provisioning</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readyForProvisioning.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks awaiting hardware
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devices Provisioned</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  Total devices in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready for Install</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{provisionedTasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Fully provisioned tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {readyForProvisioning.filter(task => {
                    const daysSinceReportComplete = task.technicalReports.length > 0
                      ? Math.floor(
                        (new Date().getTime() - new Date(task.technicalReports[0].submittedAt).getTime()) / (1000 * 60 * 60 * 24)
                      )
                      : 0;
                    return daysSinceReportComplete > 5;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overdue provisioning
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common hardware operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/hardware/qr-codes">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Codes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/hardware/devices">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View All Devices
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/tasks?assigned=me">
                    <Workflow className="h-4 w-4 mr-2" />
                    My Assigned Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Status Overview</CardTitle>
                <CardDescription>Current status of provisioned devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Devices</span>
                  <span className="text-2xl font-bold">{totalDevices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Provisioned Today</span>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">QR Codes Generated</span>
                  <span className="text-2xl font-bold">{totalDevices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ready for Deployment</span>
                  <span className="text-2xl font-bold">{provisionedTasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Ready for Provisioning */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks Ready for Hardware Provisioning</CardTitle>
              <CardDescription>
                Tasks with completed technical reports awaiting device provisioning
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
              ) : readyForProvisioning.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Report Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readyForProvisioning.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.clientName}</TableCell>
                        <TableCell>{task.product.name}</TableCell>
                        <TableCell>{getStatusBadge(task.currentStatus)}</TableCell>
                        <TableCell>{getUrgencyBadge(task)}</TableCell>
                        <TableCell>
                          {task.technicalReports.length > 0
                            ? new Date(task.technicalReports[0].submittedAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button asChild size="sm">
                              <Link href={`/tasks/${task.id}`}>
                                <Workflow className="h-4 w-4 mr-1" />
                                View Task
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
                  <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks ready for provisioning</h3>
                  <p className="text-gray-600 mb-4">All tasks are either in progress or already provisioned</p>
                  <Button asChild variant="outline">
                    <Link href="/tasks">
                      View All Tasks
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Device Provisionings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Device Provisionings</CardTitle>
              <CardDescription>
                Latest devices you've provisioned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {provisionedTasks.length > 0 ? (
                <div className="space-y-4">
                  {provisionedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{task.clientName} - {task.product.name}</p>
                          <p className="text-sm text-gray-600">
                            {task.deviceProvisionings.length} device(s) provisioned
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {task.deviceProvisionings[0]?.deviceSerial}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.deviceProvisionings[0]?.provisionedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No devices provisioned yet</h3>
                  <p className="text-gray-600">Start provisioning devices to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}