"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (value: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  // Presets
  const presets = [
    { label: "Personalizado", range: value },
    { label: "Hoje", range: { from: new Date(), to: new Date() } },
    { label: "Ontem", range: { from: addDays(new Date(), -1), to: addDays(new Date(), -1) } },
    { label: "7 Dias Corridos", range: { from: addDays(new Date(), -7), to: new Date() } },
    { label: "30 Dias Corridos", range: { from: addDays(new Date(), -30), to: new Date() } },
  ] as const;

  const sameDay = (d1?: Date, d2?: Date) => d1 && d2 && d1.toDateString() === d2.toDateString();
  const isSameRange = (r1?: DateRange, r2?: DateRange) =>
    r1 && r2 && sameDay(r1.from, r2.from) && sameDay(r1.to, r2.to);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(value.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(value.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-gray-300 shadow-md rounded-md" align="start">
          <div className="flex">
            <div className="flex flex-col p-4 border-r border-gray-200">
              {/* Campos de entrada */}
              <div className="flex flex-col mb-4">
                <div className="flex justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Início</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-[120px]"
                      placeholder="DD/MM/YYYY"
                      value={value?.from ? format(value.from, "dd/MM/yyyy", { locale: ptBR }) : ""}
                      onChange={(e) => {
                        const date = parse(e.target.value, "dd/MM/yyyy", new Date());
                        if (isValid(date)) {
                          onChange?.({ from: date, to: value?.to });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col ml-4">
                    <span className="text-sm font-medium text-gray-700 mb-1">Fim</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-[120px]"
                      placeholder="DD/MM/YYYY"
                      value={value?.to ? format(value.to, "dd/MM/yyyy", { locale: ptBR }) : ""}
                      onChange={(e) => {
                        const date = parse(e.target.value, "dd/MM/yyyy", new Date());
                        if (isValid(date)) {
                          onChange?.({ from: value?.from, to: date });
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Presets */}
                <div className="grid gap-2">
                  {presets.map((opt, index) => {
                    const selected = index === 0 
                      ? value !== undefined && !presets.slice(1).some(p => isSameRange(p.range, value))
                      : isSameRange(value, opt.range);
                    
                    return (
                      <div key={opt.label} className="flex items-center">
                        <input
                          type="radio"
                          id={opt.label}
                          name="preset"
                          checked={selected}
                          onChange={() => {
                            if (index === 0) return; // Personalizado não faz nada quando clicado
                            onChange?.(opt.range);
                          }}
                          className="mr-2 accent-black h-4 w-4"
                          style={{ accentColor: "black" }}
                        />
                        <label htmlFor={opt.label} className="text-gray-700 text-sm">{opt.label}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Botão Limpar */}
              <Button 
                variant="outline" 
                className="mt-auto border border-gray-300 hover:bg-gray-100 text-sm" 
                onClick={() => onChange?.(undefined)}
              >
                Limpar
              </Button>
            </div>
            
            {/* Calendário */}
            <div className="p-4">
              <Calendar
                mode="range"
                defaultMonth={value?.from || new Date()}
                selected={value}
                onSelect={(range)=>{
                  if(range?.from && range.to && range.from.getTime()===range.to.getTime()){
                    onChange?.({from:range.from,to:range.from})
                  }else{
                    onChange?.(range)
                  }
                }}
                numberOfMonths={1}
                locale={ptBR}
                showOutsideDays={false}
                modifiersClassNames={{
                  range_start: "border-2 border-black bg-white text-black rounded-lg",
                  range_end: "border-2 border-black bg-white text-black rounded-lg",
                  range_middle: "bg-gray-200 text-black",
                }}
                classNames={{ 
                  root: "w-full",
                  caption: "flex justify-between items-center mb-2",
                  caption_label: "text-sm font-medium",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
                  table: "w-full border-collapse",
                  head: "flex",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-2",
                  cell: "text-center p-0 relative first:[&>[data-range-start]]:rounded-l-md last:[&>[data-range-end]]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal text-center hover:bg-gray-100",
                  day_selected: "bg-gray-200 text-black font-bold",
                  day_today: "border border-gray-400 text-black font-bold",
                  day_disabled: "text-gray-300",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Alias para compatibilidade
export const DatePickerWithRange = DateRangePicker;