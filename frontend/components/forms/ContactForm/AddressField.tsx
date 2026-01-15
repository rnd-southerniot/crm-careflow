"use client";

import { useEffect, useState } from "react";
import { Label } from "../../ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateTextInputField } from "../utils";
import { cn } from "@/lib/utils";

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

const AddressField = ({
  label = "Address",
  placeHolder = "Enter Address Information...",
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
  const [address, setAddress] = useState(value);
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

  useEffect(() => {
    setAddress(value);
  }, [value]);

  return (
    <div className="space-y-1">
      <Label htmlFor="address" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Textarea
        id="address"
        name="address"
        placeholder={placeHolder}
        className={cn(
          "min-h-[100px]",
          !isValid && isTouched && "border-destructive ring-2 ring-destructive"
        )}
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          const validation = validateAddress(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="mt-1 text-xs text-destructive">
          {validateAddress(address, validationRule).message}
        </p>
      )}
    </div>
  );
};

export default AddressField;
