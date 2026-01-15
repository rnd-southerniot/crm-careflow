import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, Product } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Step1ProductDetails from "./Step1ProductDetails";
import Step2SopBuilder from "./Step2SopBuilder";
import Step3ReportSchema from "./Step3ReportSchema";

interface ProductWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: 'create' | 'edit';
    product?: Product | null;
}

export default function ProductWizard({ open, onOpenChange, mode = 'create', product = null }: ProductWizardProps) {
    const [step, setStep] = useState(1);
    const [productData, setProductData] = useState<any>(null);
    const [sopData, setSopData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    // Initialize data when editing
    useEffect(() => {
        if (mode === 'edit' && product && open) {
            setProductData({
                name: product.name,
                code: product.code,
                description: product.description,
            });

            // Initialize SOP data if exists
            if (product.sopTemplate) {
                // Normalize steps: map requiredRole to role for consistency
                const normalizedSteps = product.sopTemplate.steps.map((step: any) => ({
                    ...step,
                    role: step.role || step.requiredRole || 'IMPLEMENTATION_LEAD',
                }));

                setSopData({
                    steps: normalizedSteps
                });
            }
        }
    }, [mode, product, open]);

    // Reset state when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setStep(1);
            setProductData(null);
            setSopData(null);
            setIsSubmitting(false);
        }
        onOpenChange(newOpen);
    };

    const handleStep1Submit = (data: any) => {
        setProductData(data);
        setStep(2);
    };

    const handleStep2Submit = (data: any) => {
        setSopData(data);
        setStep(3);
    };

    const handleFinalSubmit = async (schemaData: any) => {
        setIsSubmitting(true);
        try {
            if (mode === 'edit' && product) {
                // Update existing product
                await productsApi.updateProduct(product.id, productData);

                // Update or create SOP Template
                if (product.sopTemplate) {
                    await productsApi.updateSopTemplate(product.id, sopData);
                } else {
                    await productsApi.createSopTemplate(product.id, sopData);
                }

                // Update or create Report Schema
                if (product.reportSchema) {
                    await productsApi.updateReportSchema(product.id, schemaData);
                } else {
                    await productsApi.createReportSchema(product.id, schemaData);
                }

                toast.success("Product updated successfully");
            } else {
                // Create new product
                const newProduct = await productsApi.createProduct(productData);
                await productsApi.createSopTemplate(newProduct.id, sopData);
                await productsApi.createReportSchema(newProduct.id, schemaData);

                toast.success("Product created successfully with SOP and Schema");
            }

            queryClient.invalidateQueries({ queryKey: ['products'] });
            handleOpenChange(false);
        } catch (error: any) {
            console.error("Wizard failed:", error);
            toast.error(error.response?.data?.message || `Failed to ${mode} product configuration`);
            // Don't close dialog on error so user can retry
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                    <DialogDescription>
                        Configure product details, SOP template, and report schema.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-8 px-8">
                        <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 1 ? 'bg-blue-100 font-bold' : 'bg-gray-100'}`}>1</div>
                            <span className="text-xs">Details</span>
                        </div>
                        <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                        <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 2 ? 'bg-blue-100 font-bold' : 'bg-gray-100'}`}>2</div>
                            <span className="text-xs">SOP</span>
                        </div>
                        <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-200' : 'bg-gray-100'}`} />
                        <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 3 ? 'bg-blue-100 font-bold' : 'bg-gray-100'}`}>3</div>
                            <span className="text-xs">Schema</span>
                        </div>
                    </div>

                    {/* Steps */}
                    {step === 1 && (
                        <Step1ProductDetails onNext={handleStep1Submit} defaultValues={productData} />
                    )}
                    {step === 2 && (
                        <Step2SopBuilder
                            onNext={handleStep2Submit}
                            onBack={() => setStep(1)}
                            defaultSteps={sopData?.steps}
                        />
                    )}
                    {step === 3 && (
                        <Step3ReportSchema
                            onBack={() => setStep(2)}
                            onSubmit={handleFinalSubmit}
                            isSubmitting={isSubmitting}
                            defaultFields={mode === 'edit' && product?.reportSchema ? product.reportSchema.formStructure as any : undefined}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
