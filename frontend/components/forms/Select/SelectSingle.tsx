import React from "react"
import Select, { GroupBase } from "react-select"
import Label, { LabelProps } from "../Label"
import { StateManagerProps } from "../../../node_modules/react-select/dist/declarations/src/useStateManager"
import ErrorText from "../ErrorText"
import { cn } from "@/lib/utils"

export type SelectSingleItemProps = { label: string; value: string; miscData?: any }

interface SelectSingleInterface {
  selectSingleProps: StateManagerProps<SelectSingleItemProps, false, GroupBase<SelectSingleItemProps>>
  labelProps?: LabelProps
  className?: string
  errorText?: string
}

const SelectSingle = ({ selectSingleProps, labelProps, className, errorText }: SelectSingleInterface) => {
  return (
    <div className={cn("single-select", className)}>
      {labelProps && <Label {...labelProps} />}
      <Select isMulti={false} className="react-select-single-input" {...selectSingleProps} />
      {errorText && errorText.length > 0 ? <ErrorText text={errorText} /> : null}
    </div>
  )
}

export default SelectSingle
