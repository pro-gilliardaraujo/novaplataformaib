"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FilterDropdownProps {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
}

export function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
}: FilterDropdownProps) {
  const hasSelectedOptions = selectedOptions.size > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 p-0 text-white hover:text-white hover:bg-black/50 ${hasSelectedOptions ? "text-primary" : ""}`}
        >
          <Filter className="h-4 w-4" />
          {hasSelectedOptions && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-white"
            >
              {selectedOptions.size}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filtrar por {title}</span>
          {hasSelectedOptions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onSelect={(e) => {
                e.preventDefault()
                onOptionToggle(option)
              }}
              className="flex items-center gap-2"
            >
              <div
                className={`h-3 w-3 rounded border border-primary ${
                  selectedOptions.has(option) ? "bg-primary" : "bg-transparent"
                }`}
              />
              <span>{option}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 