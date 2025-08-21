"use client"

import { useState, useMemo } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface FilterDropdownProps {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (opt: string) => void
  onClear: () => void
}

export function FilterDropdown({ title, options, selectedOptions, onOptionToggle, onClear }: FilterDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Função utilitária para normalizar strings (remove acentos e baixa-casa)
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

  // Filtro avançado: todas as palavras digitadas devem existir (qualquer ordem)
  const filtered = useMemo(() => {
    const tokens = normalize(searchTerm).split(/\s+/).filter(Boolean)

    return options
      .filter((o) => {
        const n = normalize(o)
        return tokens.every((t) => n.includes(t))
      })
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [options, searchTerm])

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-2">
          <span className="truncate max-w-[100px] text-sm">
            {selectedOptions.size ? `${title}: ${selectedOptions.size}` : title}
          </span>
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4" side="bottom" sideOffset={5}>
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          <Input placeholder={`Buscar ${title.toLowerCase()}...`} value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          <div className="space-y-2 max-h-48 overflow-auto">
            {filtered.map((opt)=>(
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox id={opt} checked={selectedOptions.has(opt)} onCheckedChange={()=>onOptionToggle(opt)} />
                <label htmlFor={opt} className="text-sm">{opt}</label>
              </div>
            ))}
            {filtered.length===0 && <p className="text-sm text-muted-foreground">Nenhuma opção</p>}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClear}>Limpar</Button>
            <span className="text-sm text-muted-foreground">{selectedOptions.size} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 