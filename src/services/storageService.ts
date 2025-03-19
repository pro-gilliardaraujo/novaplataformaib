import { supabase } from "@/lib/supabase"

interface UploadOptions {
  bucket: string
  path: string
  file: File
  cacheControl?: string
}

interface FileInfo {
  url: string
  path: string
}

class StorageService {
  private static instance: StorageService
  private cache: Map<string, string>

  private constructor() {
    this.cache = new Map()
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  async uploadFile({ bucket, path, file, cacheControl = "3600" }: UploadOptions): Promise<FileInfo> {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl,
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      const url = data.publicUrl
      this.cache.set(`${bucket}/${path}`, url)

      return {
        url,
        path
      }
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error)
      throw error
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const cacheKey = `${bucket}/${path}`
    const cachedUrl = this.cache.get(cacheKey)
    
    if (cachedUrl) {
      return cachedUrl
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    const url = data.publicUrl
    this.cache.set(cacheKey, url)
    
    return url
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error

      this.cache.delete(`${bucket}/${path}`)
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw error
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const storageService = StorageService.getInstance() 