import { cn } from "@/lib/utils";
import { memo } from "react";

export interface LabelProps {
  text?: string;
  color?: string;
  size?: string;
  fontWeight?: string;
  className?: string;
  marginBottom?: boolean;
  isRequired?: boolean;
  htmlFor?: string;
}

/**
 * Label Component
 *
 * @description
 * Company - ARITS Ltd.
/**
 * Interface representing the properties of a label component.
 * @property {string} [text] - The text content of the label.
 * @property {string} [color] - The color of the label text.
 * @property {string} [size] - The size of the label text.
 * @property {string} [className] - The CSS class name to apply to the label.
 * @property {boolean} [marginBottom] - Whether to add a bottom margin to the label.
 * @property {boolean} [isRequired] - Whether the label is for a required field.
 * @property {string} [htmlFor] - The ID of the form element that the label is associated with.
*/

const Label = ({
  text = "Tag / Label",
  color = "text-slate-600",
  fontWeight = "font-normal",
  size = "text-base",
  className = "",
  isRequired = false,
  htmlFor = undefined,
  marginBottom = true
}: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "altd-label inline-block select-none dark:bg-slate-800 dark:text-slate-500",
        marginBottom == true && "mb-4",
        size,
        color,
        fontWeight,
        className
      )}>
      {text}
      {isRequired ? <span className="!text-red-600">&nbsp;*</span> : null}
    </label>
  );
};
export default Label;
