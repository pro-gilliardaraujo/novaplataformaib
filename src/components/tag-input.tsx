"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  text: string
}

interface TagInputProps {
  placeholder?: string
  tags: string[]
  suggestions: Suggestion[]
  onAddTag: (tag: Suggestion) => void
  onRemoveTag: (index: number) => void
}

export function TagInput({ placeholder, tags, suggestions, onAddTag, onRemoveTag }: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="h-7 px-2">
          {tag}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
            onClick={() => onRemoveTag(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-7 px-2 gap-1",
              tags.length === 0 && "w-[200px]"
            )}
          >
            {placeholder}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {suggestions
                .filter(suggestion => 
                  suggestion.text.toLowerCase().includes(search.toLowerCase())
                )
                .map(suggestion => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.text}
                    onSelect={() => {
                      onAddTag(suggestion)
                      setOpen(false)
                    }}
                  >
                    {suggestion.text}
                  </CommandItem>
                ))
              }
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 