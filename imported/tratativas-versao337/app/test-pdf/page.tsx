"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestPDFPage() {
  const [documentNumber, setDocumentNumber] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGeneratePDF = async () => {
    setIsLoading(true)
    setError("")
    setPdfUrl("")

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numero_documento: documentNumber }),
      })

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to generate PDF")
        }
        setPdfUrl(data.pdfUrl)
      } else {
        const text = await response.text()
        console.error("Unexpected response:", text)
        throw new Error("Received an invalid response from the server")
      }
    } catch (err) {
      setError(`Error generating PDF: ${err instanceof Error ? err.message : "Unknown error"}`)
      console.error("Error details:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test PDF Generation</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">
            Document Number
          </label>
          <Input
            id="documentNumber"
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter document number"
            className="mt-1"
          />
        </div>
        <Button onClick={handleGeneratePDF} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate PDF"}
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {pdfUrl && (
          <div>
            <p className="mb-2">PDF generated successfully:</p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View PDF
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

