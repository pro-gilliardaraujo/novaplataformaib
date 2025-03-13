import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const colors = [
  // Linha 1 - Tons de azul
  'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500',
  // Linha 2 - Tons de verde
  'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500',
  // Linha 3 - Tons de amarelo/laranja
  'bg-yellow-100', 'bg-yellow-200', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400',
  // Linha 4 - Tons de vermelho
  'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500',
  // Linha 5 - Tons de roxo
  'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500',
  // Linha 6 - Tons de rosa
  'bg-pink-100', 'bg-pink-200', 'bg-pink-300', 'bg-pink-400', 'bg-pink-500',
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`w-6 h-6 rounded-full p-0 ${color} border border-gray-300 hover:opacity-80 transition-opacity`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2">
        <div className="grid grid-cols-5 gap-1">
          {colors.map((bgColor, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-10 h-10 rounded-md p-0 ${bgColor} hover:opacity-80 transition-opacity
                ${color === bgColor ? 'ring-2 ring-black ring-offset-2' : ''}`}
              onClick={() => onChange(bgColor)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 