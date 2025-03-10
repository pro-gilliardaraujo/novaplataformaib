"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as Icons from "lucide-react"
import { LucideIcon } from "lucide-react"

interface IconSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (iconName: string) => void
}

export function IconSelectorDialog({
  open,
  onOpenChange,
  onSelectIcon
}: IconSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const iconEntries = Object.entries(Icons)
    .filter(([name, icon]) => 
      name !== "createLucideIcon" && 
      typeof icon === "function" &&
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Pesquisar ícones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-6 gap-4">
              {iconEntries.map(([name, Icon]) => {
                const IconComponent = Icon as LucideIcon
                return (
                  <TooltipProvider key={name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 w-12 p-0"
                          onClick={() => {
                            onSelectIcon(name)
                            onOpenChange(false)
                          }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 