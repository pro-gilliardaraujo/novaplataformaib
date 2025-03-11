"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRightIcon } from "@heroicons/react/24/outline"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { IconContext as PhosphorIconContext } from "phosphor-react"
import {
  Article,
  BookOpen,
  Calendar,
  ChartBar,
  ChartLine,
  ChartPie,
  Clock,
  Gear,
  House,
  List,
  MagnifyingGlass,
  Note,
  PencilLine,
  Plus,
  Table,
  User,
  Users,
  X
} from "phosphor-react"

const phosphorIcons = {
  Article,
  BookOpen,
  Calendar,
  ChartBar,
  ChartLine,
  ChartPie,
  Clock,
  Gear,
  House,
  List,
  MagnifyingGlass,
  Note,
  PencilLine,
  Plus,
  Table,
  User,
  Users,
  X
}

type IconLibrary = "heroicons" | "remixicon" | "boxicons" | "phosphor" | "fontawesome" | "material" | "ionicons"
type HeroIconStyle = "outline" | "solid" | "mini"
type BoxIconStyle = "regular" | "solid" | "logos"
type PhosphorStyle = "regular" | "bold" | "duotone" | "fill" | "light" | "thin"

interface IconSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (iconName: string) => void
  itemName: string
  itemType: "categoria" | "página"
  parentName?: string
}

export function IconSelectorDialog({
  open,
  onOpenChange,
  onSelectIcon,
  itemName,
  itemType,
  parentName
}: IconSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibrary>("heroicons")
  const [selectedStyle, setSelectedStyle] = useState<string>("outline")

  const libraries = [
    { value: "heroicons", label: "Heroicons" },
    { value: "remixicon", label: "Remix Icons" },
    { value: "boxicons", label: "Box Icons" },
    { value: "phosphor", label: "Phosphor Icons" },
    { value: "fontawesome", label: "Font Awesome" },
    { value: "material", label: "Material Icons" },
    { value: "ionicons", label: "Ionicons" }
  ]

  const getStyleOptions = (library: IconLibrary) => {
    switch (library) {
      case "heroicons":
        return [
          { value: "outline", label: "Outline" },
          { value: "solid", label: "Solid" },
          { value: "mini", label: "Mini" }
        ]
      case "boxicons":
        return [
          { value: "regular", label: "Regular" },
          { value: "solid", label: "Solid" },
          { value: "logos", label: "Logos" }
        ]
      case "phosphor":
        return [
          { value: "regular", label: "Regular" },
          { value: "bold", label: "Bold" },
          { value: "duotone", label: "Duotone" },
          { value: "fill", label: "Fill" },
          { value: "light", label: "Light" },
          { value: "thin", label: "Thin" }
        ]
      default:
        return [{ value: "default", label: "Default" }]
    }
  }

  const getIconSet = () => {
    switch (selectedLibrary) {
      case "heroicons":
        switch (selectedStyle as HeroIconStyle) {
          case "solid":
            return HeroIconsSolid
          case "mini":
            return HeroIconsMini
          default:
            return HeroIconsOutline
        }
      case "remixicon":
        return Ri
      case "boxicons":
        return Bi
      case "phosphor":
        return phosphorIcons
      case "fontawesome":
        return Fa
      case "material":
        return Md
      case "ionicons":
        return Io
      default:
        return HeroIconsOutline
    }
  }

  const iconEntries = useMemo(() => {
    const iconSet = getIconSet()
    return Object.entries(iconSet)
      .filter(([name]) => 
        name !== "createLucideIcon" && 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort(([a], [b]) => a.localeCompare(b))
  }, [selectedLibrary, selectedStyle, searchTerm])

  const handleSelectIcon = (iconName: string) => {
    const formattedIconName = `${selectedLibrary}/${selectedStyle}/${iconName}`
    onSelectIcon(formattedIconName)
    onOpenChange(false)
  }

  const renderIcon = (Icon: any, name: string) => {
    if (selectedLibrary === "phosphor") {
      return (
        <PhosphorIconContext.Provider
          value={{
            size: 20,
            weight: selectedStyle as any,
            mirrored: false,
          }}
        >
          <Icon />
        </PhosphorIconContext.Provider>
      )
    }

    return <Icon className="h-5 w-5" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {itemType === "página" && parentName && (
              <>
                <span>{parentName}</span>
                <ChevronRightIcon className="h-4 w-4" />
              </>
            )}
            <span className="font-medium text-foreground">{itemName}</span>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="flex gap-2 mb-4">
            <Select value={selectedLibrary} onValueChange={(value) => {
              setSelectedLibrary(value as IconLibrary)
              setSelectedStyle(getStyleOptions(value as IconLibrary)[0].value)
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Biblioteca" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map(lib => (
                  <SelectItem key={lib.value} value={lib.value}>
                    {lib.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estilo" />
              </SelectTrigger>
              <SelectContent>
                {getStyleOptions(selectedLibrary).map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Pesquisar ícones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-12 gap-1">
              {iconEntries.map(([name, Icon]) => (
                <TooltipProvider key={name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-10 p-0"
                        onClick={() => handleSelectIcon(name)}
                      >
                        {renderIcon(Icon, name)}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 