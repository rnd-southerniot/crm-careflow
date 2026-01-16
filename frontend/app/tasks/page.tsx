"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { workflowApi, OnboardingTask } from "@/services/api";
import { useAuthStore } from "@/lib/zustand-store/store";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Workflow,
    Search,
    Filter,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Calendar,
    User,
    Package,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "INITIALIZATION", label: "Initialization" },
    { value: "SCHEDULED_VISIT", label: "Scheduled Visit" },
    { value: "REQUIREMENTS_COMPLETE", label: "Requirements Complete" },
    { value: "HARDWARE_PROCUREMENT_COMPLETE", label: "Hardware Procured" },
    { value: "HARDWARE_PREPARED_COMPLETE", label: "Hardware Prepared" },
    { value: "READY_FOR_INSTALLATION", label: "Ready for Installation" },
];

export default function TasksPage() {
    return (
        <Suspense fallback={<div />}>
            <TasksPageContent />
        </Suspense>
    );
}

function TasksPageContent() {
    const searchParams = useSearchParams();
    const { user } = useAuthStore();

    // URL-based filters
    const createdFilter = searchParams.get("created");
    const assignedFilter = searchParams.get("assigned");
    const statusFilter = searchParams.get("status");

    // Local filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");

    // Fetch all tasks
    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks'],
        queryFn: workflowApi.getTasks,
    });

    // Filter tasks based on URL params and local filters
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];

        let result = [...tasks];

        // Apply "created by me" filter
        if (createdFilter === "me" && user) {
            // Assuming we have a createdBy field or checking by current user
            // For now, we'll show all tasks as the backend doesn't have createdBy field
        }

        // Apply base role-based filtering (even if assigned=me is not present)
        // This ensures users only see what they are allowed to see
        if (user && user.role?.name === "IMPLEMENTATION_LEAD") {
            result = result.filter(task =>
                task.assignedUserId === user.id ||
                task.currentStatus === "INITIALIZATION" ||
                task.currentStatus === "SCHEDULED_VISIT" ||
                task.currentStatus === "REQUIREMENTS_COMPLETE"
            );
        } else if (user && user.role?.name === "HARDWARE_ENGINEER") {
            result = result.filter(task =>
                task.assignedUserId === user.id ||
                task.currentStatus === "REQUIREMENTS_COMPLETE" ||
                task.currentStatus === "HARDWARE_PROCUREMENT_COMPLETE" ||
                task.currentStatus === "HARDWARE_PREPARED_COMPLETE" ||
                task.currentStatus === "READY_FOR_INSTALLATION"
            );
        }

        // Apply "assigned to me" overlay (optional, since base filter already handles it, 
        // but kept for explicit filtering if needed in future)
        if (assignedFilter === "me" && user) {
            // No additional filtering needed here as base filter for these roles 
            // already encapsulates their actionable tasks.
            // For ADMIN/SALES, assigned=me would actually restrict them:
            if (user.role?.name === "ADMIN" || user.role?.name === "SALES") {
                result = result.filter(task => task.assignedUserId === user.id);
            }
        }

        // Apply status filter from URL or local state
        const effectiveStatusFilter = statusFilter || selectedStatus;
        if (effectiveStatusFilter && effectiveStatusFilter !== "all") {
            result = result.filter(task => task.currentStatus === effectiveStatusFilter);
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.clientName.toLowerCase().includes(query) ||
                task.clientEmail.toLowerCase().includes(query) ||
                task.product?.name?.toLowerCase().includes(query) ||
                task.id.toLowerCase().includes(query)
            );
        }

        // Sort by most recent first
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return result;
    }, [tasks, createdFilter, assignedFilter, statusFilter, selectedStatus, searchQuery, user]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!tasks) return { total: 0, initialization: 0, reqComplete: 0, readyForInstall: 0 };

        return {
            total: tasks.length,
            initialization: tasks.filter(t => t.currentStatus === "INITIALIZATION" || t.currentStatus === "SCHEDULED_VISIT").length, // Combining for simple stats
            reqComplete: tasks.filter(t => t.currentStatus === "REQUIREMENTS_COMPLETE").length,
            readyForInstall: tasks.filter(t => t.currentStatus === "READY_FOR_INSTALLATION").length,
        };
    }, [tasks]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "INITIALIZATION":
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Initialization
                    </Badge>
                );
            case "SCHEDULED_VISIT":
                return (
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled Visit
                    </Badge>
                );
            case "REQUIREMENTS_COMPLETE":
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Requirements Complete
                    </Badge>
                );
            case "HARDWARE_PROCUREMENT_COMPLETE":
                return (
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Hardware Procured
                    </Badge>
                );
            case "HARDWARE_PREPARED_COMPLETE":
                return (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Hardware Prepared
                    </Badge>
                );
            case "READY_FOR_INSTALLATION":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready for Installation
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {status}
                    </Badge>
                );
        }
    };

    const getPageTitle = () => {
        if (createdFilter === "me") return "My Created Tasks";
        if (assignedFilter === "me") return "My Assigned Tasks";
        if (statusFilter) {
            const statusLabel = STATUS_OPTIONS.find(s => s.value === statusFilter)?.label;
            return `Tasks - ${statusLabel || statusFilter}`;
        }
        return "All Onboarding Tasks";
    };

    const getPageDescription = () => {
        if (createdFilter === "me") return "Tasks you have created for client onboarding";
        if (assignedFilter === "me") return "Tasks assigned to you for completion";
        if (statusFilter) return `Tasks currently in the ${STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || statusFilter} stage`;
        return "Manage and monitor all client onboarding tasks";
    };

    if (error) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-gray-900">Error loading tasks</h2>
                            <p className="text-gray-600 mt-2">Please try again later</p>
                        </div>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-gray-600 mt-2">{getPageDescription()}</p>
                        </div>

                        {(user?.role.name === "SALES" || user?.role.name === "ADMIN") && (
                            <Link href="/tasks/create">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-gray-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
                                <Workflow className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                                <p className="text-xs text-gray-500 mt-1">All onboarding tasks</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Initialization</CardTitle>
                                <Clock className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-600">{stats.initialization}</div>
                                <p className="text-xs text-gray-500 mt-1">Awaiting requirements</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Requirements Complete</CardTitle>
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">{stats.reqComplete}</div>
                                <p className="text-xs text-gray-500 mt-1">Ready for field ops</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Ready for Installation</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{stats.readyForInstall}</div>
                                <p className="text-xs text-gray-500 mt-1">Awaiting hardware</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by client name, email, product, or task ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="w-[200px]">
                                            <Filter className="h-4 w-4 mr-2 text-gray-400" />
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Tasks Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Workflow className="h-5 w-5 text-blue-600" />
                                Tasks ({filteredTasks.length})
                            </CardTitle>
                            <CardDescription>
                                {filteredTasks.length === 0
                                    ? "No tasks match your current filters"
                                    : `Showing ${filteredTasks.length} of ${tasks?.length || 0} tasks`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-4">Loading tasks...</p>
                                    </div>
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Workflow className="h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                                    <p className="text-gray-500 mb-4 max-w-md">
                                        {searchQuery || selectedStatus !== "all"
                                            ? "Try adjusting your filters to see more results"
                                            : "Get started by creating your first onboarding task"
                                        }
                                    </p>
                                    {(user?.role.name === "SALES" || user?.role.name === "ADMIN") && (
                                        <Link href="/tasks/create">
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create First Task
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold">Client</TableHead>
                                                <TableHead className="font-semibold">Product</TableHead>
                                                <TableHead className="font-semibold">Status</TableHead>
                                                <TableHead className="font-semibold">Assigned To</TableHead>
                                                <TableHead className="font-semibold">Created</TableHead>
                                                <TableHead className="font-semibold text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTasks.map((task) => (
                                                <TableRow
                                                    key={task.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">
                                                                    {task.clientName}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {task.contactPerson}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Package className="h-4 w-4 text-gray-400" />
                                                            <span className="text-gray-700">
                                                                {task.product?.name || "Unknown Product"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(task.currentStatus)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {task.assignedUser ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                                                                    {task.assignedUser.fullName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-gray-700 text-sm">
                                                                    {task.assignedUser.fullName}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(task.createdAt), "MMM d, yyyy")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/tasks/${task.id}`}>
                                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
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
            </DashboardLayout>
        </ProtectedRoute>
    );
}
