"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Step = "email" | "password" | "first-access"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<Step>("email")
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError("")
    setIsLoading(true)

    if (!email.endsWith("@ib.logistica")) {
      setGeneralError("Por favor, use seu email corporativo (@ib.logistica)")
      setIsLoading(false)
      return
    }

    try {
      // Verifica se é primeiro acesso
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("firstLogin, user_id")
        .eq("user_email", email)
        .single()

      if (profileError) {
        setGeneralError("Email não encontrado. Verifique se digitou corretamente.")
        return
      }

      setIsFirstAccess(profileData.firstLogin)
      setStep(profileData.firstLogin ? "first-access" : "password")
      
      if (profileData.firstLogin) {
        toast({
          title: "Primeiro Acesso",
          description: "Por favor, crie sua senha para continuar.",
        })
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error)
      setGeneralError("Não foi possível verificar o email. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setGeneralError("Senha incorreta. Tente novamente.")
        } else {
          setGeneralError("Erro ao fazer login. Tente novamente.")
        }
        return
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Redirecionando para o sistema...",
      })

      // Aguarda a sessão ser estabelecida e o toast ser exibido
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Força um refresh da página
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      setGeneralError("Erro inesperado. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setGeneralError("")

    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return
    }

    setIsLoading(true)

    try {
      // Atualiza a senha usando a rota de API que usa o supabaseAdmin
      const response = await fetch("/api/auth/first-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar senha")
      }

      // Faz login com a nova senha
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      })

      if (signInError) {
        setGeneralError("Erro ao fazer login com a nova senha")
        return
      }

      toast({
        title: "Senha criada com sucesso",
        description: "Redirecionando para o sistema...",
      })

      // Aguarda a sessão ser estabelecida
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Força um refresh da página
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      setGeneralError("Não foi possível criar a senha. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-lg">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//logo.png"
              alt="IB Logística"
              width={64}
              height={64}
              className="rounded mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          </div>

          {generalError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Corporativo
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                  className="mt-1"
                  placeholder="nome@ib.logistica"
                  pattern="[a-z0-9._%+-]+@ib\.logistica$"
                  title="Use seu email corporativo (@ib.logistica)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use seu email corporativo (nome@ib.logistica) ou (nome.sobrenome@ib.logistica)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? "Verificando..." : "Continuar"}
              </Button>
            </form>
          ) : step === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email")
                      setGeneralError("")
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Editar
                  </button>
                </div>
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {email}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Digite sua senha"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFirstAccessSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email")
                      setGeneralError("")
                      setPasswordError("")
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Editar
                  </button>
                </div>
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {email}
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Digite sua nova senha"
                  minLength={6}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirme a Senha
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Digite novamente sua senha"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? "Criando senha..." : "Criar Senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 