"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, Pencil, Trash, GripVertical, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category, Page } from "@/types/pages"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EditPageModal } from "./edit-page-modal"
import { IconSelectorDialog } from "@/components/icon-selector-dialog"
import { DocumentDuplicateIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Pi from "phosphor-react"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { IconContext as PhosphorIconContext } from "phosphor-react"

interface ActionButton {
  icon: React.ReactNode
  label: string
  onClick: () => void
  show?: boolean
}

interface EditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category
  onUpdateCategory: (categoryId: string, updates: { name?: string; icon?: string }) => void
}

function EditCategoryModal({
  open,
  onOpenChange,
  category,
  onUpdateCategory
}: EditCategoryModalProps) {
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria: {category.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRenameDialog(true)}
            >
              Renomear Categoria
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowIconSelector(true)}
            >
              Alterar Ícone
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RenameDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        title="Renomear Categoria"
        currentName={category.name}
        onConfirm={(newName) => onUpdateCategory(category.id, { name: newName })}
      />

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={(iconName) => onUpdateCategory(category.id, { icon: iconName })}
        itemName={category.name}
        itemType="categoria"
      />
    </>
  )
}

interface PagesTreeViewProps {
  categories: Category[]
  pages: Page[]
  onEditPage: (page: Page) => void
  onDeletePage: (page: Page) => void
  onAddPage: (categoryId: string) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  onAddCategory: () => void
  onUpdateOrder: (categories: Category[]) => void
  onRenamePage: (pageId: string, newName: string) => void
  onRenameCategory: (categoryId: string, newName: string) => void
  onUpdatePageIcon: (pageId: string, iconName: string) => void
  onUpdateCategoryIcon: (categoryId: string, iconName: string) => void
}

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentName: string
  onConfirm: (newName: string) => void
}

