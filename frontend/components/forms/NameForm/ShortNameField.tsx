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

const ShortNameField = ({
  className,
  label = "Short Name",
  placeHolder = "Enter Short Name",
  value = "",
  validationRule = { required: true, minLength: 2, maxLength: 15 },
  onChange
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [shortName, setShortName] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateShortName = (value: string, validationRule: ValidationRule) => {
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
    setShortName(value);
  }, [value]);

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="shortName" className="mb-2">
        {label}
        {validationRule.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        id="shortName"
        name="shortName"
        placeholder={placeHolder}
        className={cn(!isValid && isTouched && "border-destructive ring-2 ring-destructive")}
        value={shortName}
        onChange={(e) => {
          setShortName(e.target.value);
          const validation = validateShortName(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="mt-1 text-xs text-destructive">
          {validateShortName(shortName, validationRule).message}
        </p>
      )}
    </div>
  );
};

export default ShortNameField;
