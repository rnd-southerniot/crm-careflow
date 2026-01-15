import {
  ClassNamesConfig,
  GroupBase
} from "../../../../node_modules/react-select/dist/declarations/src";
import CreatableSelect, { CreatableProps } from "react-select/creatable";
import Label, { LabelProps } from "../../Label";
import Icon from "../../../Icon/index";
import Skeleton from "react-loading-skeleton";
import ErrorText from "../../ErrorText";
import { SelectComponents } from "../../../../node_modules/react-select/dist/declarations/src/components";
import { cn } from "@/lib/utils";

export type SelectCreatableMultiValueType = {
  label: string | number;
  value: string | number;
  isDisabled?: boolean;
  isFixed?: boolean;
  miscData?: any;
};

interface SelectCreatableMultiProps
  extends Omit<
    CreatableProps<SelectCreatableMultiValueType, true, GroupBase<SelectCreatableMultiValueType>>,
    "required"
  > {
  isError?: boolean;
  labelProps: Omit<LabelProps, "isRequired">;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
  noItemsFoundText?: string;
  csContainerClassName?: string;
  csClassName?: string;
  csPlaceholderClassName?: string;
  csValueContainerClassName?: string;
  csInputClassName?: string;
  csIndicatorsContainerClassName?: string;
  errorText?: string;
  isRequired?: boolean;
}

/**
 * @description A custom select component with the ability to create new items.
 * @copyright ARITS Limited
 * @author Shafin
 * ([@shafin580](https://www.linkedin.com/in/shafin580/))
 * @coauthor Emran([@emranffl](https://www.linkedin.com/in/emranffl/))
 */

const SelectCreatableMulti = (props: SelectCreatableMultiProps) => {
  const {
    isDisabled,
    isError,
    isLoading,
    isClearable,
    labelProps,
    size = "md",
    noItemsFoundText = "No items found",
    containerClassName,
    csContainerClassName,
    csClassName,
    csPlaceholderClassName,
    csValueContainerClassName,
    csInputClassName,
    csIndicatorsContainerClassName,
    errorText,
    isRequired
  } = props;

  // + custom styles
  const customStyles:
    | ClassNamesConfig<
        SelectCreatableMultiValueType,
        true,
        GroupBase<SelectCreatableMultiValueType>
      >
    | undefined = {
    container: () => cn("!focus-within:border-primary-500", csContainerClassName),
    control: ({ selectProps }) =>
      cn(
        "w-full !rounded-md border !border-slate-200 bg-white text-base font-medium text-slate-700 !hover:border-slate-200 !shadow-none",
        (isDisabled || isError) &&
          "!bg-slate-200 opacity-50 hover:!cursor-not-allowed pointer-events-auto",
        {
          "!min-h-36": size == "sm",
          "!min-h-44": size == "md",
          "!min-h-52": size == "lg"
        },
        selectProps.menuIsOpen && "!border-primary-500 dark:focus-within:!border-primary-600",
        isLoading && "hover:cursor-wait",
        csClassName
      ),
    placeholder: ({ selectProps }) => {
      return cn("!text-slate-400", selectProps.menuIsOpen && "hidden", csPlaceholderClassName);
    },
    valueContainer: () =>
      cn(
        "[all:unset] !flex-nowrap !overflow-x-auto ![display:-webkit-box] scrollbar-hide",
        csValueContainerClassName
      ),
    input: () => cn("!my-auto", isLoading && "!opacity-0 hover:!cursor-wait", csInputClassName),
    indicatorsContainer: () =>
      cn(
        "min-w-32 flex items-center border-l border-slate-200 my-auto px-4",
        {
          "h-20": size == "sm",
          "h-28": size == "md",
          "h-36": size == "lg"
        },
        csIndicatorsContainerClassName
      ),
    multiValue: () =>
      cn("whitespace-nowrap !bg-slate-200 !font-semibold hover:!bg-slate-300 !rounded-full"),
    multiValueLabel: () => cn("!pl-8 -mr-2 !text-slate-500")
  };

  // + custom components
  const customComponents:
    | Partial<
        SelectComponents<
          SelectCreatableMultiValueType,
          true,
          GroupBase<SelectCreatableMultiValueType>
        >
      >
    | undefined = {
    // - custom dropdown indicator with clear value icon
    Placeholder: (props) => {
      return isLoading ? (
        <Skeleton containerClassName={cn("w-8/12 block")} />
      ) : (
        <div className={props.getClassNames("placeholder", props)}>{props.children}</div>
      );
    },
    MultiValueRemove: ({ innerProps }) => {
      return (
        <span
          {...innerProps}
          className={cn(
            "group mr-2 flex items-center hover:cursor-pointer",
            isDisabled && "hover:cursor-not-allowed"
          )}>
          <Icon
            iconName="x"
            iconSize={size == "sm" ? "16" : size == "md" ? "18" : size == "lg" ? "20" : "18"}
            className="stroke-slate-400 transition-colors duration-200 group-hover:stroke-rose-600"
          />
        </span>
      );
    },
    DropdownIndicator: ({ clearValue, selectProps, hasValue }) => (
      <>
        {/* // - clear field values icon */}
        {isClearable && hasValue && (
          <span
            className="-mt-2"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              clearValue();
            }}
            onKeyUp={(e) => {
              if (e.code === "Enter" || e.code === "Space") {
                clearValue();
              }
            }}>
            <Icon
              iconName="x"
              iconSize="19"
              className={cn(
                "stroke-slate-400 transition-colors duration-200 hover:stroke-rose-600",
                {
                  "hover:cursor-not-allowed": isDisabled
                }
              )}
            />
          </span>
        )}
        {/* // - dd indicator */}
        <span role="button" tabIndex={0}>
          <Icon
            iconName={selectProps.menuIsOpen ? "chevron-up" : "chevron-down"}
            className={cn(
              "stroke-slate-400 transition-colors duration-200 hover:cursor-pointer hover:stroke-slate-500",
              isDisabled && "hover:cursor-not-allowed"
            )}
          />
        </span>
      </>
    ),
    ClearIndicator: () => null,
    IndicatorSeparator: () => null,
    LoadingIndicator: () => null,
    LoadingMessage: (props) => {
      return (
        <div className={props.getClassNames("loadingMessage", props)}>
          <ul className="-mt-4 px-8 pb-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <li key={i} className="py-4 transition hover:cursor-wait">
                  <Skeleton
                    style={{
                      width: `${Math.floor(Math.random() * 26) + 50}%`
                    }}
                  />
                </li>
              ))}
          </ul>
        </div>
      );
    }
  };

  return (
    <div
      className={cn("altd-select-creatable-multi relative w-full transition", containerClassName)}>
      <Label isRequired={isRequired} {...labelProps} />
      <CreatableSelect
        placeholder="-- Select/Create --"
        classNamePrefix={"altd-select-creatable-multi"}
        classNames={customStyles}
        components={customComponents}
        isDisabled={isDisabled || isError}
        noOptionsMessage={() => noItemsFoundText}
        maxMenuHeight={220}
        menuPlacement="auto"
        blurInputOnSelect={false}
        closeMenuOnSelect={false}
        required={false}
        isMulti
        tabSelectsValue
        {...props}
      />
      {isError && <ErrorText text={errorText ? errorText : "Error retrieving options"} />}
      {errorText && errorText.length > 0 && <ErrorText text={errorText} />}
    </div>
  );
};

export default SelectCreatableMulti;
