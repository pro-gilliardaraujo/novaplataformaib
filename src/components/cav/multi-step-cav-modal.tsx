"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { NovoCavModal } from "./novo-cav-modal"
import { NovoDiarioCavModal } from "./novo-diario-cav-modal"
import { RelatorioDiarioCav } from "./relatorio-diario-cav"
import { useToast } from "@/components/ui/use-toast"

interface MultiStepCavModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface BoletimStepData {
  data: string
  frente: string
  formData: any
}

interface DiarioStepData {
  imagemDeslocamento?: string
  imagensDeslocamento?: string[]
  imagemArea?: string
  dadosPassados?: any
}

export function MultiStepCavModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: MultiStepCavModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [boletimData, setBoletimData] = useState<BoletimStepData | null>(null)
  const [diarioData, setDiarioData] = useState<DiarioStepData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Reset ao fechar
  const handleClose = () => {
    setCurrentStep(1)
    setBoletimData(null)
    setDiarioData(null)
    setIsLoading(false)
    onOpenChange(false)
  }

  // Passo 1: Boletim CAV concluído
  const handleBoletimComplete = (data: any) => {
    console.log('📋 Boletim concluído:', data)
    setBoletimData({
      data: data.data,
      frente: data.frente,
      formData: data
    })
    setCurrentStep(2)
    
    toast({
      title: "Passo 1 Concluído",
      description: "Dados do boletim salvos. Configure agora o diário CAV.",
    })
  }

  // Passo 2: Diário CAV concluído  
  const handleDiarioComplete = (data: any) => {
    console.log('📄 Diário concluído:', data)
    console.log('🔍 dadosPassados recebidos:', data.dadosPassados)
    console.log('🚜 Frotas filtradas:', Object.keys(data.dadosPassados?.frotas || {}))
    setDiarioData(data)
    setCurrentStep(3)
    
    toast({
      title: "Passo 2 Concluído", 
      description: "Gerando prévia do relatório...",
    })
  }

  // Passo 3: Relatório salvo - SALVAR TUDO NO SUPABASE
  const handleRelatorioSave = async () => {
    setIsLoading(true)
    
    try {
      console.log('💾 Iniciando salvamento completo:', { boletimData, diarioData })
      console.log('📋 Dados do boletim para envio:', boletimData?.formData)
      
      // 1️⃣ SALVAR BOLETIM CAV PRIMEIRO
      console.log('📋 Salvando Boletim CAV...')
      const boletimResponse = await fetch('/api/cav/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boletimData?.formData),
      })

      const boletimResult = await boletimResponse.json()
      
      if (!boletimResponse.ok) {
        throw new Error(boletimResult.error || 'Erro ao salvar boletim CAV')
      }

      console.log('✅ Boletim CAV salvo com sucesso!')

      // 2️⃣ SALVAR DIÁRIO CAV (se houver dados)
      if (diarioData) {
        console.log('📄 Salvando Diário CAV...')
        
        // Preparar dados do diário para salvamento
        const diarioRequestData = {
          data: boletimData?.data,
          frente: boletimData?.frente,
          ...diarioData
        }

        const diarioResponse = await fetch('/api/diario-cav', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(diarioRequestData),
        })

        if (diarioResponse.ok) {
          console.log('✅ Diário CAV salvo com sucesso!')
        } else {
          console.log('⚠️ Diário CAV não foi salvo (opcional)')
        }
      }

      // 3️⃣ SUCESSO COMPLETO
      toast({
        title: "Sucesso Completo!",
        description: `Boletim CAV criado com ${boletimResult.dados?.registros_granulares || 0} registros granulares${diarioData ? ' e Diário CAV salvo' : ''}!`,
      })
      
      if (onSuccess) onSuccess()
      handleClose()
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error)
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar dados. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Voltar ao passo anterior
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Renderizar indicador de progresso
  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
        currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
      </div>
      <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
      
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
        currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
      </div>
      <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
      
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
        currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
      </div>
    </div>
  )

  // Renderizar título do passo atual
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Passo 1: Dados do Boletim CAV"
      case 2: return "Passo 2: Configuração do Diário"  
      case 3: return "Passo 3: Prévia do Relatório"
      default: return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        {/* Header com progresso */}
        <div className="p-6 border-b bg-gray-50 relative">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 rounded-lg border border-gray-300 shadow-sm"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          <h2 className="text-xl font-semibold text-center mb-4">
            Criar Boletim CAV + Diário Completo
          </h2>
          {renderProgressIndicator()}
          <h3 className="text-lg font-medium text-center text-gray-700">
            {getStepTitle()}
          </h3>
        </div>

        {/* Conteúdo do passo atual */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <NovoCavModal
              open={true}
              onOpenChange={() => {}} // Não deixa fechar individualmente
              onCavAdded={handleBoletimComplete}
              isStepMode={true} // Nova prop para indicar modo step
              // Manter dados preenchidos quando volta do passo 2
              cavToEdit={boletimData ? {
                data: boletimData.data,
                frente: boletimData.frente,
                ...boletimData.formData
              } : undefined}
              isEditMode={!!boletimData} // Modo edição se já tem dados
            />
          )}

          {currentStep === 2 && boletimData && (
            <NovoDiarioCavModal
              open={true}
              onOpenChange={() => {}} // Não deixa fechar individualmente
              onSuccess={handleDiarioComplete}
              preFilledData={{
                data: boletimData.data,
                frente: boletimData.frente,
                // Passar dados de produção do boletim para processar automaticamente
                boletimFormData: boletimData.formData
              }}
              isStepMode={true} // Nova prop para indicar modo step
            />
          )}

          {currentStep === 3 && (
            <div className="p-6 h-full flex flex-col">
              {/* Debug: Verificar dados disponíveis */}
              {(() => {
                console.log('🎯 PASSO 3 - Verificando dados disponíveis:')
                console.log('📋 boletimData existe:', !!boletimData)
                console.log('📄 diarioData existe:', !!diarioData)
                console.log('📋 boletimData:', boletimData)
                console.log('📄 diarioData:', diarioData)
                if (diarioData) {
                  console.log('📊 dadosPassados:', diarioData.dadosPassados)
                  console.log('📷 Imagens:', {
                    imagemDeslocamento: diarioData.imagemDeslocamento,
                    imagensDeslocamento: diarioData.imagensDeslocamento,
                    imagemArea: diarioData.imagemArea
                  })
                }
                return null
              })()}
              
              {boletimData && diarioData ? (
                <div className="flex-1 border rounded-lg overflow-hidden">
                
                  <RelatorioDiarioCav
                    open={true}
                    onOpenChange={() => {}}
                    frente={boletimData.frente}
                    data={new Date(boletimData.data)}
                    imagemDeslocamento={diarioData.imagemDeslocamento}
                    imagensDeslocamento={diarioData.imagensDeslocamento}
                    imagemArea={diarioData.imagemArea}
                    dadosPassados={diarioData.dadosPassados}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border rounded-lg bg-yellow-50">
                  <div className="text-center p-8">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Dados Incompletos
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      Não foi possível gerar o relatório. Alguns dados estão ausentes.
                    </p>
                    <div className="text-sm text-yellow-600">
                      <p>Boletim: {boletimData ? '✅ OK' : '❌ Ausente'}</p>
                      <p>Diário: {diarioData ? '✅ OK' : '❌ Ausente'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com navegação */}
        <div className="border-t bg-white p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              
              {currentStep === 1 && (
                <Button 
                  onClick={() => {
                    // Trigger handleSubmit do NovoCavModal
                    console.log('🚀 Avançar Passo 1: Triggering handleSubmit')
                    // O botão invisível será clicado automaticamente
                    const submitBtn = document.querySelector('[data-step-submit="1"]') as HTMLButtonElement
                    if (submitBtn) {
                      submitBtn.click()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              {currentStep === 2 && (
                <Button 
                  onClick={() => {
                    // Trigger handleSave do NovoDiarioCavModal
                    console.log('🚀 Avançar Passo 2: Triggering handleSave')
                    const submitBtn = document.querySelector('[data-step-submit="2"]') as HTMLButtonElement
                    if (submitBtn) {
                      submitBtn.click()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              {currentStep === 3 && (
                <Button 
                  onClick={handleRelatorioSave}
                  disabled={isLoading || !boletimData || !diarioData}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {(!boletimData || !diarioData) ? 'Dados Incompletos' : 'Aceitar Relatório & Salvar'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
