export interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  section: 'reports' | 'management';
  icon?: string;
  pages?: Page[];
}

export interface Tab {
  id: string;
  created_at: string;
  updated_at: string;
  page_id: string | null;
  name: string;
  content: string;
  order_index: number;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  tabs?: Tab[];
  categories?: {
    id: string;
    name: string;
    slug: string;
    section: 'reports' | 'management';
    order_index: number;
  };
}

// Tipos para criação/atualização
export interface CreateCategoryData {
  name: string;
  slug: string;
  order_index: number;
  section: 'reports' | 'management';
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  order_index?: number;
  section?: 'reports' | 'management';
  icon?: string;
}

export interface CreatePageData {
  name: string;
  slug: string;
  category_id?: string;
  category_type?: string;
  icon?: string;
}

export interface UpdatePageData {
  name?: string;
  slug?: string;
  category_id?: string;
  category_type?: string;
  icon?: string;
}

export interface CreateTabData {
  name: string;
  content: string;
  order_index: number;
  page_id?: string;
}

export interface UpdateTabData {
  name?: string;
  content?: string;
  order_index?: number;
  page_id?: string;
} 