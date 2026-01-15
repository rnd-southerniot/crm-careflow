import { cn } from "@/lib/utils"
import { memo } from "react"

export interface ErrorTextProps {
  text?: string
  className?: string
}

/**
 * Error Text for Form Fields
 *
 * @description
 * Company - ARITS Ltd. 4th Jan 2023
 *
 * This component is used to render an error text on a form field
 * @param {string}  text The error text
 * @param {string}  className The class of the error text
 */

const ErrorText = ({ text, className }: ErrorTextProps) => {
  return (
    <p className={cn("text-destructive text-sm", className)} id="item-error">
      {text}
    </p>
  )
}

export default ErrorText