function RenameDialog({ open, onOpenChange, title, currentName, onConfirm }: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName)

  useEffect(() => {
    setNewName(currentName)
  }, [currentName])

  const handleConfirm = () => {
    onConfirm(newName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const getIconComponent = (iconName: string | undefined) => {
  if (!iconName) return DocumentDuplicateIcon

  const [library, style, name] = iconName.split('/')
  let iconSet: Record<string, any>

  // Função auxiliar para renderizar ícone do Phosphor
  const renderPhosphorIcon = (Icon: any) => {
    return function PhosphorIconWrapper(props: any) {
      return (
        <PhosphorIconContext.Provider
          value={{
            size: props.className?.includes('h-4') ? 16 : 20,
            weight: style as any,
            mirrored: false,
          }}
        >
          <Icon {...props} />
        </PhosphorIconContext.Provider>
      )
    }
  }

  switch (library) {
    case 'heroicons':
      switch (style) {
        case 'solid':
          iconSet = HeroIconsSolid
          break
        case 'mini':
          iconSet = HeroIconsMini
          break
        default:
          iconSet = HeroIconsOutline
      }
      break
    case 'remixicon':
      iconSet = Ri
      break
    case 'boxicons':
      iconSet = Bi
      break
    case 'phosphor':
      const PhosphorIcon = Pi[name as keyof typeof Pi]
      return PhosphorIcon ? renderPhosphorIcon(PhosphorIcon) : DocumentDuplicateIcon
    case 'fontawesome':
      iconSet = Fa
      break
    case 'material':
      iconSet = Md
      break
    case 'ionicons':
      iconSet = Io
      break
    default:
      iconSet = HeroIconsOutline
  }

  return iconSet[name] || DocumentDuplicateIcon
}

export function PagesTreeView({
  categories,
  pages,
  onEditPage,
  onDeletePage,
  onAddPage,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onUpdateOrder,
  onRenamePage,
  onRenameCategory,
  onUpdatePageIcon,
  onUpdateCategoryIcon
}: PagesTreeViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [orderedCategories, setOrderedCategories] = useState(categories)
  const [isDragging, setIsDragging] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<{ id: string; type: 'page' | 'category'; name: string } | null>(null)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [showEditPageModal, setShowEditPageModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)

  useEffect(() => {
    setOrderedCategories(categories)
  }, [categories])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const getCategoryPages = (categoryId: string) => {
    return pages.filter(page => page.category_id === categoryId)
  }

  const handleDragEnd = (result: DropResult, section: 'reports' | 'management') => {
    setIsDragging(false)

    if (!result.destination) return
    if (result.source.index === result.destination.index) return

    const sectionCategories = orderedCategories.filter(cat => cat.section === section)
    const otherCategories = orderedCategories.filter(cat => cat.section !== section)

    const items = Array.from(sectionCategories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedSectionCategories = items.map((cat, index) => ({
      ...cat,
      order_index: index + 1
    }))

    const allUpdatedCategories = [...updatedSectionCategories, ...otherCategories]
    setOrderedCategories(allUpdatedCategories)
    setHasChanges(true)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleRename = (id: string, type: 'page' | 'category', currentName: string) => {
    setItemToRename({ id, type, name: currentName })
    setRenameDialogOpen(true)
  }

  const handleRenameConfirm = (newName: string) => {
    if (!itemToRename) return

    if (itemToRename.type === 'page') {
      onRenamePage(itemToRename.id, newName)
    } else {
      onRenameCategory(itemToRename.id, newName)
    }
  }

  const handleUpdatePage = (pageId: string, updates: { name?: string; icon?: string }) => {
    if (updates.name) {
      onRenamePage(pageId, updates.name)
    }
    if (updates.icon) {
      onUpdatePageIcon(pageId, updates.icon)
    }
  }

  const handleSaveOrder = () => {
    onUpdateOrder(orderedCategories)
    setHasChanges(false)
  }

  const handleUpdateCategory = (categoryId: string, updates: { name?: string; icon?: string }) => {
    if (updates.name) {
      onRenameCategory(categoryId, updates.name)
    }
    if (updates.icon) {
      onUpdateCategoryIcon(categoryId, updates.icon)
    }
  }

  const renderActionButton = ({ icon, label, onClick, show = true }: ActionButton) => {
    if (!show) return null

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClick}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const renderCategoryActions = (category: Category, section: 'reports' | 'management') => {
    const actions: ActionButton[] = [
      {
        icon: <Plus className="h-4 w-4" />,
        label: "Adicionar Página",
        onClick: () => onAddPage(category.id),
        show: section === 'reports'
      },
      {
        icon: <Pencil className="h-4 w-4" />,
        label: "Editar Categoria",
        onClick: () => {
          setSelectedCategory(category)
          setShowEditCategoryModal(true)
        }
      },
      {
        icon: <Trash className="h-4 w-4" />,
        label: "Excluir Categoria",
        onClick: () => onDeleteCategory(category)
      }
    ]

    return (
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          action.show !== false && renderActionButton(action)
        ))}
      </div>
    )
  }

  const renderPageActions = (page: Page, section: 'reports' | 'management') => {
    const actions: ActionButton[] = [
      {
        icon: <Pencil className="h-4 w-4" />,
        label: "Editar Página",
        onClick: () => {
          setSelectedPage(page)
          setShowEditPageModal(true)
        }
      },
      {
        icon: <Trash className="h-4 w-4" />,
        label: "Excluir Página",
        onClick: () => onDeletePage(page)
      }
    ]

    return (
      <div className="flex items-center gap-2">
        {actions.map((action, index) => renderActionButton(action))}
      </div>
    )
  }

  const renderSection = (section: 'reports' | 'management') => {
    const sectionCategories = orderedCategories.filter(cat => cat.section === section)

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {section === 'reports' ? 'Relatórios' : 'Gerenciamento'}
          </h2>
          <div className="flex gap-2">
            {renderActionButton({
              icon: <Plus className="h-4 w-4" />,
              label: "Nova Categoria",
              onClick: onAddCategory
            })}
          </div>
        </div>

        <div className="border rounded-lg">
          <DragDropContext 
            onDragEnd={(result) => handleDragEnd(result, section)} 
            onDragStart={handleDragStart}
          >
            <Droppable droppableId={`droppable-${section}`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {sectionCategories.map((category, index) => (
                    <Draggable
                      key={category.id}
                      draggableId={category.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-b last:border-b-0 ${snapshot.isDragging ? "bg-gray-50" : ""}`}
                        >
                          <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleCategory(category.id)}
                              >
                                {expandedCategories.includes(category.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              {expandedCategories.includes(category.id) ? (
                                <FolderOpen className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Folder className="h-4 w-4 text-gray-500" />
                              )}
                              <span>{category.name}</span>
                            </div>
                            {renderCategoryActions(category, section)}
                          </div>
                          
                          {expandedCategories.includes(category.id) && (
                            <div className="pl-8 pr-2 pb-2">
                              {getCategoryPages(category.id).map(page => (
                                <div
                                  key={page.id}
                                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <File className="h-4 w-4 text-gray-500" />
                                    <span>{page.name}</span>
                                  </div>
                                  {renderPageActions(page, section)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    )
  }

  const getIconForCategory = (category: Category) => {
    if (category.icon) {
      const IconComponent = getIconComponent(category.icon)
      return <IconComponent className="h-5 w-5 text-gray-500" />
    }

    // Ícones padrão baseados no slug
    switch (category.slug) {
      case 'operacional':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
      default:
        return <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getIconForPage = (page: Page) => {
    if (page.icon) {
      const IconComponent = getIconComponent(page.icon)
      return <IconComponent className="h-4 w-4 text-gray-500" />
    }
    return <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
  }

  return (
    <>
      <div className="space-y-8">
        {renderSection('reports')}
        {renderSection('management')}
        
        {hasChanges && (
          <div className="fixed bottom-8 right-8">
            <Button 
              onClick={handleSaveOrder}
              className="bg-black hover:bg-black/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Ordenação
            </Button>
          </div>
        )}
      </div>

      {selectedPage && (
        <EditPageModal
          open={showEditPageModal}
          onOpenChange={setShowEditPageModal}
          page={selectedPage}
          onUpdatePage={handleUpdatePage}
        />
      )}

      {selectedCategory && (
        <EditCategoryModal
          open={showEditCategoryModal}
          onOpenChange={setShowEditCategoryModal}
          category={selectedCategory}
          onUpdateCategory={handleUpdateCategory}
        />
      )}

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title={`Renomear ${itemToRename?.type === 'page' ? 'Página' : 'Categoria'}`}
        currentName={itemToRename?.name || ''}
        onConfirm={handleRenameConfirm}
      />
    </>
  )
} 