import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Step2Props {
    onNext: (data: any) => void;
    onBack: () => void;
    defaultSteps?: SopStep[];
}

interface SopStep {
    id: string;
    title: string;
    description: string;
    order: number;
    estimatedDuration: number;
    role?: string;
    requiredRole?: string; // Database uses requiredRole
}

export default function Step2SopBuilder({ onNext, onBack, defaultSteps }: Step2Props) {
    const [steps, setSteps] = useState<SopStep[]>(defaultSteps || [
        { id: '1', title: 'Initial Inspection', description: 'Inspect the device for physical damage', order: 1, estimatedDuration: 15, role: 'SALES' },
        { id: '2', title: 'Power On Test', description: 'Connect power and verify LEDs', order: 2, estimatedDuration: 10, role: 'HARDWARE_ENGINEER' }
    ]);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDuration, setNewDuration] = useState(15);
    const [newRole, setNewRole] = useState("IMPLEMENTATION_LEAD");

    const addStep = () => {
        if (!newTitle || !newDesc) return;
        const newStep: SopStep = {
            id: Date.now().toString(),
            title: newTitle,
            description: newDesc,
            order: steps.length + 1,
            estimatedDuration: newDuration,
            role: newRole
        };
        setSteps([...steps, newStep]);
        setNewTitle("");
        setNewDesc("");
        setNewDuration(15);
        setNewRole("IMPLEMENTATION_LEAD");
    };

    const removeStep = (index: number) => {
        const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
        setSteps(updated);
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const updated = [...steps];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

        // Reassign orders
        const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
        setSteps(reordered);
    };

    const handleNext = () => {
        onNext({ steps });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 2: SOP Template</h3>
                <p className="text-sm text-gray-500">Define the Standard Operating Procedure steps for this product.</p>
            </div>

            {/* Add Step Form */}
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="space-y-2 md:col-span-3">
                            <Label>Title</Label>
                            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Step Title" />
                        </div>
                        <div className="space-y-2 md:col-span-4">
                            <Label>Description</Label>
                            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Instructions" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Duration (min)</Label>
                            <Input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <Label>Responsible Role</Label>
                            <div className="flex gap-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="SALES">Sales</option>
                                    <option value="IMPLEMENTATION_LEAD">Lead</option>
                                    <option value="HARDWARE_ENGINEER">Engineer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <Button onClick={addStep} type="button" size="icon" disabled={!newTitle || !newDesc}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Steps List */}
            <div className="space-y-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveStep(index, 'up')} disabled={index === 0}>
                                <ArrowUp className="h-3 w-3" />
                            </Button>
                            <div className="text-center font-bold text-gray-500 w-6">{index + 1}</div>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1}>
                                <ArrowDown className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{step.title}</h4>
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {(step.role || step.requiredRole || 'N/A').replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                        <div className="text-sm text-gray-500 w-20 text-right">
                            {step.estimatedDuration} mins
                        </div>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeStep(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {steps.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No steps added yet. Add at least one step.
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={handleNext} disabled={steps.length === 0}>Next: Report Schema</Button>
            </div>
        </div>
    );
}
