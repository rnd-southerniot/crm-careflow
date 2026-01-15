"use client";

import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CountryData } from "react-phone-input-2";
import { isValidPhoneNumber, CountryCode } from "libphonenumber-js";

interface PhoneInputProps {
  label?: string;
  required?: boolean;
  value?: string;
  onChange: (
    value: string,
    country: CountryData,
    e: React.ChangeEvent<HTMLInputElement>,
    isValid: boolean
  ) => void;
  error?: string;
  className?: string;
  placeholder?: string;
}

export default function PhoneNumberInputField({
  label = "Phone Number",
  required = true,
  value = "",
  onChange,
  error: externalError,
  className,
  placeholder = "Enter phone number"
}: PhoneInputProps) {
  const [phoneValue, setPhoneValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const [countryData, setCountryData] = useState<CountryData | null>(null);

  // + Function To Validation Phone Number
  const validatePhoneNumber = (
    phoneNumber: string,
    countryCode: CountryCode,
    required: boolean
  ): { status: boolean; message: string } => {
    if (!required && !phoneValue) {
      return { status: true, message: "" };
    } else {
      if (phoneNumber?.trim().length === 0) {
        return { status: false, message: "Phone number is required" };
      } else {
        if (isValidPhoneNumber(phoneNumber, countryCode)) {
          return { status: true, message: "" };
        } else {
          return { status: false, message: "Invalid phone number!" };
        }
      }
    }
  };

  // Error message generator
  const getErrorMessage = () => {
    if (externalError) return externalError; // Prioritize external error
    if (!touched || isValid) return null;

    if (!phoneValue && required) {
      return "Phone number is required";
    }

    const valid = validatePhoneNumber(
      phoneValue,
      countryData?.countryCode.toLocaleUpperCase() as CountryCode,
      required
    );
    if (valid.status == false) {
      return valid.message;
    }
  };

  // + Function To Track Changes in input field
  const handleChange = (
    val: string,
    country: CountryData,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPhoneValue(val);
    setTouched(true);
    setCountryData(country);

    const valid = validatePhoneNumber(
      val,
      country.countryCode.toLocaleUpperCase() as CountryCode,
      required
    );
    setIsValid(valid.status);

    onChange(val, country, e, valid.status); // Pass validation status
  };

  useEffect(() => {
    setPhoneValue(value);
  }, [value]);

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <PhoneInput
          country={"bd"}
          value={phoneValue}
          onChange={handleChange}
          enableSearch={true}
          searchPlaceholder="Search countries..."
          inputProps={{
            id: "phone-input",
            required,
            placeholder
          }}
          containerClass={cn("w-full", !isValid && touched && "ring-2 ring-destructive")}
          inputClass={cn(
            "w-full h-10 pl-12 pr-4 rounded-md border border-gray-300 text-sm text-gray-900 placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed"
          )}
          buttonClass={cn(
            "absolute left-0 top-0 h-10 rounded-l-md border border-gray-300 bg-gray-100",
            "flex items-center justify-center px-3"
          )}
          dropdownClass="border border-gray-300 rounded-md shadow-md max-h-[200px] overflow-y-auto"
        />

        <style jsx global>{`
          .react-tel-input .form-control {
            height: 40px !important;
            width: 100% !important;
          }

          .react-tel-input .flag-dropdown {
            height: 40px !important;
            border-right: none !important;
            background-color: transparent !important;
          }

          .react-tel-input .selected-flag {
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
          }

          .react-tel-input .country-list {
            max-height: 200px !important;
            overflow-y: auto !important;
            width: 300px !important;
            margin-top: 0 !important;
            top: 40px !important;
            left: 0 !important;
            z-index: 50 !important;
          }

          .react-tel-input .search-box {
            width: 100% !important;
            margin-left: 0 !important;
            padding: 8px !important;
          }

          .react-tel-input .search-box input {
            width: 100% !important;
            padding: 6px 8px !important;
          }
        `}</style>
      </div>

      {getErrorMessage && <p className="text-destructive text-sm">{getErrorMessage()}</p>}
    </div>
  );
}
