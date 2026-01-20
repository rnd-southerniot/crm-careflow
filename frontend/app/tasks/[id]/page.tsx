"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { workflowApi, OnboardingTask, usersApi, reportsApi, hardwareCatalogApi, hardwareCategoryApi, hardwareApi, Hardware, HardwareCategory } from "@/services/api";
import { DynamicFormRenderer, ReportSchema } from "@/components/forms";
import { useAuthStore } from "@/lib/zustand-store/store";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Workflow,
    ArrowLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Package,
    Calendar,
    FileText,
    HardDrive,
    ClipboardList,
    ArrowRight,
    Edit,
    Loader2,
    X,
    QrCode,
    Download,
    Radio,
    Wifi,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

// Hardware Procurement Item Form (Category + Hardware + Quantity - no serial/firmware)
interface HardwareProcurementItemFormProps {
    item: {
        categoryId: string;
        hardwareId: string;
        quantity: number;
        notes: string;
    };
    index: number;
    categories: HardwareCategory[];
    onChange: (index: number, field: string, value: string | number) => void;
    onRemove: () => void;
}

function HardwareProcurementItemForm({ item, index, categories, onChange, onRemove }: HardwareProcurementItemFormProps) {
    const [hardwareOptions, setHardwareOptions] = useState<Hardware[]>([]);
    const [loadingHardware, setLoadingHardware] = useState(false);

    // Fetch hardware when category changes
    useEffect(() => {
        const fetchHardware = async () => {
            if (item.categoryId) {
                setLoadingHardware(true);
                try {
                    const hardware = await hardwareCatalogApi.getByCategoryId(item.categoryId);
                    setHardwareOptions(hardware);
                } catch (error) {
                    console.error('Failed to fetch hardware:', error);
                    setHardwareOptions([]);
                } finally {
                    setLoadingHardware(false);
                }
            } else {
                setHardwareOptions([]);
            }
        };
        fetchHardware();
    }, [item.categoryId]);

    return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Hardware Item #{index + 1}</span>
                <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Category *</label>
                    <Select
                        value={item.categoryId}
                        onValueChange={(value) => {
                            onChange(index, 'categoryId', value);
                            onChange(index, 'hardwareId', '');
                        }}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories && categories.length > 0 ? (
                                categories.map((cat) => {
                                    if (!cat || !cat.id) return null;
                                    return (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    );
                                })
                            ) : (
                                <div className="px-2 py-1 text-sm text-gray-500">Loading categories...</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Hardware *</label>
                    <Select
                        value={item.hardwareId}
                        onValueChange={(value) => onChange(index, 'hardwareId', value)}
                        disabled={!item.categoryId || loadingHardware}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder={loadingHardware ? "Loading..." : "Select hardware"} />
                        </SelectTrigger>
                        <SelectContent>
                            {hardwareOptions.map((hw) => (
                                <SelectItem key={hw.id} value={hw.id}>
                                    {hw.name} ({hw.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Quantity *</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={item.quantity}
                        onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
                <Textarea
                    placeholder="Add any notes about this procurement..."
                    className="min-h-[40px] text-sm resize-none"
                    value={item.notes}
                    onChange={(e) => onChange(index, 'notes', e.target.value)}
                />
            </div>
        </div>
    );
}

// Hardware Prepared Device Form - For entering serial/firmware for each individual unit
interface PreparedDeviceEntry {
    hardwareId: string;
    hardwareName: string;
    deviceSerial: string;
    firmwareVersion: string;
    notes: string;
    // LoRaWAN fields (optional)
    devEui: string;
    appKey: string;
}

interface HardwarePreparedDeviceFormProps {
    devices: PreparedDeviceEntry[];
    onChange: (index: number, field: string, value: string) => void;
    isLorawanProduct?: boolean;
}

function HardwarePreparedDeviceForm({ devices, onChange, isLorawanProduct }: HardwarePreparedDeviceFormProps) {
    // Group devices by hardware type for display
    const groupedByHardware: { [key: string]: { name: string; indices: number[] } } = {};
    devices.forEach((device, index) => {
        if (!groupedByHardware[device.hardwareId]) {
            groupedByHardware[device.hardwareId] = { name: device.hardwareName, indices: [] };
        }
        groupedByHardware[device.hardwareId].indices.push(index);
    });

    return (
        <div className="space-y-4">
            {Object.entries(groupedByHardware).map(([hardwareId, group]) => (
                <div key={hardwareId} className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 border-b">
                        <h4 className="font-medium text-blue-900">{group.name}</h4>
                        <p className="text-xs text-blue-700">{group.indices.length} unit(s) to prepare</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {group.indices.map((deviceIndex, unitNumber) => (
                            <div key={deviceIndex} className={`grid ${isLorawanProduct ? 'grid-cols-2' : 'grid-cols-2'} gap-3 p-3 bg-gray-50 rounded border`}>
                                <div className="col-span-2 text-xs font-medium text-gray-500 mb-1">
                                    Unit #{unitNumber + 1}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Serial Number *</label>
                                    <input
                                        placeholder="e.g., SN-2024-001"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={devices[deviceIndex].deviceSerial}
                                        onChange={(e) => onChange(deviceIndex, 'deviceSerial', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Firmware Version *</label>
                                    <input
                                        placeholder="e.g., v1.0.0"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={devices[deviceIndex].firmwareVersion}
                                        onChange={(e) => onChange(deviceIndex, 'firmwareVersion', e.target.value)}
                                    />
                                </div>
                                {isLorawanProduct && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-600">
                                                DevEUI <span className="text-gray-400">(16 hex, auto-gen if empty)</span>
                                            </label>
                                            <input
                                                placeholder="e.g., 0004A30B001F9ABC"
                                                maxLength={16}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                                                value={devices[deviceIndex].devEui}
                                                onChange={(e) => onChange(deviceIndex, 'devEui', e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-600">
                                                AppKey <span className="text-gray-400">(32 hex, auto-gen if empty)</span>
                                            </label>
                                            <input
                                                placeholder="e.g., 2B7E151628AED2A6..."
                                                maxLength={32}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                                                value={devices[deviceIndex].appKey}
                                                onChange={(e) => onChange(deviceIndex, 'appKey', e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}


const STATUS_FLOW = [
    { value: "INITIALIZATION", label: "Initialization", color: "amber" },
    { value: "SCHEDULED_VISIT", label: "Scheduled Visit", color: "blue" },
    { value: "REQUIREMENTS_COMPLETE", label: "Requirements Complete", color: "blue" },
    { value: "HARDWARE_PROCUREMENT_COMPLETE", label: "Hardware Procured", color: "purple" },
    { value: "HARDWARE_PREPARED_COMPLETE", label: "Hardware Prepared", color: "purple" },
    { value: "READY_FOR_INSTALLATION", label: "Ready for Installation", color: "green" },
];

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const taskId = params.id as string;

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>("");

    // Fetch task details
    const { data: task, isLoading, error } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => workflowApi.getTask(taskId),
        enabled: !!taskId,
    });

    // Fetch hardware categories
    const { data: hardwareCategories = [] } = useQuery({
        queryKey: ['hardware-categories'],
        queryFn: () => hardwareCategoryApi.getAll(),
        enabled: statusDialogOpen,
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: (variables: { status: OnboardingTask['currentStatus']; data?: any }) =>
            workflowApi.updateTaskStatus(taskId, variables.status, variables.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setStatusDialogOpen(false);
            setScheduledDate("");
            setProcurementList([{ categoryId: "", hardwareId: "", quantity: 1, notes: "" }]);
            setPreparedDevices([]);
            // Reset QR code preview state
            setPreviewQrCodes([]);
            setDownloadedQrCodes(new Set());
            toast.success('Task status updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });

    // Update report mutation (ADMIN only)
    const updateReportMutation = useMutation({
        mutationFn: (variables: { reportId: string; submissionData: Record<string, any> }) =>
            reportsApi.updateReport(variables.reportId, variables.submissionData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setEditReport(null);
            toast.success('Report updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update report');
        },
    });

    const [scheduledDate, setScheduledDate] = useState("");
    // Procurement state (Category + Hardware + Quantity)
    const [procurementList, setProcurementList] = useState([
        { categoryId: "", hardwareId: "", quantity: 1, notes: "" }
    ]);
    // Prepared devices state (Serial + Firmware for each unit)
    const [preparedDevices, setPreparedDevices] = useState<PreparedDeviceEntry[]>([]);
    const [reportSchema, setReportSchema] = useState<ReportSchema | null>(null);
    const [reportData, setReportData] = useState<Record<string, any>>({});
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);
    const [viewReport, setViewReport] = useState<any>(null);
    const [revertDialogOpen, setRevertDialogOpen] = useState(false);
    const [editReport, setEditReport] = useState<any>(null);
    const [editReportData, setEditReportData] = useState<Record<string, any>>({});
    const [viewQrDevice, setViewQrDevice] = useState<any>(null);
    // QR Code generation state for READY_FOR_INSTALLATION transition
    const [previewQrCodes, setPreviewQrCodes] = useState<Array<{
        id: string;
        deviceSerial: string;
        deviceType: string;
        firmwareVersion: string;
        qrCode: string;
    }>>([]);
    const [downloadedQrCodes, setDownloadedQrCodes] = useState<Set<string>>(new Set());
    const [generatingQrCodes, setGeneratingQrCodes] = useState(false);

    // Fetch report schema when dialog opens for REQUIREMENTS_COMPLETE transition
    useEffect(() => {
        const fetchSchema = async () => {
            if (statusDialogOpen && task && getNextStatus(task.currentStatus) === 'REQUIREMENTS_COMPLETE') {
                setIsLoadingSchema(true);
                try {
                    const schema = await reportsApi.getReportSchema(task.productId);
                    setReportSchema(schema);
                } catch (err) {
                    console.error('Failed to fetch report schema:', err);
                    setReportSchema(null);
                } finally {
                    setIsLoadingSchema(false);
                }
            }
        };
        fetchSchema();
    }, [statusDialogOpen, task]);

    const handleViewReport = async (report: any) => {
        setViewReport(report);
        if (!reportSchema && task?.productId) {
            try {
                const schema = await reportsApi.getReportSchema(task.productId);
                setReportSchema(schema);
            } catch (e) {
                console.error('Failed to load schema', e);
            }
        }
    };

    const handleEditReport = async (report: any) => {
        setEditReport(report);
        setEditReportData(report.submissionData || {});
        if (!reportSchema && task?.productId) {
            try {
                const schema = await reportsApi.getReportSchema(task.productId);
                setReportSchema(schema);
            } catch (e) {
                console.error('Failed to load schema', e);
            }
        }
    };

    const getPreviousStatus = (currentStatus: string): string | null => {
        const currentIndex = STATUS_FLOW.findIndex(s => s.value === currentStatus);
        if (currentIndex > 0) {
            return STATUS_FLOW[currentIndex - 1].value;
        }
        return null;
    };

    const isAdmin = user?.role?.name === 'ADMIN';

    // Procurement list handlers
    const handleProcurementChange = (index: number, field: string, value: string | number) => {
        setProcurementList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], [field]: value };
            return newList;
        });
    };

    const addProcurementItem = () => {
        setProcurementList([...procurementList, { categoryId: "", hardwareId: "", quantity: 1, notes: "" }]);
    };

    const removeProcurementItem = (index: number) => {
        const newList = [...procurementList];
        newList.splice(index, 1);
        setProcurementList(newList);
    };

    // Prepared devices handlers
    const handlePreparedDeviceChange = (index: number, field: string, value: string) => {
        setPreparedDevices(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], [field]: value };
            return newList;
        });
    };

    // Initialize prepared devices from task procurements when transitioning to HARDWARE_PREPARED
    const initializePreparedDevices = () => {
        if (!task?.hardwareProcurements) return;

        const devices: PreparedDeviceEntry[] = [];
        for (const procurement of task.hardwareProcurements) {
            for (let i = 0; i < procurement.quantity; i++) {
                devices.push({
                    hardwareId: procurement.hardwareId,
                    hardwareName: procurement.hardware?.name || 'Unknown Hardware',
                    deviceSerial: "",
                    firmwareVersion: "",
                    notes: "",
                    devEui: "",
                    appKey: "",
                });
            }
        }
        setPreparedDevices(devices);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "INITIALIZATION":
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm px-3 py-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Initialization
                    </Badge>
                );
            case "REQ_GATHERING_COMPLETE":
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm px-3 py-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Requirements Complete
                    </Badge>
                );
            case "READY_FOR_INSTALLATION":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-sm px-3 py-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Ready for Installation
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-3 py-1">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {status}
                    </Badge>
                );
        }
    };

    const getNextStatus = (currentStatus: string): string | null => {
        const currentIndex = STATUS_FLOW.findIndex(s => s.value === currentStatus);
        if (currentIndex < STATUS_FLOW.length - 1) {
            return STATUS_FLOW[currentIndex + 1].value;
        }
        return null;
    };

    const canUpdateStatus = () => {
        if (!user || !task) return false;
        if (user.role.name === 'ADMIN') return true;

        const status = task.currentStatus;
        const role = user.role.name;

        if (status === 'INITIALIZATION' && role === 'IMPLEMENTATION_LEAD') return true;
        if (status === 'SCHEDULED_VISIT' && role === 'IMPLEMENTATION_LEAD') return true;

        // REQ COMPLETE -> HARDWARE PROCUREMENT
        if (status === 'REQUIREMENTS_COMPLETE' && role === 'HARDWARE_ENGINEER') return true;
        // HARDWARE PROCURE -> HARDWARE PREPARED
        if (status === 'HARDWARE_PROCUREMENT_COMPLETE' && role === 'HARDWARE_ENGINEER') return true;
        // HARDWARE PREPARED -> READY
        if (status === 'HARDWARE_PREPARED_COMPLETE' && role === 'HARDWARE_ENGINEER') return true;

        return false;
    };

    if (error) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-64">
                        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Task Not Found</h2>
                        <p className="text-gray-600 mb-4">The requested task could not be found or you don't have access to it.</p>
                        <Link href="/tasks">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Tasks
                            </Button>
                        </Link>
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
                        <div className="flex items-center gap-4">
                            <Link href="/tasks">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
                                <p className="text-gray-600 mt-1">
                                    {isLoading ? "Loading..." : `Client: ${task?.clientName}`}
                                </p>
                            </div>
                        </div>

                        {!isLoading && task && canUpdateStatus() && getNextStatus(task.currentStatus) && (
                            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                        Advance Status
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Task Status</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to advance this task to the next status?
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div className="flex items-center justify-center gap-4 mb-6">
                                            {getStatusBadge(task.currentStatus)}
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                            {getStatusBadge(getNextStatus(task.currentStatus) || '')}
                                        </div>

                                        {getNextStatus(task.currentStatus) === 'SCHEDULED_VISIT' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Scheduled Visit Date</label>
                                                <input
                                                    type="datetime-local"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {getNextStatus(task.currentStatus) === 'HARDWARE_PROCUREMENT_COMPLETE' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium">Hardware Procurement List</label>
                                                <p className="text-xs text-gray-500">Select the hardware items and quantities to procure. Serial numbers and firmware versions will be entered in the next step.</p>
                                                {procurementList.map((item, index) => (
                                                    <HardwareProcurementItemForm
                                                        key={index}
                                                        item={item}
                                                        index={index}
                                                        categories={hardwareCategories}
                                                        onChange={handleProcurementChange}
                                                        onRemove={() => removeProcurementItem(index)}
                                                    />
                                                ))}
                                                <Button type="button" variant="outline" size="sm" onClick={addProcurementItem}>
                                                    + Add Hardware Item
                                                </Button>
                                            </div>
                                        )}

                                        {getNextStatus(task.currentStatus) === 'HARDWARE_PREPARED_COMPLETE' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium">Prepare Hardware</label>
                                                <p className="text-xs text-gray-500">Enter the serial number and firmware version for each procured device.</p>
                                                {preparedDevices.length === 0 ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                                        <p className="text-sm text-blue-800">
                                                            {task.hardwareProcurements && task.hardwareProcurements.length > 0
                                                                ? `${task.hardwareProcurements.reduce((sum, p) => sum + p.quantity, 0)} device(s) to prepare. Click "Load Devices" to begin.`
                                                                : "No hardware procurement records found."}
                                                        </p>
                                                        {task.hardwareProcurements && task.hardwareProcurements.length > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2"
                                                                onClick={initializePreparedDevices}
                                                            >
                                                                Load Devices
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="max-h-96 overflow-y-auto">
                                                        <HardwarePreparedDeviceForm
                                                            devices={preparedDevices}
                                                            onChange={handlePreparedDeviceChange}
                                                            isLorawanProduct={task.product?.isLorawanProduct}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {getNextStatus(task.currentStatus) === 'REQUIREMENTS_COMPLETE' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium">Technical Report</label>
                                                {isLoadingSchema ? (
                                                    <div className="flex items-center justify-center p-4">
                                                        <Loader2 className="h-6 w-6 animate-spin" />
                                                        <span className="ml-2">Loading form...</span>
                                                    </div>
                                                ) : reportSchema ? (
                                                    <div className="max-h-96 overflow-y-auto border rounded p-4">
                                                        <DynamicFormRenderer
                                                            schema={reportSchema}
                                                            onSubmit={(data) => {
                                                                setReportData(data);
                                                                // Trigger the status update with report data
                                                                updateStatusMutation.mutate({
                                                                    status: 'REQUIREMENTS_COMPLETE' as OnboardingTask['currentStatus'],
                                                                    data: { reportData: data }
                                                                });
                                                            }}
                                                            initialData={reportData}
                                                            isLoading={updateStatusMutation.isPending}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                                                        <p className="text-sm text-yellow-800">No report schema configured for this product.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {getNextStatus(task.currentStatus) === 'READY_FOR_INSTALLATION' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium">Generate QR Codes for Devices</label>
                                                <p className="text-xs text-gray-500">
                                                    You must generate and download QR codes for all devices before completing this transition.
                                                </p>

                                                {previewQrCodes.length === 0 ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                                        <p className="text-sm text-blue-800 mb-3">
                                                            {task.deviceProvisionings?.length || 0} device(s) ready for QR code generation.
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            onClick={async () => {
                                                                setGeneratingQrCodes(true);
                                                                try {
                                                                    const result = await hardwareApi.generatePreviewQrCodes(taskId);
                                                                    setPreviewQrCodes(result.devices || []);
                                                                    toast.success(`Generated ${result.devices?.length || 0} QR codes`);
                                                                } catch (error: any) {
                                                                    toast.error(error.response?.data?.message || 'Failed to generate QR codes');
                                                                } finally {
                                                                    setGeneratingQrCodes(false);
                                                                }
                                                            }}
                                                            disabled={generatingQrCodes || !task.deviceProvisionings?.length}
                                                        >
                                                            {generatingQrCodes ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <QrCode className="h-4 w-4 mr-2" />
                                                                    Generate QR Codes
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-gray-600">
                                                                Downloaded: {downloadedQrCodes.size} / {previewQrCodes.length}
                                                            </span>
                                                            {downloadedQrCodes.size === previewQrCodes.length && (
                                                                <Badge className="bg-green-100 text-green-800">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    All Downloaded
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {previewQrCodes.map((device) => (
                                                            <div key={device.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                                                                <img
                                                                    src={device.qrCode}
                                                                    alt={`QR Code for ${device.deviceSerial}`}
                                                                    className="h-16 w-16 rounded border"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-mono text-sm font-medium">{device.deviceSerial}</p>
                                                                    <p className="text-xs text-gray-500">{device.deviceType} | FW: {device.firmwareVersion}</p>
                                                                </div>
                                                                <Button
                                                                    variant={downloadedQrCodes.has(device.id) ? "outline" : "default"}
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = device.qrCode;
                                                                        link.download = `qr-${device.deviceSerial}.png`;
                                                                        link.click();
                                                                        setDownloadedQrCodes(prev => new Set([...prev, device.id]));
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    {downloadedQrCodes.has(device.id) ? 'Downloaded' : 'Download'}
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStatusDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        {/* Hide confirm button for REQUIREMENTS_COMPLETE since the form has its own submit */}
                                        {getNextStatus(task.currentStatus) !== 'REQUIREMENTS_COMPLETE' && (
                                            <Button
                                                onClick={() => {
                                                    const next = getNextStatus(task.currentStatus);
                                                    if (next) {
                                                        const updatePayload: any = {};
                                                        if (next === 'SCHEDULED_VISIT') {
                                                            updatePayload.scheduledDate = new Date(scheduledDate).toISOString();
                                                        }
                                                        if (next === 'HARDWARE_PROCUREMENT_COMPLETE') {
                                                            // Send hardwareId and quantity (backend expects this)
                                                            updatePayload.hardwareList = procurementList.map(item => ({
                                                                hardwareId: item.hardwareId,
                                                                quantity: item.quantity,
                                                                notes: item.notes || null
                                                            }));
                                                        }
                                                        if (next === 'HARDWARE_PREPARED_COMPLETE') {
                                                            // Send device list with serial numbers, firmware versions, and LoRaWAN credentials
                                                            updatePayload.deviceList = preparedDevices.map(device => ({
                                                                hardwareId: device.hardwareId,
                                                                deviceSerial: device.deviceSerial,
                                                                firmwareVersion: device.firmwareVersion,
                                                                notes: device.notes || null,
                                                                devEui: device.devEui || null,
                                                                appKey: device.appKey || null,
                                                            }));
                                                        }
                                                        updateStatusMutation.mutate({ status: next as OnboardingTask['currentStatus'], data: updatePayload });
                                                    }
                                                }}
                                                disabled={
                                                    updateStatusMutation.isPending ||
                                                    // For READY_FOR_INSTALLATION, all QR codes must be downloaded
                                                    (getNextStatus(task.currentStatus) === 'READY_FOR_INSTALLATION' &&
                                                        (previewQrCodes.length === 0 || downloadedQrCodes.size !== previewQrCodes.length))
                                                }
                                            >
                                                {updateStatusMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Confirm'
                                                )}
                                            </Button>
                                        )}
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* ADMIN: Revert Status Button */}
                        {!isLoading && task && isAdmin && getPreviousStatus(task.currentStatus) && (
                            <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Revert Status
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[50vw] max-w-[50vw] sm:max-w-[50vw]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Revert Task Status</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to revert this task to the previous status? This action is for administrators only.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                        <div className="flex items-center justify-center gap-4">
                                            {getStatusBadge(task.currentStatus)}
                                            <ArrowLeft className="h-5 w-5 text-orange-400" />
                                            {getStatusBadge(getPreviousStatus(task.currentStatus) || '')}
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-orange-600 hover:bg-orange-700"
                                            onClick={() => {
                                                const prev = getPreviousStatus(task.currentStatus);
                                                if (prev) {
                                                    updateStatusMutation.mutate({ status: prev as OnboardingTask['currentStatus'] });
                                                }
                                            }}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            {updateStatusMutation.isPending ? 'Reverting...' : 'Revert'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}


                        {/* Report Details Dialog */}
                        <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
                            <DialogContent className="min-w-[50vw] max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Technical Report Details</DialogTitle>
                                    <DialogDescription>
                                        Report #{viewReport?.id.slice(-8)} • Submitted on {viewReport && format(new Date(viewReport.submittedAt), "PPP p")}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto py-4">
                                    {viewReport && Object.entries(viewReport.submissionData).map(([key, value]) => {
                                        const field = reportSchema?.formStructure?.find(f => f.name === key);
                                        const label = field?.label || key;

                                        let displayValue = String(value);
                                        if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';

                                        return (
                                            <div key={key} className="grid grid-cols-3 gap-4 border-b pb-3 last:border-0 last:pb-0">
                                                <div className="font-medium text-gray-500 col-span-1">{label}</div>
                                                <div className="col-span-2 text-gray-900 font-mono text-sm break-words bg-gray-50 p-2 rounded">{displayValue}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <DialogFooter className="gap-2">
                                    {isAdmin && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                handleEditReport(viewReport);
                                                setViewReport(null);
                                            }}
                                            className="mr-auto"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Report
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => setViewReport(null)}>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* ADMIN: Edit Report Dialog */}
                        <Dialog open={!!editReport} onOpenChange={(open) => !open && setEditReport(null)}>
                            <DialogContent className="min-w-[50vw] max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Technical Report</DialogTitle>
                                    <DialogDescription>
                                        Modify the report data below. This action is for administrators only.
                                    </DialogDescription>
                                </DialogHeader>
                                {reportSchema ? (
                                    <DynamicFormRenderer
                                        schema={reportSchema}
                                        onSubmit={(data) => {
                                            if (editReport) {
                                                updateReportMutation.mutate({
                                                    reportId: editReport.id,
                                                    submissionData: data
                                                });
                                            }
                                        }}
                                        initialData={editReportData}
                                        isLoading={updateReportMutation.isPending}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="ml-2">Loading form...</span>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                                <p className="text-gray-600 mt-4">Loading task details...</p>
                            </div>
                        </div>
                    ) : task ? (
                        <>
                            {/* Status Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Workflow className="h-5 w-5 text-blue-600" />
                                        Workflow Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        {STATUS_FLOW.map((status, index) => {
                                            const isCurrent = task.currentStatus === status.value;
                                            const isPast = STATUS_FLOW.findIndex(s => s.value === task.currentStatus) > index;
                                            const colorClass = isPast || isCurrent
                                                ? status.color === 'amber' ? 'bg-amber-500'
                                                    : status.color === 'blue' ? 'bg-blue-500'
                                                        : 'bg-green-500'
                                                : 'bg-gray-300';

                                            return (
                                                <div key={status.value} className="flex-1 flex items-center">
                                                    <div className="flex flex-col items-center flex-1">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${colorClass} ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-200' : ''}`}>
                                                            {isPast ? <CheckCircle className="h-5 w-5" /> : index + 1}
                                                        </div>
                                                        <span className={`mt-2 text-sm font-medium ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    {index < STATUS_FLOW.length - 1 && (
                                                        <div className={`flex-1 h-1 ${isPast ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Main Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Task Information */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                            Task Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">Client Organization</label>
                                                <p className="text-lg font-semibold text-gray-900 mt-1">
                                                    {task.clientName}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                                                <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    {task.contactPerson}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Email Address</label>
                                                <p className="text-gray-900 mt-1">
                                                    <a href={`mailto:${task.clientEmail}`} className="hover:underline text-blue-600">
                                                        {task.clientEmail}
                                                    </a>
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                                <p className="text-gray-900 mt-1">
                                                    {task.clientPhone}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Product</label>
                                                <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                    <Package className="h-4 w-4 text-gray-400" />
                                                    {task.product?.name || 'Unknown Product'}
                                                </p>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="text-sm font-medium text-gray-500">Address</label>
                                                <p className="text-gray-900 mt-1 bg-gray-50 p-2 rounded text-sm">
                                                    {task.clientAddress}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Current Status</label>
                                                <div className="mt-1">
                                                    {getStatusBadge(task.currentStatus)}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Created</label>
                                                <p className="text-gray-900 flex items-center gap-2 mt-1">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {format(new Date(task.createdAt), "PPP")}
                                                </p>
                                            </div>
                                        </div>

                                        {task.assignedUser && (
                                            <div className="border-t pt-4 mt-4">
                                                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                                        {task.assignedUser.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{task.assignedUser.fullName}</p>
                                                        <p className="text-sm text-gray-500">{task.assignedUser.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Quick Actions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Link href="/tasks" className="block">
                                            <Button variant="outline" className="w-full justify-start">
                                                <ArrowLeft className="h-4 w-4 mr-2" />
                                                Back to Tasks
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* SOP Steps */}
                            {task.sopSnapshot && task.sopSnapshot.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                            Standard Operating Procedure
                                        </CardTitle>
                                        <CardDescription>
                                            Steps to complete for this onboarding task
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {task.sopSnapshot
                                                .sort((a, b) => a.order - b.order)
                                                .map((step, index) => (
                                                    <div key={step.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{step.title}</h4>
                                                            <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                {step.estimatedDuration && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {step.estimatedDuration} min
                                                                    </span>
                                                                )}
                                                                {step.requiredRole && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {step.requiredRole}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Technical Reports */}
                            {task.technicalReports && task.technicalReports.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            Technical Reports ({task.technicalReports.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {task.technicalReports.map((report) => (
                                                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">Report #{report.id.slice(-8)}</p>
                                                            <p className="text-sm text-gray-500">
                                                                Submitted on {format(new Date(report.submittedAt), "PPP")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
                                                        View Details
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Hardware Procurements */}
                            {task.hardwareProcurements && task.hardwareProcurements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-purple-600" />
                                            Hardware Procured ({task.hardwareProcurements.length} types, {task.hardwareProcurements.reduce((sum, p) => sum + p.quantity, 0)} units)
                                        </CardTitle>
                                        <CardDescription>
                                            Hardware items procured for this task
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {task.hardwareProcurements.map((procurement) => (
                                                <div key={procurement.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                                            {procurement.quantity}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{procurement.hardware?.name || 'Unknown Hardware'}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {procurement.hardware?.code} • {procurement.hardware?.category?.name || 'Uncategorized'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {procurement.notes && (
                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                                            {procurement.notes}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Device Provisionings */}
                            {task.deviceProvisionings && task.deviceProvisionings.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HardDrive className="h-5 w-5 text-blue-600" />
                                            Provisioned Devices ({task.deviceProvisionings.length})
                                            {task.product?.isLorawanProduct && (
                                                <Badge className="bg-indigo-100 text-indigo-800 ml-2">
                                                    <Wifi className="h-3 w-3 mr-1" />
                                                    LoRaWAN
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {task.deviceProvisionings.map((device) => (
                                                <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <HardDrive className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900 font-mono">{device.deviceSerial}</p>
                                                            <p className="text-sm text-gray-500">
                                                                Type: {device.deviceType} • FW: {device.firmwareVersion}
                                                            </p>
                                                            {/* LoRaWAN credentials display */}
                                                            {task.product?.isLorawanProduct && device.devEui && (
                                                                <p className="text-xs text-gray-400 font-mono mt-1">
                                                                    DevEUI: {device.devEui}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* LoRaWAN Provisioning Status */}
                                                        {task.product?.isLorawanProduct && device.lorawanProvisioningStatus && device.lorawanProvisioningStatus !== 'NOT_APPLICABLE' && (
                                                            <div className="flex flex-col items-end mr-2">
                                                                {device.lorawanProvisioningStatus === 'PENDING' && (
                                                                    <Badge className="bg-yellow-100 text-yellow-800">
                                                                        <Clock className="h-3 w-3 mr-1" />
                                                                        LoRa Pending
                                                                    </Badge>
                                                                )}
                                                                {device.lorawanProvisioningStatus === 'IN_PROGRESS' && (
                                                                    <Badge className="bg-blue-100 text-blue-800">
                                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                        Provisioning
                                                                    </Badge>
                                                                )}
                                                                {device.lorawanProvisioningStatus === 'COMPLETED' && (
                                                                    <Badge className="bg-green-100 text-green-800">
                                                                        <Radio className="h-3 w-3 mr-1" />
                                                                        LoRa Ready
                                                                    </Badge>
                                                                )}
                                                                {device.lorawanProvisioningStatus === 'FAILED' && (
                                                                    <div>
                                                                        <Badge className="bg-red-100 text-red-800">
                                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                                            LoRa Failed
                                                                        </Badge>
                                                                        {device.lorawanProvisioningError && (
                                                                            <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={device.lorawanProvisioningError}>
                                                                                {device.lorawanProvisioningError}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {device.qrCode && device.qrCode !== 'PENDING' && device.qrCode.startsWith('data:image') ? (
                                                            <>
                                                                <img
                                                                    src={device.qrCode}
                                                                    alt={`QR Code for ${device.deviceSerial}`}
                                                                    className="h-12 w-12 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => setViewQrDevice(device)}
                                                                />
                                                                <div className="flex flex-col items-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-xs"
                                                                        onClick={() => setViewQrDevice(device)}
                                                                    >
                                                                        <QrCode className="h-3 w-3 mr-1" />
                                                                        View
                                                                    </Button>
                                                                    <span className="text-xs text-green-600 flex items-center">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        QR Ready
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : device.qrCode && device.qrCode !== 'PENDING' ? (
                                                            <div className="flex flex-col items-end">
                                                                <Badge variant="outline" className="font-mono text-xs mb-1">
                                                                    {device.qrCode.substring(0, 20)}...
                                                                </Badge>
                                                                <span className="text-xs text-green-600 flex items-center">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    QR Generated
                                                                </span>
                                                            </div>
                                                        ) : device.qrCode === 'PENDING' ? (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                                Pending QR
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* QR Code View Dialog */}
                            <Dialog open={!!viewQrDevice} onOpenChange={(open) => !open && setViewQrDevice(null)}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <QrCode className="h-5 w-5" />
                                            Device QR Code
                                        </DialogTitle>
                                        <DialogDescription>
                                            Serial: {viewQrDevice?.deviceSerial}
                                        </DialogDescription>
                                    </DialogHeader>
                                    {viewQrDevice?.qrCode && (
                                        <div className="flex flex-col items-center py-4">
                                            <img
                                                src={viewQrDevice.qrCode}
                                                alt={`QR Code for ${viewQrDevice.deviceSerial}`}
                                                className="w-64 h-64 rounded-lg border shadow-sm"
                                            />
                                            <div className="mt-4 text-center text-sm text-gray-600">
                                                <p><strong>Device:</strong> {viewQrDevice.deviceType}</p>
                                                <p><strong>Firmware:</strong> {viewQrDevice.firmwareVersion}</p>
                                                <p className="text-xs text-gray-400 mt-2">Scan this QR code to track device provisioning</p>
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter className="flex-row gap-2 sm:gap-0">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (viewQrDevice?.qrCode) {
                                                    const link = document.createElement('a');
                                                    link.href = viewQrDevice.qrCode;
                                                    link.download = `qr-${viewQrDevice.deviceSerial}.png`;
                                                    link.click();
                                                }
                                            }}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button onClick={() => setViewQrDevice(null)}>Close</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : null}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
