"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { clientsApi } from "@/services/api";
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
    Building2,
    ArrowLeft,
    AlertCircle,
    Package,
    ArrowRight,
    MapPin,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "INITIALIZATION":
            return <Badge className="bg-amber-100 text-amber-800">Initialization</Badge>;
        case "SCHEDULED_VISIT":
            return <Badge className="bg-blue-100 text-blue-800">Scheduled Visit</Badge>;
        case "REQUIREMENTS_COMPLETE":
            return <Badge className="bg-indigo-100 text-indigo-800">Requirements Complete</Badge>;
        case "HARDWARE_PROCUREMENT_COMPLETE":
            return <Badge className="bg-purple-100 text-purple-800">Hardware Procured</Badge>;
        case "HARDWARE_PREPARED_COMPLETE":
            return <Badge className="bg-purple-100 text-purple-800">Hardware Prepared</Badge>;
        case "READY_FOR_INSTALLATION":
            return <Badge className="bg-green-100 text-green-800">Ready for Installation</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const { data: client, isLoading, error } = useQuery({
        queryKey: ['client', clientId],
        queryFn: () => clientsApi.getById(clientId),
        enabled: !!clientId,
    });

    if (isLoading) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error || !client) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-64">
                        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
                        <Button variant="outline" onClick={() => router.push('/clients')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Clients
                        </Button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/clients">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <div className="flex items-center gap-2 mt-1 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{client.address}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Info Card */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Client Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                                    <div className="mt-1">
                                        {client.isActive ? (
                                            <Badge className="bg-green-100 text-green-800 font-medium">Active Account</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive Account</Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</label>
                                    <p className="mt-1 text-gray-700 whitespace-pre-wrap text-sm">
                                        {client.notes || "No notes available for this client."}
                                    </p>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="text-gray-500">Registered on</span>
                                        <span className="font-medium">{format(new Date(client.createdAt), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="text-gray-500">Total Tasks</span>
                                        <span className="font-medium">{client._count?.onboardingTasks || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tasks Table */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    Assigned Onboarding Tasks
                                </CardTitle>
                                <CardDescription>Complete history of tasks associated with this organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!client.onboardingTasks || client.onboardingTasks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No onboarding tasks found for this client.</p>
                                        <Link href="/tasks/create">
                                            <Button variant="link" className="text-blue-600">Create the first task</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Assigned To</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {client.onboardingTasks.map((task: any) => (
                                                    <TableRow key={task.id}>
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                {task.product?.name}
                                                                <p className="text-xs text-gray-500 font-normal">{task.product?.code}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(task.currentStatus)}</TableCell>
                                                        <TableCell>
                                                            {task.assignedUser ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                                                        {task.assignedUser.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                                    </div>
                                                                    <span className="text-sm">{task.assignedUser.fullName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-600">
                                                            {format(new Date(task.createdAt), 'MMM d, yyyy')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/tasks/${task.id}`}>
                                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                                                    View Details
                                                                    <ArrowRight className="h-4 w-4 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
