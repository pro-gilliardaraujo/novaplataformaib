"use client"

import { useState, useEffect, forwardRef } from "react"
import { Input } from "./input"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [capsLockOn, setCapsLockOn] = useState(false)

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.getModifierState("CapsLock")) {
          setCapsLockOn(true)
        }
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.getModifierState("CapsLock")) {
          setCapsLockOn(false)
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("keyup", handleKeyUp)
      }
    }, [])

    return (
      <TooltipProvider>
        <div className="relative">
          <Tooltip open={capsLockOn}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  ref={ref}
                  onChange={onChange}
                  {...props}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Caps Lock está ativado</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput } 