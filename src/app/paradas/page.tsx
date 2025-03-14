"use client"

import { ParadasProvider } from "@/contexts/ParadasContext"
import { SeletorFrotas } from "@/components/paradas/SeletorFrotas"

export default function ParadasPage() {
  return (
    <ParadasProvider>
      <div className="container py-8">
        <SeletorFrotas />
      </div>
    </ParadasProvider>
  )
} 