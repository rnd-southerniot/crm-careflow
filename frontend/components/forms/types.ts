// Types for the Dynamic Form Renderer based on the CRM system design

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[]; // For select fields
  order: number;
}

export interface ReportSchema {
  id: string;
  productId: string;
  formStructure: FormField[];
  version: number;
}

export interface DynamicFormRendererProps {
  schema: ReportSchema;
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  isLoading?: boolean;
  className?: string;
}

// Type for the transformed form data that gets submitted
export type FormSubmissionData = Record<string, any>;