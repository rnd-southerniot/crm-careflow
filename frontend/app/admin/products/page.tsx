"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, Product } from "@/services/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Package, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import ProductWizard from "@/components/products/wizard/ProductWizard";
import { toast } from "sonner";

export default function ProductsPage() {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch products
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: productsApi.getProducts,
    });

    // Update product mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productsApi.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Product updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update product");
        },
    });

    // Delete product mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Product deleted successfully");
            setDeleteProductId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete product");
            setDeleteProductId(null);
        },
    });

    const handleOpenAddWizard = () => {
        setWizardMode('create');
        setEditProduct(null);
        setWizardOpen(true);
    };

    const handleOpenEditWizard = (product: Product) => {
        setWizardMode('edit');
        setEditProduct(product);
        setWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
        setEditProduct(null);
    };

    const handleToggleActive = async (product: Product) => {
        await updateMutation.mutateAsync({
            id: product.id,
            data: { isActive: !product.isActive },
        });
    };

    const handleDelete = () => {
        if (deleteProductId) {
            deleteMutation.mutate(deleteProductId);
        }
    };

    if (error) {
        return (
            <ProtectedRoute requiredRole="ADMIN">
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-64">
                        <h2 className="text-lg font-semibold text-gray-900">Error loading products</h2>
                        <p className="text-gray-600 mt-2">Please try again later</p>
                        <Button variant="outline" className="mt-4" asChild>
                            <Link href="/admin/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent">
                                    <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900">
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Link>
                                </Button>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                            <p className="text-gray-600 mt-1">Manage system hardware products and configurations</p>
                        </div>

                        <Button onClick={handleOpenAddWizard}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{products?.length || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Products Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Products</CardTitle>
                            <CardDescription>
                                A list of all hardware products available in the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                        <p className="text-gray-600 mt-2">Loading products...</p>
                                    </div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>SOP Template</TableHead>
                                            <TableHead>Report Schema</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products?.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>
                                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{product.code}</code>
                                                </TableCell>
                                                <TableCell>{product.description}</TableCell>
                                                <TableCell>
                                                    {product.sopTemplate ? (
                                                        <span className="text-green-600 flex items-center text-sm">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                            Configured
                                                        </span>
                                                    ) : (
                                                        <span className="text-yellow-600 flex items-center text-sm">
                                                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                                            Missing
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {product.reportSchema ? (
                                                        <span className="text-green-600 flex items-center text-sm">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                            Configured
                                                        </span>
                                                    ) : (
                                                        <span className="text-yellow-600 flex items-center text-sm">
                                                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                                            Missing
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={product.isActive !== false}
                                                            onCheckedChange={() => handleToggleActive(product)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                        <span className="text-sm text-gray-600">
                                                            {product.isActive !== false ? "Active" : "Disabled"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEditWizard(product)}
                                                            title="Edit product"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteProductId(product.id)}
                                                            disabled={
                                                                (product._count?.onboardingTasks || 0) > 0
                                                            }
                                                            title={
                                                                (product._count?.onboardingTasks || 0) > 0
                                                                    ? `Cannot delete: ${product._count?.onboardingTasks} task(s) associated`
                                                                    : "Delete product"
                                                            }
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!products?.length && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No products found. Create one to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>

            {/* Product Wizard - Create or Edit */}
            <ProductWizard
                open={wizardOpen}
                onOpenChange={handleCloseWizard}
                mode={wizardMode}
                product={editProduct}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product
                            and all associated configurations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    );
}
