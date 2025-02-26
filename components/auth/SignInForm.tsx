"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createBrowserClient } from "@supabase/ssr"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

const codeFormSchema = z.object({
  code: z.array(z.string().length(1)).length(6),
})

export default function SignInForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  })

  const codeForm = useForm<z.infer<typeof codeFormSchema>>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: {
      code: Array(6).fill(""),
    },
  })

  // Focus first code input when verification form is shown
  useEffect(() => {
    if (showVerification && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [showVerification])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const input = event.target as HTMLInputElement
    const previousInput = inputRefs.current[index - 1]
    const nextInput = inputRefs.current[index + 1]

    if (event.key === "Backspace" && !input.value && previousInput) {
      previousInput.focus()
      previousInput.select()
      event.preventDefault()
    }

    if (event.key === "ArrowLeft" && previousInput) {
      previousInput.focus()
      previousInput.select()
      event.preventDefault()
    }

    if (event.key === "ArrowRight" && nextInput) {
      nextInput.focus()
      nextInput.select()
      event.preventDefault()
    }
  }

  const onInput = (event: React.FormEvent<HTMLInputElement>, index: number) => {
    const input = event.target as HTMLInputElement
    const nextInput = inputRefs.current[index + 1]
    const value = input.value

    // Only allow numbers
    const numbersOnly = value.replace(/[^0-9]/g, "")
    input.value = numbersOnly

    if (numbersOnly && nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData("text/plain").replace(/[^0-9]/g, "")
    
    if (!pastedData) return
    
    // Update the form values with the pasted digits
    const updatedCode = [...codeForm.getValues().code]
    
    // Fill in as many inputs as we can with the pasted value
    for (let i = 0; i < Math.min(pastedData.length, 6 - index); i++) {
      if (inputRefs.current[index + i]) {
        inputRefs.current[index + i]!.value = pastedData[i]
        updatedCode[index + i] = pastedData[i]
      }
    }
    
    codeForm.setValue("code", updatedCode)
    
    // Focus the next empty input or the last input if all filled
    const nextEmptyIndex = updatedCode.findIndex((digit, i) => i >= index && !digit)
    if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex]!.focus()
    } else if (inputRefs.current[5]) {
      inputRefs.current[5]!.focus()
    }
  }

  async function onEmailSubmit(values: z.infer<typeof emailFormSchema>) {
    try {
      setIsLoading(true)
      console.log("Requesting OTP...")
      
      const response = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      console.log("Sign in response:", response)

      if (response.error) {
        console.error("Sign in error:", response.error)
        toast({
          title: "Error",
          description: response.error.message,
          variant: "destructive",
        })
        return
      }

      setEmail(values.email)
      setShowVerification(true)
      toast({
        title: "Code sent",
        description: "Check your email for the verification code",
      })
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onCodeSubmit(values: z.infer<typeof codeFormSchema>) {
    try {
      setIsLoading(true)
      console.log("Verifying OTP...")
      
      const token = values.code.join("")
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token,
        type: 'email'
      })

      console.log("Verification response:", { data, error })

      if (error) {
        console.error("Verification error:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (!data.session) {
        console.error("No session after verification")
        toast({
          title: "Error",
          description: "Failed to create session. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("Successfully verified and got session")
      toast({
        title: "Success",
        description: "You have been signed in successfully",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className={cn("space-y-4", className)} {...props}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading || showVerification}
                      className="h-11"
                      {...field}
                      value={showVerification ? email : field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {!showVerification && (
            <Button 
              type="submit"
              className="w-full h-11 bg-[#E97451] text-white hover:bg-[#c45e3f]"
              disabled={isLoading}
            >
              {isLoading ? "Sending code..." : "Continue with Email"}
            </Button>
          )}
        </form>
      </Form>

      {showVerification && (
        <Form {...codeForm}>
          <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
            <div className="grid gap-2">
                <Label>Enter the code sent to your email</Label>
              <div className="flex justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <FormField
                    key={i}
                    control={codeForm.control}
                    name={`code.${i}`}
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                            {...field}
                            ref={(el) => {
                                inputRefs.current[i] = el
                                field.ref(el)
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            pattern="[0-9]"
                            className="w-12 h-12 text-center text-2xl border-gray-200 rounded focus:border-[#E76F51] focus:ring-[#E76F51]"
                            disabled={isLoading}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            onInput={(e) => onInput(e, i)}
                            onPaste={(e) => handlePaste(e, i)}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Button 
                type="submit"
                className="w-full h-11 bg-[#E97451] text-white hover:bg-[#c45e3f]"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 text-sm text-gray-500 hover:text-gray-900"
                onClick={() => {
                  setShowVerification(false)
                  emailForm.reset()
                  codeForm.reset()
                }}
                disabled={isLoading}
              >
                Use a different email
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
} 