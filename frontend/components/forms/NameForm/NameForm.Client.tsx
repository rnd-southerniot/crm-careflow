"use client";

import { useEffect, useState } from "react";
import NameField from "./NameField.Client";
import ShortNameField from "./ShortNameField";
import { cn } from "@/lib/utils";

interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

interface FieldProps {
  label: string;
  placeHolder?: string;
  value?: string;
}

const NameForm = ({
  className,
  nameFieldProps = { label: "Name", placeHolder: "Enter Name", value: "" },
  shortNameFieldProps = { label: "Short Name", placeHolder: "Enter Short Name", value: "" },
  nameValidationRule = { required: true, minLength: 5, maxLength: 50 },
  shortNameValidationRule = { required: true, minLength: 2, maxLength: 15 },
  getData
}: {
  className?: string;
  nameFieldProps?: FieldProps;
  shortNameFieldProps?: FieldProps;
  nameValidationRule?: ValidationRule;
  shortNameValidationRule?: ValidationRule;
  getData: (name: string, shortName: string, isValid: boolean) => void;
}) => {
  const [name, setName] = useState(nameFieldProps.value!);
  const [shortName, setShortName] = useState(shortNameFieldProps.value!);

  const [isNameValid, setIsNameValid] = useState(nameValidationRule.required ? false : true);
  const [isShortNameValid, setIsShortNameValid] = useState(shortNameValidationRule.required ? false : true);

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isNameValid && isShortNameValid) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [isNameValid, isShortNameValid]);

  useEffect(() => {
    setName(nameFieldProps.value!)
  }, [nameFieldProps.value])

  useEffect(() => {
    setShortName(shortNameFieldProps.value!)
  }, [shortNameFieldProps.value])

  useEffect(() => {
    getData(name, shortName, isValid);
  }, [name, shortName, isValid]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <NameField
        label={nameFieldProps.label}
        placeHolder={nameFieldProps.placeHolder}
        value={name}
        validationRule={nameValidationRule}
        onChange={(value, isValid) => {
          setIsNameValid(isValid);
          setName(value);
        }}
      />
      <ShortNameField
        label={shortNameFieldProps.label}
        placeHolder={shortNameFieldProps.placeHolder}
        value={shortName}
        validationRule={shortNameValidationRule}
        onChange={(value, isValid) => {
          setIsShortNameValid(isValid);
          setShortName(value);
        }}
      />
    </div>
  );
};

export default NameForm;
