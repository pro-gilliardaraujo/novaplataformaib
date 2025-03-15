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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FilterDropdownProps {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
  sortDirection?: 'asc' | 'desc' | null
  onSort?: (direction: 'asc' | 'desc' | null) => void
  canSort?: boolean
}

export function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
  sortDirection,
  onSort,
  canSort = true,
}: FilterDropdownProps) {
  const hasSelectedOptions = selectedOptions.size > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 p-0 text-white hover:text-white hover:bg-black/50 relative ${hasSelectedOptions ? "text-primary" : ""}`}
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
          {sortDirection && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-2 w-2 text-primary" />
              ) : (
                <ArrowDown className="h-2 w-2 text-primary" />
              )}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Opções para {title}</span>
          {(hasSelectedOptions || sortDirection) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => {
                onClear()
                if (onSort) onSort(null)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canSort && onSort && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span>Ordenar</span>
                {sortDirection && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sortDirection === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onSort('asc')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Crescente
                  {sortDirection === 'asc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort('desc')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Decrescente
                  {sortDirection === 'desc' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}
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