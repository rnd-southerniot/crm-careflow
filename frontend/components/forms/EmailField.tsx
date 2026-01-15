"use client";

import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { validateTextInputField } from "./utils";
import { cn } from "@/lib/utils";

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

const EmailField = ({
  className,
  label = "Email",
  placeHolder = "john@gmail.com",
  value = "",
  validationRule = { required: true, minLength: 5, maxLength: 50 },
  onChange,
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [email, setEmail] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (value: string, validationRule: ValidationRule) => {
    const isValid = validateTextInputField({
      value: value,
      isEmail: true,
      minLength: validationRule.minLength,
      maxLength: validationRule.maxLength,
      required: validationRule.required,
    });

    return isValid;
  };

  useEffect(() => {
    setEmail(value)
  }, [value])

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="email" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="email"
        name="email"
        placeholder={placeHolder}
        className={cn(
          "w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          !isValid && isTouched && "border-destructive ring-2 ring-destructive"
        )}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          const validation = validateEmail(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="text-destructive text-xs mt-1">{validateEmail(email, validationRule).message}</p>
      )}
    </div>
  );
};

export default EmailField;