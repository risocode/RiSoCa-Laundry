'use client'

import { useState, useEffect } from 'react'
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
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    const checkSession = async () => {
      try {
        // Check if there's a hash in the URL (password reset token from email)
        const hash = window.location.hash
        const hasResetToken = hash.includes('access_token') || hash.includes('type=recovery')
        
        if (hasResetToken) {
          // Extract the token from the hash and exchange it for a session
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            // Set the session using the tokens from the URL
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (sessionError) {
              throw sessionError
            }
            
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
            setIsValidSession(true)
            setCheckingSession(false)
            return
          }
        }
        
        // Check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsValidSession(true)
        } else {
          toast({
            variant: "destructive",
            title: 'Invalid Reset Link',
            description: 'This password reset link is invalid or has expired. Please request a new one.',
          })
          router.push('/login')
        }
      } catch (error: any) {
        console.error('Error checking session:', error)
        toast({
          variant: "destructive",
          title: 'Invalid Reset Link',
          description: error.message || 'This password reset link is invalid or has expired. Please request a new one.',
        })
        router.push('/login')
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router, toast])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: 'All Fields Required',
        description: 'Please fill in all fields.',
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: 'Passwords Do Not Match',
        description: 'Please make sure both passwords match.',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast({
          variant: "destructive",
          title: 'Error',
          description: error.message || 'Failed to update password. Please try again.',
        })
        setLoading(false)
        return
      }

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. You can now login with your new password.',
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <Card className="mx-auto w-full max-w-sm">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Verifying reset link...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <AppFooter />
      </div>
    )
  }

  if (!isValidSession) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-start justify-center min-h-full">
          <Card className="mx-auto w-full max-w-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <form onSubmit={handleSubmit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                >
                  {loading ? (
                    <>
                      <Lock className="mr-2 h-4 w-4 animate-pulse" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm">
                Remember your password?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

