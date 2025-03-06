"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { NovaTratativaModal } from "@/components/nova-tratativa-modal"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function QuickAccess({ onTratativaAdded }: { onTratativaAdded: () => void }) {
  const [isNovaTratativaModalOpen, setIsNovaTratativaModalOpen] = useState(false)
  const [lastDocumentNumber, setLastDocumentNumber] = useState("999")

  useEffect(() => {
    const fetchLastDocumentNumber = async () => {
      try {
        const { data, error } = await supabase
          .from("tratativas")
          .select("numero_tratativa")
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setLastDocumentNumber(data[0].numero_tratativa)
        }
      } catch (error) {
        console.error("Erro ao buscar o último número de documento:", error)
      }
    }

    fetchLastDocumentNumber()
  }, [])

  const handleTratativaAdded = () => {
    onTratativaAdded()
  }

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
        onTratativaAdded={handleTratativaAdded}
        lastDocumentNumber={lastDocumentNumber}
        mockData={null}
      />
    </div>
  )
}

