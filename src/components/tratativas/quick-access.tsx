"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { NovaTratativaModal } from "./nova-tratativa-modal"

interface QuickAccessProps {
  onTratativaAdded: () => void
}

export function QuickAccess({ onTratativaAdded }: QuickAccessProps) {
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)

  return (
    <div className="w-full">
      <Button
        className="w-full bg-black hover:bg-black/90 text-white"
        onClick={() => setIsNovaTratativaModalOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Nova Tratativa
      </Button>
      <NovaTratativaModal
        open={isNovaTratativaModalOpen}
        onOpenChange={setIsNovaTratativaModalOpen}
        onTratativaAdded={onTratativaAdded}
      />
    </div>
  )
} 