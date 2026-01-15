"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { hardwareApi, tasksApi } from "@/services/api";
import {
    Loader2,
    QrCode,
    Download,
    Printer,
    Search,
    Package,
    ExternalLink,
    ChevronLeft,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

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
    };
}

export default function QRCodesPage() {
    return (
        <ProtectedRoute requiredRole={["HARDWARE_ENGINEER", "ADMIN"]}>
            <DashboardLayout>
                <QRCodesContent />
            </DashboardLayout>
        </ProtectedRoute>
    );
}

function QRCodesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [devices, setDevices] = useState<Device[]>([]);
    const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const serialParam = searchParams.get("serial");

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setIsLoading(true);
                const allTasks = await tasksApi.getAllTasks({});

                const allDevices: Device[] = [];
                for (const task of allTasks) {
                    try {
                        const taskDevices = await hardwareApi.getDevices(task.id);
                        allDevices.push(...taskDevices);
                    } catch (error) {
                        console.log(`No devices for task ${task.id}`);
                    }
                }

                allDevices.sort(
                    (a, b) =>
                        new Date(b.provisionedAt).getTime() - new Date(a.provisionedAt).getTime()
                );

                setDevices(allDevices);
                setFilteredDevices(allDevices);

                // Auto-select device if serial param is provided
                if (serialParam) {
                    const device = allDevices.find((d) => d.deviceSerial === serialParam);
                    if (device) {
                        setSelectedDevice(device);
                    }
                }
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

        fetchDevices();
    }, [toast, serialParam]);

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
                device.task.clientName.toLowerCase().includes(term)
        );
        setFilteredDevices(filtered);
    }, [searchTerm, devices]);

    const handleDownloadQR = (device: Device) => {
        const link = document.createElement("a");
        link.href = device.qrCode;
        link.download = `QR_${device.deviceSerial}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Downloaded",
            description: `QR code for ${device.deviceSerial} downloaded`,
        });
    };

    const handlePrintQR = () => {
        if (qrRef.current) {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                const content = qrRef.current.innerHTML;
                printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Code - ${selectedDevice?.deviceSerial}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                }
                .print-container {
                  text-align: center;
                  max-width: 600px;
                }
                img {
                  max-width: 400px;
                  height: auto;
                }
                h1 {
                  font-size: 24px;
                  margin: 20px 0;
                }
                .details {
                  margin-top: 20px;
                  text-align: left;
                  border-top: 2px solid #000;
                  padding-top: 20px;
                }
                .detail-row {
                  display: flex;
                  margin: 10px 0;
                }
                .detail-label {
                  font-weight: bold;
                  width: 150px;
                }
                @media print {
                  body {
                    display: block;
                  }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Device QR Codes</h1>
                    <p className="text-muted-foreground mt-2">
                        View, download, and print QR codes for provisioned devices
                    </p>
                </div>
                <Button onClick={() => router.push("/tasks?assigned=me")}>
                    <Package className="mr-2 h-4 w-4" />
                    View My Tasks
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Device List */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Devices</CardTitle>
                            <CardDescription>Select a device to view its QR code</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search devices..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredDevices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No devices found
                                    </p>
                                ) : (
                                    filteredDevices.map((device) => (
                                        <button
                                            key={device.id}
                                            onClick={() => setSelectedDevice(device)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedDevice?.id === device.id
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "hover:bg-muted border-border"
                                                }`}
                                        >
                                            <div className="font-medium text-sm mb-1">
                                                {device.deviceSerial}
                                            </div>
                                            <div
                                                className={`text-xs ${selectedDevice?.id === device.id
                                                    ? "text-primary-foreground/80"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                {device.deviceType}
                                            </div>
                                            <div
                                                className={`text-xs ${selectedDevice?.id === device.id
                                                    ? "text-primary-foreground/70"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                {device.task.clientName}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* QR Code Display */}
                <div className="lg:col-span-2">
                    {selectedDevice ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <QrCode className="h-5 w-5" />
                                            {selectedDevice.deviceSerial}
                                        </CardTitle>
                                        <CardDescription>{selectedDevice.deviceType}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadQR(selectedDevice)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handlePrintQR}>
                                            <Printer className="h-4 w-4 mr-2" />
                                            Print
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div ref={qrRef} className="print-container">
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        {/* QR Code Image */}
                                        <div className="bg-white p-8 rounded-lg shadow-lg">
                                            <img
                                                src={selectedDevice.qrCode}
                                                alt={`QR Code for ${selectedDevice.deviceSerial}`}
                                                className="w-64 h-64"
                                            />
                                        </div>

                                        {/* Device Details */}
                                        <div className="details w-full max-w-md space-y-3">
                                            <h2 className="text-xl font-bold text-center mb-4">
                                                Device Information
                                            </h2>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Serial Number:</div>
                                                <div className="font-mono">{selectedDevice.deviceSerial}</div>
                                            </div>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Device Type:</div>
                                                <div>{selectedDevice.deviceType}</div>
                                            </div>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Firmware:</div>
                                                <div>{selectedDevice.firmwareVersion}</div>
                                            </div>
                                            {selectedDevice.hardware && (
                                                <div className="detail-row space-y-2">
                                                    <div className="detail-label font-semibold">Hardware:</div>
                                                    <div>
                                                        {selectedDevice.hardware.name} ({selectedDevice.hardware.code})
                                                    </div>
                                                </div>
                                            )}
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Client:</div>
                                                <div>{selectedDevice.task.clientName}</div>
                                            </div>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Product:</div>
                                                <div>{selectedDevice.task.product.name}</div>
                                            </div>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Provisioned By:</div>
                                                <div>{selectedDevice.provisioner.fullName}</div>
                                            </div>
                                            <div className="detail-row space-y-2">
                                                <div className="detail-label font-semibold">Provisioned On:</div>
                                                <div>{formatDate(selectedDevice.provisionedAt)}</div>
                                            </div>
                                            {selectedDevice.notes && (
                                                <div className="detail-row space-y-2">
                                                    <div className="detail-label font-semibold">Notes:</div>
                                                    <div className="text-sm">{selectedDevice.notes}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Task Link */}
                                        <Button variant="outline" asChild className="no-print">
                                            <Link href={`/tasks/${selectedDevice.task.id}`}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View Task
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
                                <p className="text-muted-foreground text-center">
                                    Select a device from the list to view its QR code
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
