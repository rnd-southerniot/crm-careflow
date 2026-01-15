import React from "react";
import Select, { GroupBase, StylesConfig, components } from "react-select";
import Label, { LabelProps } from "../Label";
import { StateManagerProps } from "../../../node_modules/react-select/dist/declarations/src/useStateManager";
import ErrorText from "../ErrorText";

export type SelectMultiItemProps = { label: string; value: string; miscData?: any };

interface SelectMultiInterface {
  selectMultiProps: StateManagerProps<SelectMultiItemProps, true, GroupBase<SelectMultiItemProps>>;
  labelProps?: LabelProps;
  className?: string;
  errorText?: string;
}

// Custom styles for react-select to match Shadcn aesthetic
const customStyles: StylesConfig<SelectMultiItemProps, true> = {
  control: (provided, state) => ({
    ...provided,
    // minHeight: "38px",
    // borderRadius: "6px",
    // border: state.isFocused
      // ? "1px solid #3b82f6" // Blue focus border like Shadcn
      // : "1px solid #d1d5db", // Gray border
    // boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    // backgroundColor: "white",
    "&:hover": {
      // border: "1px solid #9ca3af", // Darker gray on hover
    },
    padding: "2px"
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "2px 8px"
  }),
  placeholder: (provided) => ({
    ...provided,
    // color: "#9ca3af", // Gray placeholder text
    // fontSize: "14px"
  }),
  input: (provided) => ({
    ...provided,
    // color: "red", // Dark input text
    // fontSize: "14px"
  }),
  menu: (provided) => ({
    ...provided,
    // borderRadius: "6px",
    // border: "1px solid #d1d5db", // Gray border for dropdown
    // boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // Subtle shadow
    // marginTop: "4px",
    // backgroundColor: "white"
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6" // Blue background for selected
      : state.isFocused
        ? "#f3f4f6" // Light gray for hover
        : "white",
    color: state.isSelected ? "white" : "#111827", // White text for selected, dark for others
    padding: "8px 12px",
    // fontSize: "14px",
    "&:active": {
      // backgroundColor: "#2563eb" // Darker blue on click
    }
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#6b7280", // Gray arrow
    "&:hover": {
      color: "#374151" // Darker gray on hover
    }
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "#6b7280", // Gray clear icon
    "&:hover": {
      color: "#374151" // Darker gray on hover
    }
  })
};

// Custom component to hide selected items in the input field
const MultiValue = () => null;

const SelectMulti = ({
  selectMultiProps,
  labelProps,
  className,
  errorText
}: SelectMultiInterface) => {
  const { value, onChange } = selectMultiProps;

  // Handle badge removal
  const handleRemove = (itemToRemove: SelectMultiItemProps) => {
    if (Array.isArray(value)) {
      const newValue = value.filter((item) => item.value !== itemToRemove.value);
      onChange &&
        onChange(newValue, {
          action: "remove-value",
          removedValue: itemToRemove
        });
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      {labelProps && <Label {...labelProps} className="text-sm font-medium" />}
      <Select
        isMulti={true}
        styles={customStyles}
        className="react-select-multi-input"
        classNamePrefix="react-select"
        components={{ MultiValue }} // Hide selected items in input
        {...selectMultiProps}
      />
      {/* Render selected items as badges */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((item: SelectMultiItemProps) => (
            <div
              key={item.value}
              className="flex items-center rounded-md px-2 py-1 text-sm font-medium">
              <span>{item.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {errorText && errorText.length > 0 ? (
        <ErrorText text={errorText} className="text-destructive text-sm" />
      ) : null}
    </div>
  );
};

export default SelectMulti;
