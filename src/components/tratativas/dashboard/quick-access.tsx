"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { NovaTratativaModal } from "../documentos/nova-tratativa-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QuickAccess({ onTratativaAdded }: { onTratativaAdded: () => void }) {
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)

  const handleTratativaAdded = () => {
    onTratativaAdded()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso Rápido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            className="w-full bg-black hover:bg-black/90 text-white"
            onClick={() => setIsNovaTratativaModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Tratativa
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              Ver Todas
            </Button>
            <Button variant="outline" className="w-full">
              Relatórios
            </Button>
          </div>
        </div>
      </CardContent>
      <NovaTratativaModal
        open={isNovaTratativaModalOpen}
        onOpenChange={setIsNovaTratativaModalOpen}
        onTratativaAdded={handleTratativaAdded}
        lastDocumentNumber="999"
      />
    </Card>
  )
} 