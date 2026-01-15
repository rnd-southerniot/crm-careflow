// Shared return type for validation functions
interface ValidationResult {
  status: boolean;
  message: string;
}

// Text Input Field Validation
export interface TextInputFieldInterface {
  value: string;
  required?: boolean; // Made optional with default
  minLength?: number;
  maxLength?: number;
  isEmail?: boolean; // Made optional with default
  alphanumericOnly?: boolean;
  isUrl?: boolean;
}

export const validateTextInputField = ({
  value = "",
  required = true,
  minLength = 2,
  maxLength = 100,
  isEmail = false,
  alphanumericOnly = false,
  isUrl = false
}: TextInputFieldInterface): ValidationResult => {
  const trimmedValue = value.trim();

  if (required && trimmedValue.length === 0) {
    return { status: false, message: "This field is required" };
  }

  // + Normal Text Validation
  if (!isEmail && !alphanumericOnly) {
    let status = true;
    let message = "";

    if (trimmedValue.length < minLength) {
      status = false;
      message = `This field must be at least ${minLength} characters`;
    }
    if (trimmedValue.length > maxLength) {
      status = false;
      message = `This field must not exceed ${maxLength} characters`;
    }

    if (status == false) {
      return { status, message };
    }
  }

  // + Alpha Numeric Validation
  if (!isEmail && alphanumericOnly && trimmedValue.length > 0) {
    let status = true;
    let message = "";

    const hasLetter = /[a-zA-Z]/.test(trimmedValue);
    const hasNumber = /[0-9]/.test(trimmedValue);

    const alphanumericRegex = /^[a-zA-Z0-9\s-]+$/;
    if (trimmedValue.length < minLength) {
      status = false;
      message = `This field must be at least ${minLength} characters`;
    }
    if (trimmedValue.length > maxLength) {
      status = false;
      message = `This field must not exceed ${maxLength} characters`;
    }

    if (!alphanumericRegex.test(trimmedValue)) {
      status = false;
      message = "This field must contain only letters, numbers, spaces, or hyphens";
    }

    if (!hasNumber) {
      status = false;
      message = "This field must contain at least one number";
    }

    if (status == false) {
      return { status, message };
    }
  }

  // + Email Validation
  if (!alphanumericOnly && isEmail && trimmedValue.length > 0) {
    let status = true;
    let message = "";

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (trimmedValue.length < minLength) {
      status = false;
      message = `This field must be at least ${minLength} characters`;
    }
    if (trimmedValue.length > maxLength) {
      status = false;
      message = `This field must not exceed ${maxLength} characters`;
    }
    if (!emailRegex.test(trimmedValue)) {
      status = false;
      message = "Please enter a valid email address";
    }

    if (status == false) {
      return { status, message };
    }
  }

  if (!isEmail && !alphanumericOnly && isUrl && trimmedValue.length > 0) {
    let status = true;
    let message = "";

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    
    if (!urlRegex.test(trimmedValue)) {
      status = false;
      message = "Please enter a valid URL";
    }

    if (status === false) {
      return { status, message };
    }
  }

  return { status: true, message: "" };
};

// Password Field Validation
export interface PasswordFieldInterface {
  value: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  isSimplePassword?: boolean;
}

export const validatePasswordField = ({
  value = "",
  required = true,
  minLength = 6,
  maxLength = 20,
  isSimplePassword = true
}: PasswordFieldInterface): ValidationResult => {
  const trimmedValue = value.trim();

  if (required && trimmedValue.length === 0) {
    return { status: false, message: "This field is required" };
  }

  if (!required && trimmedValue.length === 0) {
    return { status: true, message: "" };
  }

  if (trimmedValue.length < minLength) {
    return {
      status: false,
      message: `Password must be at least ${minLength} characters`
    };
  }

  if (trimmedValue.length > maxLength) {
    return {
      status: false,
      message: `Password must not exceed ${maxLength} characters`
    };
  }

  if (!isSimplePassword) {
    const checks = [
      { regex: /[a-z]/, message: "at least one lowercase letter" },
      { regex: /[A-Z]/, message: "at least one uppercase letter" },
      { regex: /[0-9]/, message: "at least one number" },
      { regex: /[^a-zA-Z0-9]/, message: "at least one special character" }
    ];

    for (const check of checks) {
      if (!check.regex.test(trimmedValue)) {
        return {
          status: false,
          message: `Password must contain ${check.message}`
        };
      }
    }
  }

  return { status: true, message: "" };
};

// Number Field Validation
interface NumberFieldInterface {
  value?: string | number; // Allow both string and number inputs
  required?: boolean;
  shouldBePositive?: boolean;
  canBeDecimal?: boolean;
  minValue?: number; // New: Minimum value constraint
  maxValue?: number; // New: Maximum value constraint
  validationLogic?: (numValue: number) => ValidationResult; // Updated: Pass number instead of string
}

export const validateNumberField = ({
  value = "",
  required = true,
  shouldBePositive = false,
  canBeDecimal = true,
  minValue,
  maxValue,
  validationLogic,
}: NumberFieldInterface): ValidationResult => {
  // Normalize input: Convert to string and trim
  const stringValue = String(value).trim();

  // Check if required and empty
  if (required && stringValue.length === 0) {
    return { status: false, message: "This field is required" };
  }

  // If not required and empty, it's valid
  if (!required && stringValue.length === 0) {
    return { status: true, message: "" };
  }

  // Check for valid number format
  if (!/^-?\d*\.?\d*$/.test(stringValue)) {
    return {
      status: false,
      message: "This field must be a valid number (e.g., 123 or 12.34)",
    };
  }

  // Convert to number
  const numValue = Number(stringValue);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return { status: false, message: "This field must be a valid number" };
  }

  // Check for positive number constraint
  if (shouldBePositive && numValue < 0) {
    return { status: false, message: "This field must be a positive number" };
  }

  // Check for integer constraint
  if (!canBeDecimal && stringValue.includes(".")) {
    return { status: false, message: "This field must be an integer (no decimals)" };
  }

  // Check minimum value
  if (minValue !== undefined && numValue < minValue) {
    return {
      status: false,
      message: `This field must be greater than or equal to ${minValue}`,
    };
  }

  // Check maximum value
  if (maxValue !== undefined && numValue > maxValue) {
    return {
      status: false,
      message: `This field must be less than or equal to ${maxValue}`,
    };
  }

  // Apply custom validation logic if provided
  if (validationLogic) {
    return validationLogic(numValue);
  }

  return { status: true, message: "" };
};
