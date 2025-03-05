"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface SavedAPI {
  id: string
  name: string
  method: string
  url: string
  headers: string
  body: string
}

export default function TestAPIs() {
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("https://iblogistica.ddns.net:3000/api/tratativa/create")
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState(
    '{\n  "numero_documento": "1234",\n  "nome_funcionario": "João Silva",\n  "funcao": "Motorista",\n  "setor": "Logística",\n  "data_formatada_extenso": "25 de fevereiro de 2025",\n  "codigo_infracao": "INF-001",\n  "infracao_cometida": "Excesso de velocidade",\n  "data_infracao": "25/02/2025",\n  "hora_infracao": "14:30",\n  "penalidade": "Advertência",\n  "penalidade_aplicada": "Advertência verbal por excesso de velocidade",\n  "nome_lider": "Maria Gestora"\n}',
  )
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  const [savedAPIs, setSavedAPIs] = useState<SavedAPI[]>([])
  const [apiName, setApiName] = useState("")
  const [sidebarMinimized, setSidebarMinimized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("savedAPIs")
    if (saved) {
      setSavedAPIs(JSON.parse(saved))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResponse("")

    try {
      let parsedHeaders = {}
      try {
        parsedHeaders = JSON.parse(headers)
      } catch (headerError) {
        throw new Error("Invalid JSON in headers. Please check the format.")
      }

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
        body: method !== "GET" && body ? body : undefined,
      }

      const res = await fetch(url, options)
      const data = await res.text()
      try {
        const jsonData = JSON.parse(data)
        setResponse(JSON.stringify(jsonData, null, 2))
      } catch {
        setResponse(data)
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleSaveAPI = () => {
    if (!apiName) {
      setError("Please enter a name for the API")
      return
    }
    const newAPI: SavedAPI = {
      id: Date.now().toString(),
      name: apiName,
      method,
      url,
      headers,
      body,
    }
    const updatedAPIs = [...savedAPIs, newAPI]
    setSavedAPIs(updatedAPIs)
    localStorage.setItem("savedAPIs", JSON.stringify(updatedAPIs))
    setApiName("")
  }

  const handleLoadAPI = (api: SavedAPI) => {
    setMethod(api.method)
    setUrl(api.url)
    setHeaders(api.headers)
    setBody(api.body)
  }

  const handleDeleteAPI = (id: string) => {
    const updatedAPIs = savedAPIs.filter((api) => api.id !== id)
    setSavedAPIs(updatedAPIs)
    localStorage.setItem("savedAPIs", JSON.stringify(updatedAPIs))
  }

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized)
  }

  return (
    <div className="container mx-auto p-4 flex text-sm">
      <div
        className={`transition-all duration-300 ease-in-out ${sidebarMinimized ? "w-10" : "w-48"} flex flex-col p-2`}
      >
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="self-end mb-2">
          {sidebarMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        {!sidebarMinimized && (
          <>
            <h2 className="text-sm font-semibold mb-2">Saved APIs</h2>
            <div className="space-y-2 mb-2">
              <Input
                type="text"
                placeholder="API Name"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
                className="text-xs"
              />
              <Button onClick={handleSaveAPI} className="w-full text-xs py-1">
                <Save className="w-3 h-3 mr-2" /> Salvar API Atual
              </Button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-grow">
              {savedAPIs.map((api) => (
                <div key={api.id} className="flex items-center justify-between py-1 px-2 bg-gray-100 rounded text-xs">
                  <button
                    onClick={() => handleLoadAPI(api)}
                    className="text-left truncate flex-grow hover:text-blue-600"
                  >
                    {api.name}
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteAPI(api.id)} className="h-6 w-6">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex-grow pl-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">Enviar</Button>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Headers (JSON format)</label>
            <Textarea
              placeholder="Enter headers in JSON format"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="text-xs"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">Example: {`{"Content-Type": "application/json"}`}</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Body</label>
            <Textarea
              placeholder="Enter request body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-xs min-h-[100px]"
              rows={5}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">Response</label>
            <Textarea value={response} readOnly className="text-xs min-h-[200px]" rows={10} />
          </div>
        </form>
      </div>
    </div>
  )
}

