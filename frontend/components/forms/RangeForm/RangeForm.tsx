"use client";

import { useEffect, useState } from "react";
import NumberField from "./NumberField";
import { cn } from "@/lib/utils";

export interface RangeFormValidationRule {
  required?: boolean;
  shouldBePositive?: boolean;
  canBeDecimal?: boolean;
  minValue?: number;
  maxValue?: number;
}

interface FieldProps {
  label: string;
  placeHolder?: string;
  value?: string | number;
}

const RangeForm = ({
  className,
  minFieldProps = { label: "Minimum Value", placeHolder: "Enter Minimum Value", value: "" },
  maxFieldProps = { label: "Maximum Value", placeHolder: "Enter Maximum Value", value: "" },
  minValidationRule = { required: true, shouldBePositive: true, canBeDecimal: true },
  maxValidationRule = { required: true, shouldBePositive: true, canBeDecimal: true },
  getData,
}: {
  className?: string;
  minFieldProps?: FieldProps;
  maxFieldProps?: FieldProps;
  minValidationRule?: RangeFormValidationRule;
  maxValidationRule?: RangeFormValidationRule;
  getData: (minValue: string, maxValue: string, isValid: boolean) => void;
}) => {
  const [minValue, setMinValue] = useState(String(minFieldProps.value ?? ""));
  const [maxValue, setMaxValue] = useState(String(maxFieldProps.value ?? ""));

  const [isMinValid, setIsMinValid] = useState(true); // Individual field validation
  const [isMaxValid, setIsMaxValid] = useState(true);
  const [isRangeValid, setIsRangeValid] = useState(true); // Cross-field validation (min <= max)
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isValid, setIsValid] = useState(false); // Overall form validity

  // Validate the range (min <= max) whenever minValue or maxValue changes
  useEffect(() => {
    if (!isMinValid || !isMaxValid) {
      setIsRangeValid(true); // Don't show range error if individual fields are invalid
      setRangeError(null);
      return;
    }

    const minNum = Number(minValue);
    const maxNum = Number(maxValue);

    if (minValue && maxValue) {
      if (minNum > maxNum) {
        setIsRangeValid(false);
        setRangeError("Minimum value cannot be greater than maximum value");
      } else {
        setIsRangeValid(true);
        setRangeError(null);
      }
    } else {
      setIsRangeValid(true);
      setRangeError(null);
    }
  }, [minValue, maxValue, isMinValid, isMaxValid]);

  // Determine overall form validity
  useEffect(() => {
    if (isMinValid && isMaxValid && isRangeValid) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [isMinValid, isMaxValid, isRangeValid]);

  // Pass data to parent
  useEffect(() => {
    getData(minValue, maxValue, isValid);
  }, [minValue, maxValue, isValid]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="space-y-1">
        <NumberField
          label={minFieldProps.label}
          placeHolder={minFieldProps.placeHolder}
          value={minValue}
          validationRule={minValidationRule}
          onChange={(value, isValid) => {
            setMinValue(value);
            setIsMinValid(isValid);
          }}
        />
        {isMinValid && !isRangeValid && rangeError && (
          <p className="text-red-500 text-xs mt-1">{rangeError}</p>
        )}
      </div>

      <div className="space-y-1">
        <NumberField
          label={maxFieldProps.label}
          placeHolder={maxFieldProps.placeHolder}
          value={maxValue}
          validationRule={maxValidationRule}
          onChange={(value, isValid) => {
            setMaxValue(value);
            setIsMaxValid(isValid);
          }}
        />
        {isMaxValid && !isRangeValid && rangeError && (
          <p className="text-red-500 text-xs mt-1">{rangeError}</p>
        )}
      </div>
    </div>
  );
};

export default RangeForm;