import { useState, useMemo } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface MultiSelectFilterProps {
  placeholder: string
  options: string[]
  value: string[]
  onChange: (val: string[]) => void
  className?: string
}

export function MultiSelectFilter({ placeholder, options, value, onChange, className }: MultiSelectFilterProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return options
      .filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [options, search])

  const toggle = (opt: string) => {
    const exists = value.includes(opt)
    if (exists) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }

  const clear = () => onChange([])

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`w-full justify-between ${className ?? ""}`}> 
          <span className="truncate">{value.length ? `${placeholder}: ${value.length}` : placeholder}</span>
          <Filter className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-4 space-y-4">
        <div className="space-y-4">
          <Input placeholder={`Buscar ${placeholder.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-48 overflow-auto space-y-2">
            {filtered.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox id={opt} checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
                <label htmlFor={opt} className="text-sm">{opt}</label>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma opção</p>}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={clear}>Limpar</Button>
            <span className="text-sm text-muted-foreground">{value.length} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
