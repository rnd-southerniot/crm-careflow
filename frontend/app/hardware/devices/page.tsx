"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { hardwareApi, tasksApi } from "@/services/api";
import {
    Loader2,
    Package,
    QrCode,
    Search,
    ExternalLink,
    Calendar,
    User,
    FileText,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/zustand-store/store";

interface Device {
    id: string;
    deviceSerial: string;
    deviceType: string;
    firmwareVersion: string;
    qrCode: string;
    provisionedAt: string;
    notes?: string;
    task: {
        id: string;
        clientName: string;
        product: {
            name: string;
        };
    };
    provisioner: {
        fullName: string;
    };
    hardware?: {
        name: string;
        code: string;
        category: {
            name: string;
        };
    };
}

export default function MyDevicesPage() {
    return (
        <ProtectedRoute requiredRole={["HARDWARE_ENGINEER", "ADMIN"]}>
            <DashboardLayout>
                <MyDevicesContent />
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function MyDevicesContent() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [devices, setDevices] = useState<Device[]>([]);
    const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setIsLoading(true);

                // Get all tasks that the hardware engineer has provisioned devices for
                const allTasks = await tasksApi.getAllTasks({});

                // Fetch devices for each task
                const allDevices: Device[] = [];
                for (const task of allTasks) {
                    try {
                        const taskDevices = await hardwareApi.getDevices(task.id);
                        // Filter to only show devices provisioned by current user
                        const myDevices = taskDevices.filter(
                            (device: Device) => device.provisioner && user && device.provisioner.fullName === user.fullName
                        );
                        allDevices.push(...myDevices);
                    } catch (error) {
                        // Task might not have devices yet, that's okay
                        console.log(`No devices for task ${task.id}`);
                    }
                }

                // Sort by provision date descending
                allDevices.sort(
                    (a, b) =>
                        new Date(b.provisionedAt).getTime() - new Date(a.provisionedAt).getTime()
                );

                setDevices(allDevices);
                setFilteredDevices(allDevices);
            } catch (error: any) {
                console.error("Error fetching devices:", error);
                toast({
                    title: "Error",
                    description: "Failed to load devices",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchDevices();
        }
    }, [toast, user]);

    // Filter devices based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredDevices(devices);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = devices.filter(
            (device) =>
                device.deviceSerial.toLowerCase().includes(term) ||
                device.deviceType.toLowerCase().includes(term) ||
                device.task.clientName.toLowerCase().includes(term) ||
                device.task.product.name.toLowerCase().includes(term) ||
                device.firmwareVersion.toLowerCase().includes(term)
        );
        setFilteredDevices(filtered);
    }, [searchTerm, devices]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Provisioned Devices</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all devices you've provisioned
                    </p>
                </div>
                <Button onClick={() => router.push("/tasks?assigned=me")}>
                    <Package className="mr-2 h-4 w-4" />
                    View My Tasks
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices.length}</div>
                        <p className="text-xs text-muted-foreground">Provisioned by you</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {
                                devices.filter((d) => {
                                    const provisionDate = new Date(d.provisionedAt);
                                    const now = new Date();
                                    return (
                                        provisionDate.getMonth() === now.getMonth() &&
                                        provisionDate.getFullYear() === now.getFullYear()
                                    );
                                }).length
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">Devices this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Device Types</CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(devices.map((d) => d.deviceType)).size}
                        </div>
                        <p className="text-xs text-muted-foreground">Unique types</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by serial, type, client, or product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Devices List */}
            {filteredDevices.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {searchTerm ? "No devices found" : "No devices provisioned yet"}
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Start by provisioning your first device"}
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => router.push("/tasks?assigned=me")}>
                                <Package className="mr-2 h-4 w-4" />
                                View Assigned Tasks
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredDevices.map((device) => (
                        <Card key={device.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CardTitle className="text-lg">{device.deviceSerial}</CardTitle>
                                            <Badge variant="outline">{device.deviceType}</Badge>
                                            {device.hardware?.category && (
                                                <Badge variant="secondary">
                                                    {device.hardware.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3" />
                                                <span>Client: {device.task.clientName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-3 w-3" />
                                                <span>Product: {device.task.product.name}</span>
                                            </div>
                                            {device.hardware && (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-3 w-3" />
                                                    <span>
                                                        Hardware: {device.hardware.name} ({device.hardware.code})
                                                    </span>
                                                </div>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.push(`/hardware/qr-codes?serial=${device.deviceSerial}`)
                                            }
                                        >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            View QR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/tasks/${device.task.id}`}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Task
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Firmware</p>
                                        <p className="font-medium">{device.firmwareVersion}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Provisioned</p>
                                        <p className="font-medium">{formatDate(device.provisionedAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Provisioned By</p>
                                        <p className="font-medium">{device.provisioner.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Device ID</p>
                                        <p className="font-medium font-mono text-xs">{device.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                {device.notes && (
                                    <div className="mt-4 p-3 bg-muted rounded-md">
                                        <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                                        <p className="text-sm">{device.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
