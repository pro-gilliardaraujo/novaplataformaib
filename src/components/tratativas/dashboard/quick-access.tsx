"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { NovaTratativaModal } from "@/components/nova-tratativa-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QuickAccess({ onTratativaAdded }: { onTratativaAdded: () => void }) {
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)
  const [lastDocumentNumber, setLastDocumentNumber] = useState("1000")

  useEffect(() => {
    // Fetch last document number on mount
    const fetchLastDocumentNumber = async () => {
      try {
        const response = await fetch('http://iblogistica.ddns.net:3000/api/tratativa/list')
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        if (result.status === 'success' && Array.isArray(result.data)) {
          const lastNum = result.data.reduce((max: number, t: any) => {
            const num = parseInt(t.numero_tratativa || "0", 10)
            return num > max ? num : max
          }, 0)
          setLastDocumentNumber(lastNum.toString().padStart(4, "0"))
        }
      } catch (error) {
        console.error('Error fetching last document number:', error)
      }
    }
    fetchLastDocumentNumber()
  }, [])

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
        lastDocumentNumber={lastDocumentNumber}
      />
    </Card>
  )
} 