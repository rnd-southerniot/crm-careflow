"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { workflowApi, productsApi, clientsApi, Product, Client } from "@/services/api";
import { useAuthStore } from "@/lib/zustand-store/store";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Workflow,
    ArrowLeft,
    Plus,
    Package,
    User,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText,
    ClipboardList,
    Building2,
    Search,
} from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

interface CreateTaskForm {
    clientId?: string;
    clientName?: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress?: string;
    contactPerson: string;
    productId: string;
    notes?: string;
}

type ClientSelectionMode = "existing" | "new";

export default function CreateTaskPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientMode, setClientMode] = useState<ClientSelectionMode>("existing");
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: "", address: "", notes: "" });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        watch,
        clearErrors,
    } = useForm<CreateTaskForm>();

    const watchClientAddress = watch("clientAddress");

    // Fetch products
    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: productsApi.getProducts,
    });

    // Fetch clients
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientsApi.getAll(),
    });

    // Create client mutation
    const createClientMutation = useMutation({
        mutationFn: clientsApi.create,
        onSuccess: (newClient) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSelectedClient(newClient);
            setValue("clientAddress", newClient.address);
            setIsCreateClientOpen(false);
            setNewClientData({ name: "", address: "", notes: "" });
            toast.success("Client created and selected");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create client");
        },
    });

    // Create task mutation
    const createTaskMutation = useMutation({
        mutationFn: (data: CreateTaskForm) => {
            if (clientMode === "existing" && selectedClient) {
                return workflowApi.createTask({
                    clientId: selectedClient.id,
                    clientAddress: data.clientAddress, // Allow address override
                    clientEmail: data.clientEmail,
                    clientPhone: data.clientPhone,
                    contactPerson: data.contactPerson,
                    productId: data.productId,
                });
            } else {
                return workflowApi.createTask({
                    clientName: data.clientName,
                    clientEmail: data.clientEmail,
                    clientPhone: data.clientPhone,
                    clientAddress: data.clientAddress,
                    contactPerson: data.contactPerson,
                    productId: data.productId,
                });
            }
        },
        onSuccess: (newTask) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Onboarding task created successfully');
            router.push(`/tasks/${newTask.id}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create task');
        },
    });

    const onSubmit = (data: CreateTaskForm) => {
        createTaskMutation.mutate(data);
    };

    const handleProductSelect = (productId: string) => {
        const product = products?.find(p => p.id === productId) || null;
        setSelectedProduct(product);
    };

    const handleClientSelect = (clientId: string) => {
        const client = clients?.find(c => c.id === clientId) || null;
        setSelectedClient(client);
        if (client) {
            setValue("clientAddress", client.address);
            clearErrors("clientAddress");
        }
    };

    const handleClientModeChange = (mode: ClientSelectionMode) => {
        setClientMode(mode);
        if (mode === "new") {
            setSelectedClient(null);
        }
    };

    const handleCreateNewClient = () => {
        createClientMutation.mutate({
            name: newClientData.name,
            address: newClientData.address,
            notes: newClientData.notes || undefined,
        });
    };

    // Check if user has permission to create tasks
    const canCreateTask = user?.role.name === 'SALES' || user?.role.name === 'ADMIN';

    // Validation for form submission
    const isFormValid = () => {
        if (clientMode === "existing") {
            return selectedClient !== null;
        }
        return true; // New client validation handled by react-hook-form
    };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/tasks">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create Onboarding Task</h1>
                            <p className="text-gray-600 mt-1">
                                Start a new client onboarding workflow
                            </p>
                        </div>
                    </div>

                    {!canCreateTask ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                                <p className="text-gray-600 mb-4 text-center">
                                    You don't have permission to create onboarding tasks.<br />
                                    Please contact a Sales representative or Administrator.
                                </p>
                                <Link href="/tasks">
                                    <Button variant="outline">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Tasks
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Client Selection Mode */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        Client Selection
                                    </CardTitle>
                                    <CardDescription>
                                        Select an existing client or enter new client details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <RadioGroup
                                        value={clientMode}
                                        onValueChange={(value) => handleClientModeChange(value as ClientSelectionMode)}
                                        className="flex gap-6"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="existing" id="existing" />
                                            <Label htmlFor="existing" className="cursor-pointer">Select existing client</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="new" id="new" />
                                            <Label htmlFor="new" className="cursor-pointer">Enter new client info</Label>
                                        </div>
                                    </RadioGroup>

                                    {clientMode === "existing" ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Label className="text-sm font-medium">
                                                        Client Organization <span className="text-red-500">*</span>
                                                    </Label>
                                                    {clientsLoading ? (
                                                        <div className="flex items-center gap-2 mt-1.5 text-gray-500">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Loading clients...
                                                        </div>
                                                    ) : (
                                                        <Select
                                                            value={selectedClient?.id}
                                                            onValueChange={handleClientSelect}
                                                        >
                                                            <SelectTrigger className="mt-1.5">
                                                                <SelectValue placeholder="Select a client organization" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {clients?.filter(c => c.isActive).map((client) => (
                                                                    <SelectItem key={client.id} value={client.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 className="h-4 w-4 text-gray-400" />
                                                                            <span>{client.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                                <div className="pt-6">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsCreateClientOpen(true)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        New
                                                    </Button>
                                                </div>
                                            </div>

                                            {selectedClient && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <Building2 className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{selectedClient.name}</h4>
                                                            <p className="text-sm text-gray-600 mt-1">{selectedClient.address}</p>
                                                            {selectedClient.notes && (
                                                                <p className="text-xs text-gray-500 mt-1 italic">{selectedClient.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Address Override for existing client */}
                                            {selectedClient && (
                                                <div>
                                                    <Label htmlFor="clientAddress" className="text-sm font-medium">
                                                        Installation Address <span className="text-gray-400">(can override)</span>
                                                    </Label>
                                                    <Textarea
                                                        id="clientAddress"
                                                        placeholder="Leave as client address or enter different location (e.g., Factory 2)"
                                                        className="mt-1.5 min-h-[60px]"
                                                        {...register("clientAddress")}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Use a different address if this installation is at a different location than the client's main address.
                                                    </p>
                                                </div>
                                            )}

                                            {!selectedClient && (
                                                <p className="text-sm text-amber-600 flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Please select a client organization to continue
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        /* New client entry mode */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="md:col-span-2">
                                                <Label htmlFor="clientName" className="text-sm font-medium">
                                                    Client Name / Organization <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="clientName"
                                                    placeholder="Enter organization or client name"
                                                    className="mt-1.5"
                                                    {...register("clientName", {
                                                        required: clientMode === "new" ? "Client name is required" : false,
                                                        minLength: { value: 2, message: "Name must be at least 2 characters" }
                                                    })}
                                                />
                                                {errors.clientName && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.clientName.message}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label htmlFor="clientAddress" className="text-sm font-medium">
                                                    Address <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="clientAddress"
                                                    placeholder="Full billing/shipping address"
                                                    className="mt-1.5 min-h-[80px]"
                                                    {...register("clientAddress", {
                                                        required: clientMode === "new" ? "Address is required" : false
                                                    })}
                                                />
                                                {errors.clientAddress && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.clientAddress.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Contact Information
                                    </CardTitle>
                                    <CardDescription>
                                        Contact person details for this specific task
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="contactPerson" className="text-sm font-medium">
                                                Contact Person <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="contactPerson"
                                                placeholder="Full name of contact person"
                                                className="mt-1.5"
                                                {...register("contactPerson", {
                                                    required: "Contact person is required"
                                                })}
                                            />
                                            {errors.contactPerson && (
                                                <p className="text-sm text-red-500 mt-1">{errors.contactPerson.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="clientEmail" className="text-sm font-medium">
                                                Email Address <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="clientEmail"
                                                type="email"
                                                placeholder="contact@example.com"
                                                className="mt-1.5"
                                                {...register("clientEmail", {
                                                    required: "Email is required",
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: "Invalid email address"
                                                    }
                                                })}
                                            />
                                            {errors.clientEmail && (
                                                <p className="text-sm text-red-500 mt-1">{errors.clientEmail.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="clientPhone" className="text-sm font-medium">
                                                Phone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="clientPhone"
                                                placeholder="+1 (555) 000-0000"
                                                className="mt-1.5"
                                                {...register("clientPhone", {
                                                    required: "Phone number is required"
                                                })}
                                            />
                                            {errors.clientPhone && (
                                                <p className="text-sm text-red-500 mt-1">{errors.clientPhone.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Each task can have a different contact person, even for the same client organization.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Product Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        Product Selection
                                    </CardTitle>
                                    <CardDescription>
                                        Select the product for this onboarding
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="productId" className="text-sm font-medium">
                                            Product <span className="text-red-500">*</span>
                                        </Label>
                                        {productsLoading ? (
                                            <div className="flex items-center gap-2 mt-1.5 text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading products...
                                            </div>
                                        ) : (
                                            <Controller
                                                control={control}
                                                name="productId"
                                                rules={{ required: "Product is required" }}
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleProductSelect(value);
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="mt-1.5">
                                                            <SelectValue placeholder="Select a product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products?.filter(p => p.isActive !== false).map((product) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <Package className="h-4 w-4 text-gray-400" />
                                                                        <span>{product.name}</span>
                                                                        <span className="text-gray-400 text-sm">({product.code})</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        )}
                                        {errors.productId && (
                                            <p className="text-sm text-red-500 mt-1">Please select a product</p>
                                        )}
                                    </div>

                                    {/* Selected Product Preview */}
                                    {selectedProduct && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Package className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-sm">
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <FileText className="h-4 w-4" />
                                                            Code: {selectedProduct.code}
                                                        </span>
                                                        {selectedProduct.sopTemplate && (
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="h-4 w-4" />
                                                                SOP Template
                                                            </span>
                                                        )}
                                                        {selectedProduct.reportSchema && (
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle className="h-4 w-4" />
                                                                Report Schema
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* SOP Preview */}
                            {selectedProduct?.sopTemplate?.steps && selectedProduct.sopTemplate.steps.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                            Workflow Steps Preview
                                        </CardTitle>
                                        <CardDescription>
                                            This task will follow these standard operating procedure steps
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedProduct.sopTemplate.steps
                                                .sort((a, b) => a.order - b.order)
                                                .map((step, index) => (
                                                    <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-gray-900 text-sm">{step.title}</h5>
                                                            <p className="text-gray-500 text-xs mt-0.5">{step.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* What Happens Next */}
                            <Card className="border-blue-100 bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Workflow className="h-5 w-5 text-blue-600" />
                                        What Happens Next?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-medium">
                                                1
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Initialization</p>
                                                <p className="text-xs text-gray-600">Task is created and assigned for requirements gathering</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                                                2
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Requirements Complete</p>
                                                <p className="text-xs text-gray-600">Implementation team collects requirements and submits reports</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
                                                3
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Ready for Installation</p>
                                                <p className="text-xs text-gray-600">Hardware team provisions devices and completes setup</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <Link href="/tasks">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={createTaskMutation.isPending || (clientMode === "existing" && !selectedClient)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[150px]"
                                >
                                    {createTaskMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Task
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Create New Client Dialog */}
                <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            <DialogDescription>
                                Create a new client organization. This client will be automatically selected after creation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-client-name">Organization Name *</Label>
                                <Input
                                    id="new-client-name"
                                    value={newClientData.name}
                                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                    placeholder="e.g., Acme Corporation"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-client-address">Address *</Label>
                                <Textarea
                                    id="new-client-address"
                                    value={newClientData.address}
                                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                    placeholder="Primary billing/shipping address"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-client-notes">Notes</Label>
                                <Textarea
                                    id="new-client-notes"
                                    value={newClientData.notes}
                                    onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                                    placeholder="Optional notes about the client"
                                    rows={2}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateClientOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateNewClient}
                                disabled={createClientMutation.isPending || !newClientData.name || !newClientData.address}
                            >
                                {createClientMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create & Select
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
