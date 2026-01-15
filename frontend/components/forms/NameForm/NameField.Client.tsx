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

const NameField = ({
  className,
  label = "Name",
  placeHolder = "Enter Name",
  value = "",
  validationRule = { required: true, minLength: 5, maxLength: 50 },
  onChange
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [name, setName] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateName = (value: string, validationRule: ValidationRule) => {
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
    setName(value);
  }, [value]);

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="name" className="mb-2">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="name"
        name="name"
        placeholder={placeHolder}
        className={cn(!isValid && isTouched && "border-destructive ring-destructive ring-2")}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          const validation = validateName(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="text-destructive mt-1 text-xs">
          {validateName(name, validationRule).message}
        </p>
      )}
    </div>
  );
};

export default NameField;
