"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CollegeComboboxProps {
  collegeList: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CollegeCombobox: React.FC<CollegeComboboxProps> = ({
  collegeList,
  value,
  onValueChange,
  placeholder = "Select your college...",
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(value); // Internal state for CommandInput

  React.useEffect(() => {
    // Update internal search value when external value changes
    setSearchValue(value);
  }, [value]);

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue === value ? "" : currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={disabled}
        >
          {value
            ? collegeList.find((college) => college === value)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover text-popover-foreground border-border max-h-60 overflow-y-auto">
        <Command>
          <CommandInput
            placeholder="Search college..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          />
          <CommandEmpty>No college found.</CommandEmpty>
          <CommandGroup>
            {collegeList.map((college) => (
              <CommandItem
                key={college}
                value={college}
                onSelect={() => handleSelect(college)}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                {college}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === college ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CollegeCombobox;