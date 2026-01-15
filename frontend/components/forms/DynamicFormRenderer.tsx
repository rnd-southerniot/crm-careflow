"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Label from "./Label";
import ErrorText from "./ErrorText";
import type { 
  DynamicFormRendererProps, 
  FormField, 
  ValidationRule 
} from "./types";

// Helper function to create Zod schema from FormField validation rules
const createZodSchema = (fields: FormField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    // Base schema based on field type
    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string();
        break;
      case 'number':
        fieldSchema = z.number();
        break;
      case 'select':
        fieldSchema = z.string();
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'date':
        fieldSchema = z.date();
        break;
      default:
        fieldSchema = z.string();
    }

    // Apply validation rules
    if (field.validation) {
      field.validation.forEach((rule) => {
        switch (rule.type) {
          case 'min':
            if (field.type === 'number') {
              fieldSchema = (fieldSchema as z.ZodNumber).min(rule.value, rule.message);
            } else if (field.type === 'text' || field.type === 'textarea') {
              fieldSchema = (fieldSchema as z.ZodString).min(rule.value, rule.message);
            }
            break;
          case 'max':
            if (field.type === 'number') {
              fieldSchema = (fieldSchema as z.ZodNumber).max(rule.value, rule.message);
            } else if (field.type === 'text' || field.type === 'textarea') {
              fieldSchema = (fieldSchema as z.ZodString).max(rule.value, rule.message);
            }
            break;
          case 'pattern':
            if (field.type === 'text' || field.type === 'textarea') {
              fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(rule.value), rule.message);
            }
            break;
        }
      });
    }

    // Handle required fields
    if (!field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = fieldSchema.optional();
      } else if (field.type === 'date') {
        fieldSchema = fieldSchema.optional();
      } else if (field.type === 'number') {
        fieldSchema = fieldSchema.optional();
      } else {
        fieldSchema = (fieldSchema as z.ZodString).optional();
      }
    }

    schemaObject[field.name] = fieldSchema;
  });

  return z.object(schemaObject);
};

// Helper function to transform form data for submission
const transformFormData = (data: Record<string, any>, fields: FormField[]) => {
  const transformed: Record<string, any> = {};

  fields.forEach((field) => {
    const value = data[field.name];
    
    if (value !== undefined && value !== null) {
      switch (field.type) {
        case 'number':
          // Convert string input to number if needed
          transformed[field.name] = typeof value === 'string' ? parseFloat(value) : value;
          break;
        case 'date':
          // Ensure date is properly formatted
          transformed[field.name] = value instanceof Date ? value.toISOString() : value;
          break;
        default:
          transformed[field.name] = value;
      }
    } else if (field.required) {
      // Set default values for required fields if missing
      switch (field.type) {
        case 'checkbox':
          transformed[field.name] = false;
          break;
        case 'number':
          transformed[field.name] = 0;
          break;
        default:
          transformed[field.name] = '';
      }
    }
  });

  return transformed;
};

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  schema,
  onSubmit,
  initialData = {},
  isLoading = false,
  className
}) => {
  // Sort fields by order
  const sortedFields = [...schema.formStructure].sort((a, b) => a.order - b.order);

  // Create Zod validation schema
  const validationSchema = React.useMemo(() => createZodSchema(sortedFields), [sortedFields]);

  // Initialize form with React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData
  });

  // Handle form submission
  const onFormSubmit = (data: Record<string, any>) => {
    const transformedData = transformFormData(data, sortedFields);
    onSubmit(transformedData);
  };

  // Render individual field based on type
  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label
              text={field.label}
              isRequired={field.required}
              htmlFor={fieldId}
            />
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Input
                  id={fieldId}
                  type="text"
                  placeholder={field.label}
                  {...controllerField}
                  aria-invalid={!!error}
                />
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label
              text={field.label}
              isRequired={field.required}
              htmlFor={fieldId}
            />
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Input
                  id={fieldId}
                  type="number"
                  placeholder={field.label}
                  {...controllerField}
                  onChange={(e) => {
                    const value = e.target.value;
                    controllerField.onChange(value === '' ? undefined : parseFloat(value));
                  }}
                  value={controllerField.value || ''}
                  aria-invalid={!!error}
                />
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label
              text={field.label}
              isRequired={field.required}
              htmlFor={fieldId}
            />
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Textarea
                  id={fieldId}
                  placeholder={field.label}
                  {...controllerField}
                  aria-invalid={!!error}
                />
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label
              text={field.label}
              isRequired={field.required}
              htmlFor={fieldId}
            />
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Select
                  value={controllerField.value || ''}
                  onValueChange={controllerField.onChange}
                >
                  <SelectTrigger id={fieldId} aria-invalid={!!error}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={fieldId}
                    checked={controllerField.value || false}
                    onCheckedChange={controllerField.onChange}
                    aria-invalid={!!error}
                  />
                  <Label
                    text={field.label}
                    isRequired={field.required}
                    htmlFor={fieldId}
                    marginBottom={false}
                  />
                </div>
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label
              text={field.label}
              isRequired={field.required}
              htmlFor={fieldId}
            />
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={fieldId}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !controllerField.value && "text-muted-foreground",
                        error && "border-destructive"
                      )}
                      aria-invalid={!!error}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {controllerField.value ? (
                        format(controllerField.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={controllerField.value}
                      onSelect={controllerField.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {error && <ErrorText text={error.message as string} />}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={cn("space-y-6", className)}>
      {sortedFields.map(renderField)}
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
};

export default DynamicFormRenderer;