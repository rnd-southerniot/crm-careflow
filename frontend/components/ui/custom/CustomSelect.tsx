"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
  misc?: any;
}

interface CustomSelectProps {
  options: Option[];
  defaultValue?: string;
  onValueChange: (option: Option | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomSelect({
  options,
  defaultValue = "",
  onValueChange,
  placeholder = "Select a Brand",
  disabled = false
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);

  // Sync external changes to defaultValue (e.g., form reset)
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Notify parent of value changes with full option object
  const handleSelect = (selectedValue: string) => {
    const newValue = value === selectedValue ? "" : selectedValue;
    setValue(newValue);
    const selectedOption = options.find((option) => option.value === newValue);
    onValueChange(selectedOption || null);
    setOpen(false); // Keep open for continuous interaction
  };

  return (
    <div className="relative flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}>
            {value ? options.find((option) => option.value === value)?.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {options.map((option, index) => (
                <CommandItem
                  key={index}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => handleSelect(option.value)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-10 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setValue("");
            onValueChange(null);
            setOpen(false);
          }}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
