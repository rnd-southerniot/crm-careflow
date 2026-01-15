"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/services/api";

interface EditProductDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; code: string; description: string }) => Promise<void>;
}

interface FormData {
    name: string;
    code: string;
    description: string;
}

export default function EditProductDialog({ product, open, onOpenChange, onSubmit }: EditProductDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        defaultValues: {
            name: product?.name || "",
            code: product?.code || "",
            description: product?.description || "",
        },
    });

    // Update form when product changes
    useState(() => {
        if (product) {
            reset({
                name: product.name,
                code: product.code,
                description: product.description,
            });
        }
    });

    const handleFormSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[50vw]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                        Update product details. Changes will be saved immediately.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                            id="name"
                            {...register("name", { required: "Product name is required" })}
                            placeholder="e.g., Enterprise Router X-1"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">Product Code *</Label>
                        <Input
                            id="code"
                            {...register("code", { required: "Product code is required" })}
                            placeholder="e.g., ERX-1"
                        />
                        {errors.code && (
                            <p className="text-sm text-red-500">{errors.code.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            {...register("description", { required: "Description is required" })}
                            placeholder="Brief description of the product"
                            rows={4}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
