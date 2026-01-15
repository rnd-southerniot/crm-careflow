"use client";

import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { validateNumberField } from "./utils"; // Assuming validateNumberField is in utils
import { cn } from "@/lib/utils";

interface ValidationRule {
  required?: boolean;
  shouldBePositive?: boolean;
  canBeDecimal?: boolean;
  minValue?: number;
  maxValue?: number;
}

const LevelOrderField = ({
  className,
  label = "Organization Level",
  placeHolder = "Enter Organization Level",
  value = "1",
  validationRule = {
    required: true,
    shouldBePositive: true,
    canBeDecimal: false,
    minValue: 1,
    maxValue: 300
  },
  isDisabled = true,
  onChange
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string | number;
  validationRule?: ValidationRule;
  isDisabled?: boolean;
  onChange: (value: string, isValid: boolean) => void;
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
      <Label htmlFor="number" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="number"
        name="number"
        type="text" // Using text to allow better control over validation
        placeholder={placeHolder}
        className={cn(!isValid && isTouched && "border-destructive ring-destructive ring-2")}
        value={numberValue}
        onChange={handleChange}
        required={validationRule.required}
        disabled={isDisabled}
      />
      {!isValid && isTouched && (
        <p className="text-destructive mt-1 text-xs">{validationResult.message}</p>
      )}
    </div>
  );
};

export default LevelOrderField;
