import { supabase } from "@/lib/supabase"
import { Category, Page, Tab, CreateCategoryData, CreatePageData, UpdateCategoryOrder, UpdateTabsData } from "@/types/pages"

export const pageService = {
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order_index", { ascending: true })

    if (error) throw error
    return data
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const { data: category, error } = await supabase
      .from("categories")
      .insert([{
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        order_index: data.order_index
      }])
      .select()
      .single()

    if (error) throw error
    return category
  },

  updateCategory: async (id: string, data: { name: string }): Promise<Category> => {
    const { data: category, error } = await supabase
      .from("categories")
      .update({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-')
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return category
  },

  updateCategoriesOrder: async (updates: UpdateCategoryOrder[]): Promise<void> => {
    for (const update of updates) {
      const { error } = await supabase
        .from("categories")
        .update({ order_index: update.order_index })
        .eq("id", update.id)

      if (error) throw error
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  getAllPages: async (): Promise<Page[]> => {
    const { data, error } = await supabase
      .from("pages")
      .select("*, tabs(*)")
      .order("name")

    if (error) throw error
    return data
  },

  getPages: async (categoryId: string): Promise<Page[]> => {
    const { data, error } = await supabase
      .from("pages")
      .select("*, tabs(*)")
      .eq("category_id", categoryId)
      .order("name")

    if (error) throw error
    return data
  },

  createPage: async (data: CreatePageData): Promise<Page> => {
    const { data: page, error } = await supabase
      .from("pages")
      .insert([{
        category_id: data.category_id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-')
      }])
      .select()
      .single()

    if (error) throw error
    return page
  },

  updatePage: async (id: string, data: { name: string }): Promise<Page> => {
    const { data: page, error } = await supabase
      .from("pages")
      .update({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-')
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return page
  },

  deletePage: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  getPageBySlug: async (categorySlug: string, pageSlug: string): Promise<Page> => {
    const { data, error } = await supabase
      .from("pages")
      .select(`
        *,
        tabs(*),
        categories!inner(*)
      `)
      .eq("slug", pageSlug)
      .eq("categories.slug", categorySlug)
      .single()

    if (error) throw error
    return data
  },

  updateTab: async (id: string, content: string): Promise<Tab> => {
    const { data, error } = await supabase
      .from("tabs")
      .update({ content })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  updateTabs: async (data: UpdateTabsData): Promise<void> => {
    try {
      // Primeiro, remove todas as abas existentes da página
      const { error: deleteError } = await supabase
        .from("tabs")
        .delete()
        .eq("page_id", data.page_id)

      if (deleteError) throw deleteError

      // Depois, insere as novas abas
      if (data.tabs.length > 0) {
        const { error: insertError } = await supabase
          .from("tabs")
          .insert(
            data.tabs.map(tab => ({
              page_id: data.page_id,
              name: tab.name,
              content: tab.content,
              order_index: tab.order_index
            }))
          )

        if (insertError) throw insertError
      }
    } catch (error) {
      console.error("Erro ao atualizar abas:", error)
      throw new Error("Não foi possível atualizar as abas da página")
    }
  }
} 