import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step1Props {
    onNext: (data: any) => void;
    defaultValues?: any;
}

export default function Step1ProductDetails({ onNext, defaultValues }: Step1Props) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: defaultValues || {
            name: "",
            code: "",
            description: "",
        }
    });

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 1: Product Details</h3>
                <p className="text-sm text-gray-500">Enter the basic information for the new product.</p>
            </div>

            <form onSubmit={handleSubmit(onNext)} id="step1-form" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                        id="name"
                        {...register("name", { required: "Product name is required" })}
                        placeholder="e.g. Solar Gateway V2"
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="code">Product Code</Label>
                    <Input
                        id="code"
                        {...register("code", { required: "Product code is required" })}
                        placeholder="e.g. SG-V2"
                    />
                    {errors.code && <p className="text-sm text-red-500">{errors.code.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        {...register("description", { required: "Description is required" })}
                        placeholder="Product description"
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description.message as string}</p>}
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit">Next: SOP Template</Button>
                </div>
            </form>
        </div>
    );
}
