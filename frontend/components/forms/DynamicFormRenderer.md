# Dynamic Form Renderer

A React component that dynamically generates forms based on JSON schema definitions. Built for the CRM & Workflow Automation System to handle technical report forms with flexible field types and validation.

## Features

- **Dynamic Field Generation**: Supports text, number, select, textarea, checkbox, and date fields
- **Schema-Based Validation**: Uses Zod for type-safe validation based on field definitions
- **React Hook Form Integration**: Leverages React Hook Form for efficient form state management
- **Flexible Validation Rules**: Supports min/max values, patterns, and custom validation
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Accessible**: Built with proper ARIA attributes and semantic HTML
- **Customizable**: Supports custom styling and initial data

## Supported Field Types

### Text Field
```typescript
{
  id: "field-1",
  name: "deviceSerial",
  label: "Device Serial Number",
  type: "text",
  required: true,
  validation: [
    {
      type: "pattern",
      value: "^[A-Z0-9]{8,12}$",
      message: "Serial number must be 8-12 uppercase letters and numbers"
    }
  ],
  order: 1
}
```

### Number Field
```typescript
{
  id: "field-2",
  name: "signalStrength",
  label: "Signal Strength (dBm)",
  type: "number",
  required: true,
  validation: [
    {
      type: "min",
      value: -120,
      message: "Signal strength must be above -120 dBm"
    },
    {
      type: "max",
      value: -30,
      message: "Signal strength must be below -30 dBm"
    }
  ],
  order: 2
}
```

### Select Field
```typescript
{
  id: "field-3",
  name: "installationLocation",
  label: "Installation Location",
  type: "select",
  required: true,
  options: [
    { value: "indoor", label: "Indoor" },
    { value: "outdoor", label: "Outdoor" }
  ],
  order: 3
}
```

### Textarea Field
```typescript
{
  id: "field-4",
  name: "technicalNotes",
  label: "Technical Notes",
  type: "textarea",
  required: false,
  validation: [
    {
      type: "max",
      value: 500,
      message: "Notes must not exceed 500 characters"
    }
  ],
  order: 4
}
```

### Checkbox Field
```typescript
{
  id: "field-5",
  name: "powerBackupAvailable",
  label: "Power Backup Available",
  type: "checkbox",
  required: false,
  order: 5
}
```

### Date Field
```typescript
{
  id: "field-6",
  name: "installationDate",
  label: "Installation Date",
  type: "date",
  required: true,
  order: 6
}
```

## Usage

### Basic Usage

```tsx
import { DynamicFormRenderer } from '@/components/forms';
import type { ReportSchema } from '@/components/forms/types';

const MyComponent = () => {
  const schema: ReportSchema = {
    id: "report-schema-1",
    productId: "product-1",
    version: 1,
    formStructure: [
      {
        id: "field-1",
        name: "deviceSerial",
        label: "Device Serial Number",
        type: "text",
        required: true,
        order: 1
      }
      // ... more fields
    ]
  };

  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    // Process form data
  };

  return (
    <DynamicFormRenderer
      schema={schema}
      onSubmit={handleSubmit}
    />
  );
};
```

### With Initial Data

```tsx
const initialData = {
  deviceSerial: "ABC123456",
  signalStrength: -65,
  installationLocation: "indoor"
};

<DynamicFormRenderer
  schema={schema}
  onSubmit={handleSubmit}
  initialData={initialData}
/>
```

### With Loading State

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data: Record<string, any>) => {
  setIsSubmitting(true);
  try {
    await submitReport(data);
  } finally {
    setIsSubmitting(false);
  }
};

<DynamicFormRenderer
  schema={schema}
  onSubmit={handleSubmit}
  isLoading={isSubmitting}
/>
```

## Validation Rules

The component supports several validation rule types:

### Min/Max Validation
- **For numbers**: Validates minimum and maximum numeric values
- **For text/textarea**: Validates minimum and maximum character length

### Pattern Validation
- **For text/textarea**: Validates against regular expression patterns
- Useful for format validation (serial numbers, codes, etc.)

### Custom Validation
- Extensible for future custom validation logic
- Currently reserved for future implementation

## Data Transformation

The component automatically transforms form data before submission:

- **Number fields**: Converts string inputs to numbers
- **Date fields**: Converts Date objects to ISO strings
- **Required fields**: Provides default values for missing required fields
- **Optional fields**: Omits undefined/null values for optional fields

## TypeScript Interfaces

```typescript
interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[]; // For select fields
  order: number;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

interface ReportSchema {
  id: string;
  productId: string;
  formStructure: FormField[];
  version: number;
}
```

## Styling

The component uses Tailwind CSS classes and can be customized:

```tsx
<DynamicFormRenderer
  schema={schema}
  onSubmit={handleSubmit}
  className="max-w-2xl mx-auto p-6"
/>
```

## Accessibility

- Proper label associations with `htmlFor` attributes
- ARIA invalid attributes for validation states
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly error messages

## Requirements Validation

This component validates the following requirements from the CRM system:

- **Requirement 4.3**: Dynamic form generation based on ReportSchema
- **Requirement 7.1**: Technical report form rendering with product-specific fields

The component ensures that:
- Forms are generated dynamically from JSONB schema definitions
- All defined field types are supported
- Validation rules are enforced client-side
- Form data is properly structured for backend submission
- User experience is consistent across different product schemas