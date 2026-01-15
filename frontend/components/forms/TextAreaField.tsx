"use client";

import { useState } from "react";
import { Label } from "../ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateTextInputField } from "./utils";
import { cn } from "@/lib/utils";

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

const TextAreaField = ({
  label = "Description",
  placeHolder = "Enter Description...",
  value = "",
  validationRule = { required: true, minLength: 8, maxLength: 1000 },
  onChange
}: {
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [stateValue, setStateValue] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateAddress = (value: string, validationRule: ValidationRule) => {
    const isValid = validateTextInputField({
      value: value,
      isEmail: false,
      minLength: validationRule.minLength,
      maxLength: validationRule.maxLength,
      required: validationRule.required
    });

    return isValid;
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="address" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id="address"
        name="address"
        placeholder={placeHolder}
        className={cn(
          "min-h-[100px]",
          !isValid && isTouched && "border-destructive ring-destructive ring-2"
        )}
        value={stateValue}
        onChange={(e) => {
          setStateValue(e.target.value);
          const validation = validateAddress(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="text-destructive mt-1 text-xs">
          {validateAddress(stateValue, validationRule).message}
        </p>
      )}
    </div>
  );
};

export default TextAreaField;
