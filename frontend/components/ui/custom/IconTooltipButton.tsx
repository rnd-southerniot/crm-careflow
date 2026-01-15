"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type IconSize = "sm" | "md" | "lg";

const sizeMap: Record<IconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6"
};

type IconTooltipButtonProps = {
  tooltip?: string | React.ReactNode;
  icon: React.ReactNode;
  iconSize?: IconSize;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  tooltipClassName?: string;
  disabled?: boolean;
  side?: "top" | "right" | "bottom" | "left";
};

export default function IconTooltipButton({
  tooltip = "Action",
  icon,
  iconSize = "md",
  onClick,
  className = "",
  tooltipClassName = "",
  disabled = false,
  side = "bottom"
}: IconTooltipButtonProps) {
  const button = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={onClick}
      disabled={disabled}>
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any, any>, {
            className:
              `${sizeMap[iconSize]} ${(icon as React.ReactElement<any, any>).props.className ?? ""}`.trim()
          })
        : icon}
    </Button>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Render tooltip only if not disabled */}
          {disabled ? <div>{button}</div> : button}
        </TooltipTrigger>
        {!disabled && (
          <TooltipContent side={side} className={tooltipClassName}>
            {tooltip}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}