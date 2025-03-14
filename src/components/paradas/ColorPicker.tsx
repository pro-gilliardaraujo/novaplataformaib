import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, Paintbrush } from "lucide-react"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const lightColors = [
  // Row 1 - Cool colors
  'bg-sky-50',
  'bg-cyan-50',
  'bg-blue-50',
  'bg-indigo-50',
  'bg-violet-50',
  // Row 1 - Warm colors
  'bg-yellow-50',
  'bg-orange-50',
  'bg-red-50',
  'bg-rose-50',
  'bg-pink-50',
  // Row 2 - Nature colors
  'bg-emerald-50',
  'bg-green-50',
  'bg-teal-50',
  'bg-lime-50',
  'bg-amber-50',
  // Row 2 - Neutral colors
  'bg-slate-50',
  'bg-zinc-50',
  'bg-stone-50',
  'bg-neutral-50',
  'bg-gray-50',
]

const mediumColors = [
  // Row 1 - Cool colors
  'bg-sky-200',
  'bg-cyan-200',
  'bg-blue-200',
  'bg-indigo-200',
  'bg-violet-200',
  // Row 1 - Warm colors
  'bg-yellow-200',
  'bg-orange-200',
  'bg-red-200',
  'bg-rose-200',
  'bg-pink-200',
  // Row 2 - Nature colors
  'bg-emerald-200',
  'bg-green-200',
  'bg-teal-200',
  'bg-lime-200',
  'bg-amber-200',
  // Row 2 - Neutral colors
  'bg-slate-200',
  'bg-zinc-200',
  'bg-stone-200',
  'bg-neutral-200',
  'bg-gray-200',
]

const darkColors = [
  // Row 1 - Cool colors
  'bg-sky-300',
  'bg-cyan-300',
  'bg-blue-300',
  'bg-indigo-300',
  'bg-violet-300',
  // Row 1 - Warm colors
  'bg-yellow-300',
  'bg-orange-300',
  'bg-red-300',
  'bg-rose-300',
  'bg-pink-300',
  // Row 2 - Nature colors
  'bg-emerald-300',
  'bg-green-300',
  'bg-teal-300',
  'bg-lime-300',
  'bg-amber-300',
  // Row 2 - Neutral colors
  'bg-slate-300',
  'bg-zinc-300',
  'bg-stone-300',
  'bg-neutral-300',
  'bg-gray-300',
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${color} border border-gray-200`}
        >
          <Paintbrush className="h-4 w-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-2">
        <div className="space-y-3">
          {/* Light Colors Section */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">Cores Suaves</div>
            <div className="grid grid-cols-10 gap-1">
              {lightColors.map((bgColor) => (
                <Button
                  key={bgColor}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(bgColor)}
                  className={`h-8 w-8 p-0 ${bgColor} border border-gray-200 ${
                    color === bgColor ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                >
                  {color === bgColor && (
                    <Check className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Medium Colors Section */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">Cores Médias</div>
            <div className="grid grid-cols-10 gap-1">
              {mediumColors.map((bgColor) => (
                <Button
                  key={bgColor}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(bgColor)}
                  className={`h-8 w-8 p-0 ${bgColor} border border-gray-200 ${
                    color === bgColor ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                >
                  {color === bgColor && (
                    <Check className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Dark Colors Section */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">Cores Vibrantes</div>
            <div className="grid grid-cols-10 gap-1">
              {darkColors.map((bgColor) => (
                <Button
                  key={bgColor}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(bgColor)}
                  className={`h-8 w-8 p-0 ${bgColor} border border-gray-200 ${
                    color === bgColor ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                >
                  {color === bgColor && (
                    <Check className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}