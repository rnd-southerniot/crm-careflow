"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hardwareCatalogApi, hardwareCategoryApi, Hardware, HardwareCategory } from "@/services/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    HardDrive,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Loader2,
    AlertCircle,
    Cpu,
    Radio,
    Box,
    Tag,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// ==================== Interfaces ====================

interface HardwareFormData {
    name: string;
    code: string;
    description: string;
    categoryId: string;
    manufacturer: string;
}

interface CategoryFormData {
    name: string;
    description: string;
    icon: string;
}

const initialHardwareFormData: HardwareFormData = {
    name: "",
    code: "",
    description: "",
    categoryId: "",
    manufacturer: "",
};

const initialCategoryFormData: CategoryFormData = {
    name: "",
    description: "",
    icon: "Box",
};

const ICON_OPTIONS = [
    { value: "Cpu", label: "Microcontroller", icon: Cpu },
    { value: "Radio", label: "Sensor", icon: Radio },
    { value: "Box", label: "Module", icon: Box },
    { value: "HardDrive", label: "Storage", icon: HardDrive },
    { value: "Tag", label: "Other", icon: Tag },
];

// ==================== Main Component ====================

export default function HardwareCatalogPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showInactive, setShowInactive] = useState(false);
    const [showInactiveCategories, setShowInactiveCategories] = useState(false);

    // Hardware state
    const [isCreateHardwareOpen, setIsCreateHardwareOpen] = useState(false);
    const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
    const [hardwareFormData, setHardwareFormData] = useState<HardwareFormData>(initialHardwareFormData);

    // Category state
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<HardwareCategory | null>(null);
    const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>(initialCategoryFormData);

    // ==================== Queries ====================

    const { data: hardware, isLoading: hardwareLoading, error: hardwareError } = useQuery({
        queryKey: ['hardware-catalog', showInactive],
        queryFn: () => hardwareCatalogApi.getAll(showInactive),
    });

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['hardware-categories', showInactiveCategories],
        queryFn: () => hardwareCategoryApi.getAll(showInactiveCategories),
    });

    // ==================== Hardware Mutations ====================

    const createHardwareMutation = useMutation({
        mutationFn: hardwareCatalogApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            setIsCreateHardwareOpen(false);
            setHardwareFormData(initialHardwareFormData);
            toast.success("Hardware created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create hardware");
        },
    });

    const updateHardwareMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hardwareCatalogApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            setEditingHardware(null);
            setHardwareFormData(initialHardwareFormData);
            toast.success("Hardware updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update hardware");
        },
    });

    const deleteHardwareMutation = useMutation({
        mutationFn: (id: string) => hardwareCatalogApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            toast.success("Hardware deactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to deactivate hardware");
        },
    });

    // ==================== Category Mutations ====================

    const createCategoryMutation = useMutation({
        mutationFn: hardwareCategoryApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            setIsCreateCategoryOpen(false);
            setCategoryFormData(initialCategoryFormData);
            toast.success("Category created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create category");
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hardwareCategoryApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            queryClient.invalidateQueries({ queryKey: ['hardware-catalog'] });
            setEditingCategory(null);
            setCategoryFormData(initialCategoryFormData);
            toast.success("Category updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update category");
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => hardwareCategoryApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            toast.success("Category deleted/deactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete category");
        },
    });

    const reactivateCategoryMutation = useMutation({
        mutationFn: (id: string) => hardwareCategoryApi.reactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hardware-categories'] });
            toast.success("Category reactivated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to reactivate category");
        },
    });

    // ==================== Filter Logic ====================

    const filteredHardware = hardware?.filter(h => {
        const matchesSearch = searchQuery === "" ||
            h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || h.categoryId === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    // ==================== Handlers ====================

    const handleCreateHardware = () => {
        createHardwareMutation.mutate({
            name: hardwareFormData.name,
            code: hardwareFormData.code,
            description: hardwareFormData.description || undefined,
            categoryId: hardwareFormData.categoryId,
            manufacturer: hardwareFormData.manufacturer || undefined,
        });
    };

    const handleUpdateHardware = () => {
        if (!editingHardware) return;
        updateHardwareMutation.mutate({
            id: editingHardware.id,
            data: {
                name: hardwareFormData.name,
                code: hardwareFormData.code,
                description: hardwareFormData.description || undefined,
                categoryId: hardwareFormData.categoryId,
                manufacturer: hardwareFormData.manufacturer || undefined,
            },
        });
    };

    const openHardwareEditDialog = (hw: Hardware) => {
        setEditingHardware(hw);
        setHardwareFormData({
            name: hw.name,
            code: hw.code,
            description: hw.description || "",
            categoryId: hw.categoryId,
            manufacturer: hw.manufacturer || "",
        });
    };

    const handleCreateCategory = () => {
        createCategoryMutation.mutate({
            name: categoryFormData.name,
            description: categoryFormData.description || undefined,
            icon: categoryFormData.icon || undefined,
        });
    };

    const handleUpdateCategory = () => {
        if (!editingCategory) return;
        updateCategoryMutation.mutate({
            id: editingCategory.id,
            data: {
                name: categoryFormData.name,
                description: categoryFormData.description || undefined,
                icon: categoryFormData.icon || undefined,
            },
        });
    };

    const openCategoryEditDialog = (cat: HardwareCategory) => {
        setEditingCategory(cat);
        setCategoryFormData({
            name: cat.name,
            description: cat.description || "",
            icon: cat.icon || "Box",
        });
    };

    const getCategoryIcon = (iconName?: string) => {
        const option = ICON_OPTIONS.find(o => o.value === iconName);
        const Icon = option?.icon || Box;
        return <Icon className="h-4 w-4" />;
    };

    // ==================== Error State ====================

    if (hardwareError) {
        return (
            <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-gray-900">Error loading hardware catalog</h2>
                            <p className="text-gray-600 mt-2">Please try again later</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    // ==================== Render ====================

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hardware Catalog</h1>
                            <p className="text-gray-600 mt-2">Manage hardware components and categories</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="hardware" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="hardware">Hardware Components</TabsTrigger>
                            <TabsTrigger value="categories">Categories</TabsTrigger>
                        </TabsList>

                        {/* ==================== Hardware Tab ==================== */}
                        <TabsContent value="hardware" className="space-y-4">
                            {/* Add Hardware Button */}
                            <div className="flex justify-end">
                                <Dialog open={isCreateHardwareOpen} onOpenChange={setIsCreateHardwareOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Hardware
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Hardware</DialogTitle>
                                            <DialogDescription>Add a new hardware component to the catalog.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-name">Name *</Label>
                                                <Input id="hw-name" value={hardwareFormData.name} onChange={(e) => setHardwareFormData({ ...hardwareFormData, name: e.target.value })} placeholder="e.g., Arduino UNO R3" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-code">Code *</Label>
                                                <Input id="hw-code" value={hardwareFormData.code} onChange={(e) => setHardwareFormData({ ...hardwareFormData, code: e.target.value })} placeholder="e.g., ARD-UNO-R3" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-category">Category *</Label>
                                                <Select value={hardwareFormData.categoryId} onValueChange={(value) => setHardwareFormData({ ...hardwareFormData, categoryId: value })}>
                                                    <SelectTrigger id="hw-category">
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories?.filter(c => c.isActive).map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-manufacturer">Manufacturer</Label>
                                                <Input id="hw-manufacturer" value={hardwareFormData.manufacturer} onChange={(e) => setHardwareFormData({ ...hardwareFormData, manufacturer: e.target.value })} placeholder="e.g., Arduino" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-description">Description</Label>
                                                <Textarea id="hw-description" value={hardwareFormData.description} onChange={(e) => setHardwareFormData({ ...hardwareFormData, description: e.target.value })} placeholder="Brief description of the hardware" rows={3} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreateHardwareOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateHardware} disabled={createHardwareMutation.isPending || !hardwareFormData.name || !hardwareFormData.code || !hardwareFormData.categoryId}>
                                                {createHardwareMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Create Hardware
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Filters */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input placeholder="Search by name, code, or manufacturer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                                        </div>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {categories?.filter(c => c.isActive).map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2">
                                            <Switch id="show-inactive-hw" checked={showInactive} onCheckedChange={setShowInactive} />
                                            <Label htmlFor="show-inactive-hw" className="text-sm">Show inactive</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Hardware Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <HardDrive className="h-5 w-5 text-blue-600" />
                                        Hardware Components ({filteredHardware.length})
                                    </CardTitle>
                                    <CardDescription>Manage hardware components that can be used in products</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {hardwareLoading || categoriesLoading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="text-gray-600 mt-4">Loading hardware catalog...</p>
                                            </div>
                                        </div>
                                    ) : filteredHardware.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center">
                                            <HardDrive className="h-16 w-16 text-gray-300 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hardware found</h3>
                                            <p className="text-gray-500 mb-4">{searchQuery || categoryFilter !== "all" ? "Try adjusting your filters" : "Add your first hardware component to get started"}</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-semibold">Name</TableHead>
                                                    <TableHead className="font-semibold">Code</TableHead>
                                                    <TableHead className="font-semibold">Category</TableHead>
                                                    <TableHead className="font-semibold">Manufacturer</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredHardware.map((hw) => (
                                                    <TableRow key={hw.id} className={!hw.isActive ? "opacity-50" : ""}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getCategoryIcon(hw.category?.icon)}
                                                                <span className="font-medium">{hw.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell><code className="text-sm bg-gray-100 px-2 py-1 rounded">{hw.code}</code></TableCell>
                                                        <TableCell><Badge variant="secondary">{hw.category?.name || "Unknown"}</Badge></TableCell>
                                                        <TableCell>{hw.manufacturer || "-"}</TableCell>
                                                        <TableCell>
                                                            {hw.isActive ? (
                                                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Inactive</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => openHardwareEditDialog(hw)}><Edit className="h-4 w-4" /></Button>
                                                                {hw.isActive && (
                                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => deleteHardwareMutation.mutate(hw.id)} disabled={deleteHardwareMutation.isPending}>
                                                                        <Trash2 className="h-4 w-4" />
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
                        </TabsContent>

                        {/* ==================== Categories Tab ==================== */}
                        <TabsContent value="categories" className="space-y-4">
                            {/* Add Category Button */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Switch id="show-inactive-cat" checked={showInactiveCategories} onCheckedChange={setShowInactiveCategories} />
                                    <Label htmlFor="show-inactive-cat" className="text-sm">Show inactive</Label>
                                </div>
                                <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Category
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Category</DialogTitle>
                                            <DialogDescription>Create a new hardware category.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cat-name">Name *</Label>
                                                <Input id="cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} placeholder="e.g., Microcontroller" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cat-icon">Icon</Label>
                                                <Select value={categoryFormData.icon} onValueChange={(value) => setCategoryFormData({ ...categoryFormData, icon: value })}>
                                                    <SelectTrigger id="cat-icon">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ICON_OPTIONS.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <option.icon className="h-4 w-4" />
                                                                    {option.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cat-description">Description</Label>
                                                <Textarea id="cat-description" value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} placeholder="Brief description of the category" rows={3} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending || !categoryFormData.name}>
                                                {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Create Category
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Categories Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-purple-600" />
                                        Hardware Categories ({categories?.length || 0})
                                    </CardTitle>
                                    <CardDescription>Manage categories for organizing hardware components</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {categoriesLoading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                                                <p className="text-gray-600 mt-4">Loading categories...</p>
                                            </div>
                                        </div>
                                    ) : (!categories || categories.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center">
                                            <Tag className="h-16 w-16 text-gray-300 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                                            <p className="text-gray-500 mb-4">Create your first category to organize hardware</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-semibold">Icon</TableHead>
                                                    <TableHead className="font-semibold">Name</TableHead>
                                                    <TableHead className="font-semibold">Description</TableHead>
                                                    <TableHead className="font-semibold">Hardware Count</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {categories.map((cat) => (
                                                    <TableRow key={cat.id} className={!cat.isActive ? "opacity-50" : ""}>
                                                        <TableCell>{getCategoryIcon(cat.icon)}</TableCell>
                                                        <TableCell><span className="font-medium">{cat.name}</span></TableCell>
                                                        <TableCell className="text-gray-600 max-w-xs truncate">{cat.description || "-"}</TableCell>
                                                        <TableCell><Badge variant="outline">{cat._count?.hardware || 0}</Badge></TableCell>
                                                        <TableCell>
                                                            {cat.isActive ? (
                                                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Inactive</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => openCategoryEditDialog(cat)}><Edit className="h-4 w-4" /></Button>
                                                                {cat.isActive ? (
                                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => deleteCategoryMutation.mutate(cat.id)} disabled={deleteCategoryMutation.isPending}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50" onClick={() => reactivateCategoryMutation.mutate(cat.id)} disabled={reactivateCategoryMutation.isPending}>
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
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Edit Hardware Dialog */}
                <Dialog open={!!editingHardware} onOpenChange={(open) => !open && setEditingHardware(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Hardware</DialogTitle>
                            <DialogDescription>Update hardware component details.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-hw-name">Name *</Label>
                                <Input id="edit-hw-name" value={hardwareFormData.name} onChange={(e) => setHardwareFormData({ ...hardwareFormData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hw-code">Code *</Label>
                                <Input id="edit-hw-code" value={hardwareFormData.code} onChange={(e) => setHardwareFormData({ ...hardwareFormData, code: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hw-category">Category *</Label>
                                <Select value={hardwareFormData.categoryId} onValueChange={(value) => setHardwareFormData({ ...hardwareFormData, categoryId: value })}>
                                    <SelectTrigger id="edit-hw-category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories?.filter(c => c.isActive).map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hw-manufacturer">Manufacturer</Label>
                                <Input id="edit-hw-manufacturer" value={hardwareFormData.manufacturer} onChange={(e) => setHardwareFormData({ ...hardwareFormData, manufacturer: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hw-description">Description</Label>
                                <Textarea id="edit-hw-description" value={hardwareFormData.description} onChange={(e) => setHardwareFormData({ ...hardwareFormData, description: e.target.value })} rows={3} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingHardware(null)}>Cancel</Button>
                            <Button onClick={handleUpdateHardware} disabled={updateHardwareMutation.isPending || !hardwareFormData.name || !hardwareFormData.code || !hardwareFormData.categoryId}>
                                {updateHardwareMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Category Dialog */}
                <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>Update category details.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-cat-name">Name *</Label>
                                <Input id="edit-cat-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-cat-icon">Icon</Label>
                                <Select value={categoryFormData.icon} onValueChange={(value) => setCategoryFormData({ ...categoryFormData, icon: value })}>
                                    <SelectTrigger id="edit-cat-icon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ICON_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <option.icon className="h-4 w-4" />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-cat-description">Description</Label>
                                <Textarea id="edit-cat-description" value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} rows={3} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                            <Button onClick={handleUpdateCategory} disabled={updateCategoryMutation.isPending || !categoryFormData.name}>
                                {updateCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
