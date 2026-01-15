"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8"
};

type IconTooltipDropdownTriggerProps = {
  tooltip?: string;
  icon: React.ReactNode;
  iconSize?: IconSize;
  className?: string;
  disabled?: boolean;
  withTooltip?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  [key: string]: any;
};

export default function IconTooltipDropdownTrigger({
  tooltip = "Open menu",
  icon,
  iconSize = "md",
  className = "",
  disabled = false,
  withTooltip = true,
  variant = "ghost",
  children,
  align = "end",
  ...props
}: IconTooltipDropdownTriggerProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 p-0 ${className}`}
      disabled={disabled}
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
      {...props}>
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any, any>, {
            className:
              `${sizeMap[iconSize]} ${(icon as React.ReactElement<any, any>).props.className ?? ""}`.trim()
          })
        : icon}
    </Button>
  );

  return (
    <DropdownMenu>
      {withTooltip ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip open={tooltipOpen}>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={align}
        onClick={() => setTooltipOpen(false)} // ensure it's hidden on dropdown action
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
