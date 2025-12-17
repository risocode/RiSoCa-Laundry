'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { PromoBanner } from '@/components/promo-banner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Eye, EyeOff, Mail, User, Lock, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signUpWithEmail } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPasswordError(null)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    const firstName = String(formData.get('firstName') || '').trim()
    const lastName = String(formData.get('lastName') || '').trim()

    // Validate password match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error: signUpError } = await signUpWithEmail(email, password, {
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
    })

    if (signUpError) {
      // Handle specific error codes
      if (signUpError.status === 429) {
        setError(signUpError.message || 'Email limit reached. Please try again later.')
      } else if (signUpError.status === 400) {
        setError(signUpError.message || 'Invalid email address. Please check and try again.')
      } else {
        setError(signUpError.message || 'Failed to create account. Please try again.')
      }
      setLoading(false)
      return
    }

    try {
      toast({
        variant: 'default',
        title: 'Signup Successful!',
        description: `Check your email to verify. Redirecting to login...`,
        duration: 3000,
      });
      
      setTimeout(() => {
        router.push('/login');
      }, 3000)

    } catch (e: any) {
       setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 sm:py-12 flex items-start justify-center min-h-full">
        <Card className="mx-auto w-full max-w-md shadow-2xl border-2">
          <CardHeader className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Create Account</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Join RKR Laundry and start tracking your orders
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    disabled={loading}
                    required
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    disabled={loading}
                    required
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    disabled={loading}
                    className="pr-10 h-11 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    minLength={6}
                    required
                    disabled={loading}
                    className="pr-10 h-11 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    disabled={loading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive font-medium">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-center text-destructive font-medium">
                  {error}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="text-center text-sm space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free to join • No credit card required</span>
                </div>
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
