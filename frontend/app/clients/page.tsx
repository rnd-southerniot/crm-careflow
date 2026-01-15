"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, Client } from "@/services/api";
import { useAuthStore } from "@/lib/zustand-store/store";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Building2,
    Plus,
    Edit,
    Trash2,
    Search,
    Loader2,
    AlertCircle,
    RotateCcw,
    ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

// ==================== Interfaces ====================

interface ClientFormData {
    name: string;
    address: string;
    notes: string;
}

const initialFormData: ClientFormData = {
    name: "",
    address: "",
    notes: "",
};

// ==================== Main Component ====================

export default function ClientsPage() {
    const queryClient = useQueryClient();
    const { user, hasPermission } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientFormData>(initialFormData);

    // Check permissions using hasPermission helper
    const canCreate = hasPermission('clients', 'create') ||
        user?.role.name === 'ADMIN' || user?.role.name === 'SALES';
    const canUpdate = hasPermission('clients', 'update') ||
        user?.role.name === 'ADMIN';
    const canDelete = hasPermission('clients', 'delete') ||
        user?.role.name === 'ADMIN';

    // ==================== Queries ====================

    const { data: clients, isLoading, error } = useQuery({
        queryKey: ['clients', showInactive],
        queryFn: () => clientsApi.getAll(showInactive),
    });

    // ==================== Mutations ====================

    const createMutation = useMutation({
        mutationFn: clientsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsCreateOpen(false);
            setFormData(initialFormData);
            toast.success("Client created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create client");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => clientsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setEditingClient(null);
            setFormData(initialFormData);
            toast.success("Client updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update client");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => clientsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Client deactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to deactivate client");
        },
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: string) => clientsApi.reactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Client reactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to reactivate client");
        },
    });

    // ==================== Filter Logic ====================

    const filteredClients = clients?.filter(c => {
        const matchesSearch = searchQuery === "" ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.notes?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }) || [];

    // ==================== Handlers ====================

    const handleCreate = () => {
        createMutation.mutate({
            name: formData.name,
            address: formData.address,
            notes: formData.notes || undefined,
        });
    };

    const handleUpdate = () => {
        if (!editingClient) return;
        updateMutation.mutate({
            id: editingClient.id,
            data: {
                name: formData.name,
                address: formData.address,
                notes: formData.notes || undefined,
            },
        });
    };

    const openEditDialog = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            address: client.address,
            notes: client.notes || "",
        });
    };

    // ==================== Error State ====================

    if (error) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-gray-900">Error loading clients</h2>
                            <p className="text-gray-600 mt-2">Please try again later</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    // ==================== Render ====================

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                            <p className="text-gray-600 mt-2">Manage client organizations and their information</p>
                        </div>
                        {canCreate && (
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Client
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Client</DialogTitle>
                                        <DialogDescription>Add a new client organization to the system.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client-name">Organization Name *</Label>
                                            <Input
                                                id="client-name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Acme Corporation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client-address">Address *</Label>
                                            <Textarea
                                                id="client-address"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Primary billing/shipping address"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client-notes">Notes</Label>
                                            <Textarea
                                                id="client-notes"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Optional notes about the client"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleCreate}
                                            disabled={createMutation.isPending || !formData.name || !formData.address}
                                        >
                                            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Create Client
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, address, or notes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="show-inactive"
                                        checked={showInactive}
                                        onCheckedChange={setShowInactive}
                                    />
                                    <Label htmlFor="show-inactive" className="text-sm">Show inactive</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Client Organizations ({filteredClients.length})
                            </CardTitle>
                            <CardDescription>Clients can be selected when creating new onboarding tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-4">Loading clients...</p>
                                    </div>
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {searchQuery ? "Try adjusting your search" : "Add your first client to get started"}
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-semibold">Organization</TableHead>
                                            <TableHead className="font-semibold">Address</TableHead>
                                            <TableHead className="font-semibold">Tasks</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredClients.map((client) => (
                                            <TableRow key={client.id} className={!client.isActive ? "opacity-50" : ""}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <Link href={`/clients/${client.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                                {client.name}
                                                            </Link>
                                                            {client.notes && (
                                                                <p className="text-xs text-gray-500 truncate max-w-xs">{client.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-gray-600">{client.address}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                        <ClipboardList className="h-3 w-3" />
                                                        {client._count?.onboardingTasks || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {client.isActive ? (
                                                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Inactive</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {canUpdate && (
                                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(client)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete && client.isActive && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                onClick={() => deleteMutation.mutate(client.id)}
                                                                disabled={deleteMutation.isPending}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {canUpdate && !client.isActive && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                                onClick={() => reactivateMutation.mutate(client.id)}
                                                                disabled={reactivateMutation.isPending}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Client Dialog */}
                <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Client</DialogTitle>
                            <DialogDescription>Update client organization details.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-client-name">Organization Name *</Label>
                                <Input
                                    id="edit-client-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-client-address">Address *</Label>
                                <Textarea
                                    id="edit-client-address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-client-notes">Notes</Label>
                                <Textarea
                                    id="edit-client-notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending || !formData.name || !formData.address}
                            >
                                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
