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

const URLField = ({
  className,
  label = "Website",
  placeHolder = "Enter Website Url..",
  value = "",
  validationRule = { required: true, minLength: 0, maxLength: 500 },
  onChange
}: {
  className?: string;
  label?: string;
  placeHolder?: string;
  value?: string;
  validationRule?: ValidationRule;
  onChange: (value: string, isValid: boolean) => void;
}) => {
  const [url, setUrl] = useState(value);
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateUrl = (value: string, validationRule: ValidationRule) => {
    const isValid = validateTextInputField({
      value: value,
      isEmail: false,
      isUrl: true,
      minLength: validationRule.minLength,
      maxLength: validationRule.maxLength,
      required: validationRule.required
    });

    return isValid;
  };

  useEffect(() => {
    setUrl(value);
  }, [value]);

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor="website" className="text-sm font-medium">
        {label}
        {validationRule.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="website"
        name="website"
        placeholder={placeHolder}
        className={cn(!isValid && isTouched && "border-destructive ring-destructive ring-2")}
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          const validation = validateUrl(e.target.value, validationRule);
          setIsValid(validation.status);
          setIsTouched(true);
          onChange(e.target.value, validation.status);
        }}
        required={validationRule.required}
      />
      {!isValid && isTouched && (
        <p className="text-destructive mt-1 text-xs">{validateUrl(url, validationRule).message}</p>
      )}
    </div>
  );
};

export default URLField;
