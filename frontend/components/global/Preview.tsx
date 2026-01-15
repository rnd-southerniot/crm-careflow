"use client";

import type React from "react";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewSize = "small" | "medium" | "large" | "xl";

interface PreviewProps {
  children: React.ReactNode;
  smallPreview?: React.ReactNode;
  enlargeSize?: PreviewSize;
  className?: string;
  previewText?: string;
}

const sizeClasses = {
  small: "max-w-md max-h-96",
  medium: "max-w-2xl max-h-[600px]",
  large: "max-w-4xl max-h-[800px]",
  xl: "max-w-8xl max-h-[900px]"
};

export default function Preview({
  children,
  smallPreview,
  enlargeSize = "medium",
  className,
  previewText
}: PreviewProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const handleEnlarge = () => {
    setIsEnlarged(true);
  };

  const handleClose = () => {
    setIsEnlarged(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <>
      {/* Small Preview */}
      <div
        className={cn(
          "group bg-background absolute cursor-pointer overflow-hidden rounded-4xl border-2 ring-8 shadow-xl ring-border",
          className
        )}
        onClick={handleEnlarge}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleEnlarge();
          }
        }}
        aria-label="Click to enlarge preview">
        <div className="h-full w-full">{smallPreview || children}</div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex scale-500 items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-md bg-black/70 px-3 py-1 text-sm font-medium text-white">
            {previewText || "Click to enlarge"}
          </span>
        </div>
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged preview">
          <div
            className={cn(
              "bg-background relative h-full w-full overflow-hidden rounded-lg shadow-2xl",
              sizeClasses[enlargeSize]
            )}>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background absolute top-2 right-2 z-10"
              onClick={handleClose}
              aria-label="Close enlarged preview">
              <X className="h-4 w-4" />
            </Button>

            {/* Enlarged Content */}
            <div className="h-full w-full overflow-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
