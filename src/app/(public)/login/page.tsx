"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

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
  const router = useRouter()
  const { toast } = useToast()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Verifica se é primeiro acesso
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("firstLogin, user_id")
        .eq("user_email", email)
        .single()

      if (profileError) {
        throw new Error("Email não encontrado")
      }

      setIsFirstAccess(profileData.firstLogin)
      setStep(profileData.firstLogin ? "first-access" : "password")
    } catch (error) {
      console.error("Erro ao verificar email:", error)
      toast({
        title: "Erro",
        description: "Email não encontrado. Por favor, verifique e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Aguarda a sessão ser estabelecida
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Força um refresh da página
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast({
        title: "Erro",
        description: "Senha inválida.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

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

      if (signInError) throw signInError

      // Aguarda a sessão ser estabelecida
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      })

      // Força um refresh da página
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha. Por favor, tente novamente.",
        variant: "destructive",
      })
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

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="seu.email@iblogistica.com.br"
                />
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
                    onClick={() => setStep("email")}
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
                    onClick={() => setStep("email")}
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
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError("")
                  }}
                  required
                  className="mt-1"
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError("")
                  }}
                  required
                  className="mt-1"
                  placeholder="Confirme sua nova senha"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-500">
                    {passwordError}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Este é seu primeiro acesso. Por favor, defina uma nova senha.
              </p>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? "Atualizando..." : "Definir Nova Senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 