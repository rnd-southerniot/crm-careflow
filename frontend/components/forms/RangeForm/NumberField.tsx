"use client";

import { useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { validateNumberField } from "../utils"; // Assuming validateNumberField is in utils
import { cn } from "@/lib/utils";

interface ValidationRule {
  required?: boolean;
  shouldBePositive?: boolean;
  canBeDecimal?: boolean;
  minValue?: number;
  maxValue?: number;
}

const NumberField = ({
  className,
  label = "Number",
  placeHolder = "Enter Number",
  value = "",
  validationRule = { required: true, shouldBePositive: true, canBeDecimal: true },
  onChange,
  disable = false
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string | number;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
  disable?: boolean;
}) => {
  const [numberValue, setNumberValue] = useState(String(value));
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNumberValue(newValue);

    const validation = validateNumberField({
      value: newValue,
      required: validationRule.required,
      shouldBePositive: validationRule.shouldBePositive,
      canBeDecimal: validationRule.canBeDecimal,
      minValue: validationRule.minValue,
      maxValue: validationRule.maxValue
    });

    setIsValid(validation.status);
    setIsTouched(true);
    onChange(newValue, validation.status);
  };

  const validationResult = validateNumberField({
    value: numberValue,
    required: validationRule.required,
    shouldBePositive: validationRule.shouldBePositive,
    canBeDecimal: validationRule.canBeDecimal,
    minValue: validationRule.minValue,
    maxValue: validationRule.maxValue
  });

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="number" className="mb-2">
        {label}
        {validationRule.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Input
        id="number"
        name="number"
        type="number" // Using text to allow better control over validation
        placeholder={placeHolder}
        disabled={disable ?? false}
        className={cn(!isValid && isTouched && "border-red-500 ring-2 ring-red-500")}
        value={numberValue}
        onChange={handleChange}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="mt-1 text-xs text-red-500">{validationResult.message}</p>
      )}
    </div>
  );
};

export default NumberField;
