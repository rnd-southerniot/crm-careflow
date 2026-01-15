import { memo } from "react"
import { ICON_NAMES } from "./names"
import { cn } from "@/lib/utils"

export interface IconProps {
  iconName?: (typeof ICON_NAMES)[number]
  iconSize?: string
  iconColor?: string
  iconStrokeWidth?: string
  isIconDisabled?: boolean
  title?: string
  variant?: "stroke" | "solid" | "filetype"
  className?: string
}

/**
 * Icon Component
 *
 * @description
 * Company - ARITS Ltd.
 * This component is used to render an icon from the sprite file.
 * The iconName prop is used to determine which icon to render.
 * Developed using the Untitled UI Icons library.
 *
 * @param {string} iconName Use icon sprite file: untitled-ui-sprite.svg
 * @param {string} iconSize Use pixel values
 * @param {string} iconColor Use hex colors
 * @param {string} iconStroke Use pixel values
 * @param {boolean} isIconDisabled Use this prop to disable the icon
 * @param {string} title Set the html title of the icon
 * @param {string} className Additional classes to add to SVG element
 */

const Icon = memo(function Icon({
  iconName = "heart",
  iconSize = "20px",
  iconColor = "currentColor",
  iconStrokeWidth = "2",
  isIconDisabled,
  title = "",
  variant = "stroke",
  className,
}: IconProps) {
  return (
    <svg
      className={cn(
        "box-content inline-flex shrink-0 grow-0 rounded",
        {
          "stroke-slate-300 hover:cursor-not-allowed hover:stroke-slate-300":
            variant == "stroke" && isIconDisabled,
          "fill-slate-300 hover:cursor-not-allowed hover:stroke-slate-300":
            variant == "solid" && isIconDisabled,
        },
        className
      )}
      width={iconSize}
      height={iconSize}
      fill={variant == "solid" ? iconColor : "none"}
      stroke={variant == "stroke" ? iconColor : "none"}
      strokeWidth={variant == "stroke" ? iconStrokeWidth : "0"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}

      <use
        xlinkHref={`/icons/untitled-ui-sprite.svg#${
          variant == "solid" ? "sld-" : variant == "filetype" ? "" : ""
        }${iconName}`}
      />
    </svg>
  )
})
export default Icon
