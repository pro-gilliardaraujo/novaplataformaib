"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
          size="sm"
          className={`h-8 w-8 p-0 ${hasSelectedOptions ? "text-primary" : "text-white"}`}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Filtrar por {title}</span>
          {hasSelectedOptions && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={onClear}
            >
              Limpar
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="p-2 space-y-1">
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
                className={`h-3 w-3 rounded-sm border ${
                  selectedOptions.has(option)
                    ? "bg-primary border-primary"
                    : "border-gray-300"
                }`}
              />
              <span className="flex-1 text-sm">{option}</span>
              {selectedOptions.has(option) && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Selecionado
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 