import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LorawanRegion } from "@/services/api";

const LORAWAN_REGIONS: { value: LorawanRegion; label: string }[] = [
    { value: 'EU868', label: 'EU868 (Europe)' },
    { value: 'US915', label: 'US915 (North America)' },
    { value: 'AU915', label: 'AU915 (Australia)' },
    { value: 'AS923', label: 'AS923 (Asia)' },
    { value: 'KR920', label: 'KR920 (South Korea)' },
    { value: 'IN865', label: 'IN865 (India)' },
];

interface Step1Props {
    onNext: (data: any) => void;
    defaultValues?: any;
}

export default function Step1ProductDetails({ onNext, defaultValues }: Step1Props) {
    const { register, handleSubmit, formState: { errors }, watch, control } = useForm({
        defaultValues: defaultValues || {
            name: "",
            code: "",
            description: "",
            isLorawanProduct: false,
            lorawanRegion: "",
        }
    });

    const isLorawanProduct = watch("isLorawanProduct");

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

                {/* LoRaWAN Integration */}
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="isLorawanProduct"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="isLorawanProduct"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="isLorawanProduct" className="cursor-pointer">
                            LoRaWAN Product
                        </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                        Enable this if the product uses LoRaWAN connectivity for IoT devices.
                    </p>

                    {isLorawanProduct && (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="lorawanRegion">LoRaWAN Region</Label>
                            <Controller
                                name="lorawanRegion"
                                control={control}
                                rules={{ required: isLorawanProduct ? "LoRaWAN region is required" : false }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LORAWAN_REGIONS.map((region) => (
                                                <SelectItem key={region.value} value={region.value}>
                                                    {region.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.lorawanRegion && (
                                <p className="text-sm text-red-500">{errors.lorawanRegion.message as string}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit">Next: SOP Template</Button>
                </div>
            </form>
        </div>
    );
}
