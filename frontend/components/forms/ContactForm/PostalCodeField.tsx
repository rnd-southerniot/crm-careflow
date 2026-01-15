"use client";

import { useEffect, useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { validateTextInputField } from "../utils";
import { cn } from "@/lib/utils";

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

const PostalCodeField = ({
  label = "Postal Code",
  placeHolder = "Enter Postal Code...",
  value = "",
  validationRule = { required: true, minLength: 4, maxLength: 50 },
  onChange
}: {
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [postalCodeValue, setPostalCodeValue] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validatePostalCode = (value: string, validationRule: ValidationRule) => {
    const isValid = validateTextInputField({
      value: value,
      isEmail: false,
      alphanumericOnly: true,
      minLength: validationRule.minLength,
      maxLength: validationRule.maxLength,
      required: validationRule.required
    });

    return isValid;
  };

  useEffect(() => {
    setPostalCodeValue(value);
  }, [value]);

  return (
    <div className="space-y-1">
      <Label htmlFor="postalCode" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="postalCode"
        name="postalCode"
        placeholder={placeHolder}
        className={cn(!isValid && isTouched && "border-destructive ring-destructive ring-2")}
        value={postalCodeValue}
        onChange={(e) => {
          setPostalCodeValue(e.target.value);
          const validation = validatePostalCode(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="text-destructive mt-1 text-xs">
          {validatePostalCode(postalCodeValue, validationRule).message}
        </p>
      )}
    </div>
  );
};

export default PostalCodeField;
