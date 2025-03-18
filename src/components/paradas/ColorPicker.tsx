import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Paintbrush } from "lucide-react"
import { GithubPicker, ChromePicker } from 'react-color'
import { RGBColor } from 'react-color'

interface ColorPickerProps {
  color: string | null
  onChange: (color: string | null) => void
}

// Extended preset colors array for GithubPicker (8 columns x 4 rows)
const presetColors = [
  // Row 1 - Reds to Purples
  '#FF0000', '#FF4D4D', '#FF9999', '#8B0000', '#800020', '#4B0082', '#663399', '#800080',
  // Row 2 - Blues
  '#0000FF', '#4169E1', '#87CEEB', '#00008B', '#000080', '#191970', '#7B68EE', '#6A5ACD',
  // Row 3 - Greens
  '#00FF00', '#90EE90', '#98FB98', '#006400', '#228B22', '#32CD32', '#3CB371', '#2E8B57',
  // Row 4 - Yellows, Oranges, Browns
  '#FFFF00', '#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B', '#D2691E', '#8B4513'
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [tempColor, setTempColor] = useState<RGBColor>(() => {
    // Convert initial color to RGB format
    if (!color) return { r: 255, g: 255, b: 255, a: 1 }
    
    // Handle rgba format
    const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/)
    if (rgba) {
      return {
        r: parseInt(rgba[1]),
        g: parseInt(rgba[2]),
        b: parseInt(rgba[3]),
        a: rgba[4] ? parseFloat(rgba[4]) : 1
      }
    }
    
    // Handle hex format
    const hex = color.replace('#', '')
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
      a: 1
    }
  })

  const handleColorChange = (colorResult: any) => {
    const newColor = colorResult.rgb
    setTempColor(newColor)
    onChange(`rgba(${newColor.r}, ${newColor.g}, ${newColor.b}, ${newColor.a})`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 border border-gray-200"
          style={{ 
            background: color || 'white',
            transition: 'background-color 0.2s ease'
          }}
        >
          <Paintbrush className="h-4 w-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3">
        <div className="space-y-3">
          {/* Preset Colors using GithubPicker */}
          <div>
            <GithubPicker
              width="214px"
              colors={presetColors}
              color={`rgba(${tempColor.r}, ${tempColor.g}, ${tempColor.b}, ${tempColor.a})`}
              onChange={handleColorChange}
              triangle="hide"
            />
          </div>

          {/* Custom Color Selection using ChromePicker */}
          <div className="[&_div[style*='margin-left: -6px']]:hidden [&_input[value^='#']]:hidden [&_label]:hidden [&_svg]:hidden">
            <ChromePicker
              color={tempColor}
              onChange={handleColorChange}
              styles={{
                default: {
                  picker: {
                    width: '214px',
                    boxShadow: 'none',
                    border: 'none',
                    paddingBottom: '6px'
                  }
                }
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}