"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import * as Pi from "phosphor-react"
import { IconContext as PhosphorIconContext } from "phosphor-react"

type IconLibrary = "heroicons" | "remixicon" | "boxicons" | "phosphor" | "fontawesome" | "material" | "ionicons"
type HeroIconStyle = "outline" | "solid" | "mini"
type BoxIconStyle = "regular" | "solid" | "logos"
type PhosphorStyle = "regular" | "bold" | "duotone" | "fill" | "light" | "thin"

interface IconSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (icon: string) => void
  itemName: string
  itemType: "página" | "categoria" | "tipo"
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
  const [search, setSearch] = useState("")
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibrary>("heroicons")
  const [selectedStyle, setSelectedStyle] = useState<string>("outline")

  const getStyleOptions = (library: IconLibrary) => {
    switch (library) {
      case "heroicons":
        return ["outline", "solid", "mini"]
      case "boxicons":
        return ["regular", "solid", "logos"]
      case "phosphor":
        return ["regular", "bold", "duotone", "fill", "light", "thin"]
      default:
        return []
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
        return Pi
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
        name.toLowerCase().includes(search.toLowerCase())
      )
      .sort(([a], [b]) => a.localeCompare(b))
  }, [selectedLibrary, selectedStyle, search])

  const handleSelectIcon = () => {
    if (selectedIcon) {
      const formattedIconName = `${selectedLibrary}/${selectedStyle}/${selectedIcon}`
      onSelectIcon(formattedIconName)
      onOpenChange(false)
    }
  }

  const renderPhosphorIcon = (Icon: any) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex items-center px-4 py-2 border-b relative">
          <DialogTitle className="flex-1 text-center">
            Selecionar ícone - {itemName}
          </DialogTitle>
          <DialogClose className="absolute right-2 top-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <Input
            placeholder="Buscar ícones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Tabs defaultValue="heroicons" onValueChange={(value) => setSelectedLibrary(value as IconLibrary)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="heroicons"
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Heroicons
              </TabsTrigger>
              <TabsTrigger
                value="phosphor"
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Phosphor
              </TabsTrigger>
              <TabsTrigger
                value="fontawesome"
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Font Awesome
              </TabsTrigger>
              <TabsTrigger
                value="material"
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Material
              </TabsTrigger>
              <TabsTrigger
                value="ionicons"
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Ionicons
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {selectedLibrary === "heroicons" && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={selectedStyle === "outline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("outline")}
                  >
                    Outline
                  </Button>
                  <Button
                    variant={selectedStyle === "solid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("solid")}
                  >
                    Solid
                  </Button>
                  <Button
                    variant={selectedStyle === "mini" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("mini")}
                  >
                    Mini
                  </Button>
                </div>
              )}
              {selectedLibrary === "phosphor" && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant={selectedStyle === "regular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("regular")}
                  >
                    Regular
                  </Button>
                  <Button
                    variant={selectedStyle === "bold" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("bold")}
                  >
                    Bold
                  </Button>
                  <Button
                    variant={selectedStyle === "duotone" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("duotone")}
                  >
                    Duotone
                  </Button>
                  <Button
                    variant={selectedStyle === "fill" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("fill")}
                  >
                    Fill
                  </Button>
                  <Button
                    variant={selectedStyle === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={selectedStyle === "thin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle("thin")}
                  >
                    Thin
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[400px] border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-4">
                {iconEntries.map(([name, Icon]) => (
                  <TooltipProvider key={name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selectedIcon === name ? "default" : "outline"}
                          className="h-10 w-10 p-0"
                          onClick={() => setSelectedIcon(name)}
                        >
                          {selectedLibrary === "phosphor" ? (
                            renderPhosphorIcon(Icon)
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
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
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSelectIcon} disabled={!selectedIcon} className="bg-black hover:bg-black/90">
            Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 