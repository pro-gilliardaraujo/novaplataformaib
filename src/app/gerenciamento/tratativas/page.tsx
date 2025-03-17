"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TratativasTable } from "@/components/tratativas-table"
import { TratativasDashboard } from "@/components/tratativas/dashboard/index"
import { Tratativa } from "@/types/tratativas"

export default function TratativasPage() {
  const [tratativas, setTratativas] = useState<Tratativa[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTratativas = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('https://iblogistica.ddns.net:3000/api/tratativa/list', {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        const formattedTratativas = result.data.map((item: any) => ({
          ...item,
          status: item.status?.toUpperCase() || 'ENVIADA'
        }))
        setTratativas(formattedTratativas)
      }
    } catch (error) {
      console.error('Error fetching tratativas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTratativas()
  }, [])

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-2">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-black data-[state=active]:text-foreground">
            Lista Detalhada
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-2">
          <TabsContent value="overview" className="h-full m-0">
            <TratativasDashboard tratativas={tratativas} />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0">
            <TratativasTable 
              tratativas={tratativas}
              onTratativaEdited={fetchTratativas}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 