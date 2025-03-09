"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, Pencil, Trash, GripVertical, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category, Page } from "@/types/pages"
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DroppableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd"

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
  onUpdateOrder
}: PagesTreeViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [orderedCategories, setOrderedCategories] = useState(categories)
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)

    if (!result.destination) return

    const items = Array.from(orderedCategories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setOrderedCategories(items)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleSaveOrder = () => {
    const updatedCategories = orderedCategories.map((category, index) => ({
      ...category,
      order_index: index + 1
    }))
    onUpdateOrder(updatedCategories)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Páginas</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveOrder}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Ordem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCategory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <Droppable droppableId="categories">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {orderedCategories.map((category, index) => (
                  <Draggable
                    key={category.id}
                    draggableId={category.id}
                    index={index}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border-b last:border-b-0 ${snapshot.isDragging ? "bg-gray-50" : ""}`}
                      >
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50">
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onAddPage(category.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onDeleteCategory(category)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
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
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onEditPage(page)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onDeletePage(page)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
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