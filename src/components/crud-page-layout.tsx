import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CrudPageLayoutProps {
  title: string
  searchPlaceholder: string
  onSearch: (term: string) => void
  onNewClick: () => void
  isLoading: boolean
  error: string | null
  children: React.ReactNode
}

export function CrudPageLayout({
  title,
  searchPlaceholder,
  onSearch,
  onNewClick,
  isLoading,
  error,
  children
}: CrudPageLayoutProps) {
  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder={searchPlaceholder}
          type="search"
          onChange={(e) => onSearch(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={onNewClick}
        >
          <Plus className="mr-2 h-4 w-4" /> {title}
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table with fixed height */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando...</div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
} 