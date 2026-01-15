import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Step3Props {
    onBack: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
    defaultFields?: FormField[];
}

interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea';
    required: boolean;
    order: number;
    options?: { value: string; label: string }[];
}

export default function Step3ReportSchema({ onBack, onSubmit, isSubmitting, defaultFields }: Step3Props) {
    const [fields, setFields] = useState<FormField[]>(defaultFields || [
        { id: '1', name: 'serialNumber', label: 'Serial Number', type: 'text', required: true, order: 1 },
        { id: '2', name: 'signalStrength', label: 'Signal Strength (dBm)', type: 'number', required: true, order: 2 }
    ]);

    const [newLabel, setNewLabel] = useState("");
    const [newType, setNewType] = useState<string>("text");
    const [newRequired, setNewRequired] = useState(true);

    const addField = () => {
        if (!newLabel) return;

        // Auto-generate name from label (camelCase)
        const name = newLabel
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, "");

        const newField: FormField = {
            id: Date.now().toString(),
            name,
            label: newLabel,
            type: newType as any,
            required: newRequired,
            order: fields.length + 1
        };

        setFields([...fields, newField]);
        setNewLabel("");
        setNewType("text");
        setNewRequired(true);
    };

    const removeField = (index: number) => {
        const updated = fields.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
        setFields(updated);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === fields.length - 1) return;

        const updated = [...fields];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

        const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
        setFields(reordered);
    };

    const handleSubmit = () => {
        onSubmit({ formStructure: fields });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 3: Report Schema</h3>
                <p className="text-sm text-gray-500">Define the data fields for the technical completion report.</p>
            </div>

            {/* Add Field Form */}
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-2">
                            <Label>Field Label</Label>
                            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Battery Voltage" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label>Type</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="select">Select Dropdown</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 space-y-2 flex flex-col items-center justify-center pb-2">
                            <Label className="mb-2">Required</Label>
                            <Switch checked={newRequired} onCheckedChange={setNewRequired} />
                        </div>
                        <div className="md:col-span-2">
                            <Button onClick={addField} type="button" className="w-full" disabled={!newLabel}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fields List */}
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <div className="text-center font-bold text-gray-500 w-6">{index + 1}</div>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}>
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{field.label}</h4>
                                {field.required && <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <p className="text-sm text-gray-600 font-mono text-xs mt-0.5">{field.name} ({field.type})</p>
                        </div>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeField(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No fields defined. Add at least one field.
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
                <Button onClick={handleSubmit} disabled={fields.length === 0 || isSubmitting}>
                    {isSubmitting ? 'Creating Product...' : 'Finish & Create'}
                </Button>
            </div>
        </div>
    );
}
