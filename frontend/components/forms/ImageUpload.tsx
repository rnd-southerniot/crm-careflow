"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { X, Upload, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  className?: string;
  value?: File | null;
  onChange?: (file: File | null, isValid: boolean) => void;
  disabled?: boolean;
  allowedTypes?: string[];
  maxSizeMB?: number;
  required?: boolean;
}

export function ImageUpload({
  className,
  value,
  onChange,
  disabled = false,
  allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    "image/avif",
    "image/heic",
    "image/x-icon"
  ],
  maxSizeMB = 5,
  required = true
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);

    if (!e.target.files || e.target.files.length === 0) {
      onChange?.(null, required ? false : true);
      return;
    }

    const file = e.target.files[0];

    if (!allowedTypes.includes(file.type)) {
      setError(
        `Invalid file type. Allowed types: ${allowedTypes.map((type) => type.replace("image/", "")).join(", ")}`
      );
      onChange?.(null, required ? false : true);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      onChange?.(null, required ? false : true);
      return;
    }

    // onChange?.(file, required ? true : false);
    onChange?.(file, true);
  };

  const handleRemove = () => {
    onChange?.(null, required ? false : true);
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "rounded-lg border-2 border-dashed p-6 transition-colors",
          "flex flex-col items-center justify-center text-center",
          preview ? "h-auto" : "h-48",
          error ? "border-destructive bg-red-50" : "border-muted-foreground hover:border-gray-400",
          disabled && "cursor-not-allowed bg-gray-100 opacity-50"
        )}>
        {preview ? (
          <div className="relative w-full">
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className="mx-auto max-h-40 rounded-md object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
              onClick={handleRemove}
              disabled={disabled}>
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="rounded-full p-3">
                <Upload className="size-6" />
              </div>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  Drag & drop an image or click to browse
                </p>
                <p className="text-xs">
                  Allowed types: {allowedTypes.map((type) => type.replace("image/", "")).join(", ")}
                </p>
                <p className="text-xs">Max size: {maxSizeMB}MB</p>
              </div>
            </div>
            <input
              type="file"
              accept={allowedTypes.join(",")}
              onChange={handleFileChange}
              disabled={disabled}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <FileWarning className="h-4 w-4" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
