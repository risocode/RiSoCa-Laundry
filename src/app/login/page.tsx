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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, Clock, Mail, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { signInWithEmail, resetPasswordForEmail } from '@/lib/auth'

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 60 * 1000 // 1 minute in milliseconds
const STORAGE_KEY = 'rkr_login_attempts'

// Password Reset Rate Limiting
const MAX_RESET_ATTEMPTS = 3
const RESET_LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const RESET_STORAGE_KEY = 'rkr_password_reset_attempts'

interface LoginAttempts {
  count: number
  lockoutUntil: number | null
}

interface AllLoginAttempts {
  [email: string]: LoginAttempts
}

// Helper to normalize email (lowercase, trim)
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function getAllLoginAttempts(): AllLoginAttempts {
  if (typeof window === 'undefined') {
    return {}
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return {}
  }
  
  try {
    const parsed = JSON.parse(stored) as AllLoginAttempts
    const now = Date.now()
    const cleaned: AllLoginAttempts = {}
    
    // Clean up expired lockouts and normalize emails
    Object.keys(parsed).forEach((email) => {
      const normalizedEmail = normalizeEmail(email)
      const attempts = parsed[email]
      
      // If lockout has expired, don't include it
      if (attempts.lockoutUntil && now >= attempts.lockoutUntil) {
        return // Skip expired entries
      }
      
      cleaned[normalizedEmail] = attempts
    })
    
    // Save cleaned data back if anything was removed
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    }
    
    return cleaned
  } catch {
    return {}
  }
}

function getLoginAttempts(email: string): LoginAttempts {
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllLoginAttempts()
  return allAttempts[normalizedEmail] || { count: 0, lockoutUntil: null }
}

function saveLoginAttempts(email: string, attempts: LoginAttempts) {
  if (typeof window === 'undefined') return
  
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllLoginAttempts()
  allAttempts[normalizedEmail] = attempts
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allAttempts))
}

function incrementFailedAttempt(email: string): LoginAttempts {
  const attempts = getLoginAttempts(email)
  const newCount = attempts.count + 1
  
  let lockoutUntil: number | null = null
  
  if (newCount >= MAX_ATTEMPTS) {
    // If already locked out, extend the lockout
    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      lockoutUntil = attempts.lockoutUntil + LOCKOUT_DURATION
    } else {
      // New lockout
      lockoutUntil = Date.now() + LOCKOUT_DURATION
    }
  }
  
  const newAttempts: LoginAttempts = {
    count: newCount,
    lockoutUntil
  }
  
  saveLoginAttempts(email, newAttempts)
  return newAttempts
}

function resetLoginAttempts(email: string) {
  if (typeof window === 'undefined') return
  
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllLoginAttempts()
  delete allAttempts[normalizedEmail]
  
  if (Object.keys(allAttempts).length === 0) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allAttempts))
  }
}

// Password Reset Attempt Functions
function getAllResetAttempts(): AllLoginAttempts {
  if (typeof window === 'undefined') {
    return {}
  }
  
  const stored = localStorage.getItem(RESET_STORAGE_KEY)
  if (!stored) {
    return {}
  }
  
  try {
    const parsed = JSON.parse(stored) as AllLoginAttempts
    const now = Date.now()
    const cleaned: AllLoginAttempts = {}
    
    // Clean up expired lockouts and normalize emails
    Object.keys(parsed).forEach((email) => {
      const normalizedEmail = normalizeEmail(email)
      const attempts = parsed[email]
      
      // If lockout has expired, don't include it
      if (attempts.lockoutUntil && now >= attempts.lockoutUntil) {
        return // Skip expired entries
      }
      
      cleaned[normalizedEmail] = attempts
    })
    
    // Save cleaned data back if anything was removed
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(cleaned))
    }
    
    return cleaned
  } catch {
    return {}
  }
}

function getResetAttempts(email: string): LoginAttempts {
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllResetAttempts()
  return allAttempts[normalizedEmail] || { count: 0, lockoutUntil: null }
}

function saveResetAttempts(email: string, attempts: LoginAttempts) {
  if (typeof window === 'undefined') return
  
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllResetAttempts()
  allAttempts[normalizedEmail] = attempts
  localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(allAttempts))
}

function incrementResetAttempt(email: string): LoginAttempts {
  const attempts = getResetAttempts(email)
  const newCount = attempts.count + 1
  
  let lockoutUntil: number | null = null
  
  if (newCount >= MAX_RESET_ATTEMPTS) {
    // If already locked out, extend the lockout
    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      lockoutUntil = attempts.lockoutUntil + RESET_LOCKOUT_DURATION
    } else {
      // New lockout
      lockoutUntil = Date.now() + RESET_LOCKOUT_DURATION
    }
  }
  
  const newAttempts: LoginAttempts = {
    count: newCount,
    lockoutUntil
  }
  
  saveResetAttempts(email, newAttempts)
  return newAttempts
}

function resetResetAttempts(email: string) {
  if (typeof window === 'undefined') return
  
  const normalizedEmail = normalizeEmail(email)
  const allAttempts = getAllResetAttempts()
  delete allAttempts[normalizedEmail]
  
  if (Object.keys(allAttempts).length === 0) {
    localStorage.removeItem(RESET_STORAGE_KEY)
  } else {
    localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(allAttempts))
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [resetLockoutTime, setResetLockoutTime] = useState<number | null>(null)
  const [resetRemainingSeconds, setResetRemainingSeconds] = useState(0)

  useEffect(() => {
    // Check lockout status when email changes
    if (email) {
      const attempts = getLoginAttempts(email)
      if (attempts.lockoutUntil) {
        setLockoutTime(attempts.lockoutUntil)
      } else {
        setLockoutTime(null)
      }
    } else {
      setLockoutTime(null)
    }
  }, [email])

  useEffect(() => {
    if (!lockoutTime) {
      setRemainingSeconds(0)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.ceil((lockoutTime - now) / 1000)
      
      if (remaining <= 0) {
        setLockoutTime(null)
        setRemainingSeconds(0)
        if (email) {
          resetLoginAttempts(email)
        }
        return
      }
      
      setRemainingSeconds(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [lockoutTime, email])

  // Password Reset Lockout Timer
  useEffect(() => {
    if (!resetLockoutTime) {
      setResetRemainingSeconds(0)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.ceil((resetLockoutTime - now) / 1000)
      
      if (remaining <= 0) {
        setResetLockoutTime(null)
        setResetRemainingSeconds(0)
        if (forgotPasswordEmail) {
          resetResetAttempts(forgotPasswordEmail)
        }
        return
      }
      
      setResetRemainingSeconds(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [resetLockoutTime, forgotPasswordEmail])

  // Check reset lockout when email changes
  useEffect(() => {
    if (forgotPasswordEmail) {
      const attempts = getResetAttempts(forgotPasswordEmail)
      if (attempts.lockoutUntil) {
        setResetLockoutTime(attempts.lockoutUntil)
      } else {
        setResetLockoutTime(null)
      }
    } else {
      setResetLockoutTime(null)
    }
  }, [forgotPasswordEmail])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!email) {
      return
    }
    
    // Check if locked out for this specific email
    const attempts = getLoginAttempts(email)
    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      const remaining = Math.ceil((attempts.lockoutUntil - Date.now()) / 1000)
      toast({
        variant: "destructive",
        title: 'Too Many Failed Attempts',
        description: `Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before trying again.`,
      })
      setLockoutTime(attempts.lockoutUntil)
      return
    }

    setLoading(true)

    const { error } = await signInWithEmail(email, password)
    if (error) {
      const newAttempts = incrementFailedAttempt(email)
      
      if (newAttempts.lockoutUntil) {
        const remaining = Math.ceil((newAttempts.lockoutUntil - Date.now()) / 1000)
        setLockoutTime(newAttempts.lockoutUntil)
        toast({
          variant: "destructive",
          title: 'Too Many Failed Attempts',
          description: `You have exceeded ${MAX_ATTEMPTS} login attempts for this email. Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before trying again.`,
        })
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newAttempts.count
        toast({
          variant: "destructive",
          title: 'Login Failed',
          description: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining for this email.`,
        })
      }
      setLoading(false)
      return
    }

    // Successful login - reset attempts for this email only
    resetLoginAttempts(email)
    setLockoutTime(null)
    
    toast({
      title: 'Login Successful',
      description: 'Welcome back!',
    })
    
    // Wait a moment for session to be established before redirecting
    setTimeout(() => {
      router.push('/');
      router.refresh(); // Force a refresh to ensure session is loaded
    }, 100);
    
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: 'Email Required',
        description: 'Please enter your email address.',
      })
      return
    }

    // Check if locked out for password reset
    const attempts = getResetAttempts(forgotPasswordEmail)
    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      const remaining = Math.ceil((attempts.lockoutUntil - Date.now()) / 1000)
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      toast({
        variant: "destructive",
        title: 'Too Many Reset Requests',
        description: `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} before requesting another password reset.`,
      })
      setResetLockoutTime(attempts.lockoutUntil)
      return
    }

    setSendingReset(true)
    const { error } = await resetPasswordForEmail(forgotPasswordEmail)
    
    if (error) {
      const newAttempts = incrementResetAttempt(forgotPasswordEmail)
      
      // Handle specific error codes
      if (error.status === 429) {
        // Rate limit or email limit reached
        if (newAttempts.lockoutUntil) {
          const remaining = Math.ceil((newAttempts.lockoutUntil - Date.now()) / 1000)
          const minutes = Math.floor(remaining / 60)
          const seconds = remaining % 60
          setResetLockoutTime(newAttempts.lockoutUntil)
          toast({
            variant: "destructive",
            title: 'Too Many Reset Requests',
            description: `You have exceeded ${MAX_RESET_ATTEMPTS} password reset requests. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} before trying again.`,
          })
        } else {
          toast({
            variant: "destructive",
            title: 'Email Limit Reached',
            description: error.message || 'Daily or monthly email limit reached. Please try again later.',
          })
        }
      } else if (error.status === 400) {
        // Invalid email format
        toast({
          variant: "destructive",
          title: 'Invalid Email',
          description: error.message || 'Please enter a valid email address.',
        })
      } else {
        // Other errors
        if (newAttempts.lockoutUntil) {
          const remaining = Math.ceil((newAttempts.lockoutUntil - Date.now()) / 1000)
          const minutes = Math.floor(remaining / 60)
          const seconds = remaining % 60
          setResetLockoutTime(newAttempts.lockoutUntil)
          toast({
            variant: "destructive",
            title: 'Too Many Reset Requests',
            description: `You have exceeded ${MAX_RESET_ATTEMPTS} password reset requests. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} before trying again.`,
          })
        } else {
          const remainingAttempts = MAX_RESET_ATTEMPTS - newAttempts.count
          toast({
            variant: "destructive",
            title: 'Error',
            description: error.message || `Failed to send password reset email. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
          })
        }
      }
      setSendingReset(false)
      return
    }

    // Successful reset email sent - increment attempt
    const newAttempts = incrementResetAttempt(forgotPasswordEmail)
    
    // If this was the 3rd attempt, show lockout message
    if (newAttempts.lockoutUntil) {
      const remaining = Math.ceil((newAttempts.lockoutUntil - Date.now()) / 1000)
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      setResetLockoutTime(newAttempts.lockoutUntil)
      toast({
        title: 'Password Reset Email Sent',
        description: `Email sent! You've reached the limit of ${MAX_RESET_ATTEMPTS} requests. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before requesting another.`,
      })
    } else {
      const remainingAttempts = MAX_RESET_ATTEMPTS - newAttempts.count
      toast({
        title: 'Password Reset Email Sent',
        description: `Please check your email for password reset instructions. ${remainingAttempts} request${remainingAttempts !== 1 ? 's' : ''} remaining.`,
      })
    }
    
    setForgotPasswordOpen(false)
    setForgotPasswordEmail('')
    setSendingReset(false)
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
                <LogIn className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Welcome Back</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <div className="flex items-center justify-end">
                <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="grid gap-4 py-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          disabled={sendingReset}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={sendingReset || (resetLockoutTime !== null && Date.now() < resetLockoutTime)}
                        className="w-full"
                      >
                        {resetLockoutTime && Date.now() < resetLockoutTime ? (
                          <>
                            <Clock className="mr-2 h-4 w-4" />
                            Wait {Math.floor(resetRemainingSeconds / 60)}m {resetRemainingSeconds % 60}s
                          </>
                        ) : sendingReset ? (
                          <>
                            <Mail className="mr-2 h-4 w-4 animate-pulse" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reset Link
                          </>
                        )}
                      </Button>
                      {resetLockoutTime && Date.now() < resetLockoutTime && (
                        <p className="text-xs text-center text-destructive mt-2">
                          Too many reset requests. Please wait {Math.floor(resetRemainingSeconds / 60)} minute{Math.floor(resetRemainingSeconds / 60) !== 1 ? 's' : ''} and {resetRemainingSeconds % 60} second{(resetRemainingSeconds % 60) !== 1 ? 's' : ''} before trying again.
                        </p>
                      )}
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                type="submit"
                disabled={loading || (lockoutTime !== null && Date.now() < lockoutTime)}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {lockoutTime && Date.now() < lockoutTime ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-pulse" />
                    Please wait {remainingSeconds}s
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    {loading ? 'Logging in...' : 'Sign In'}
                  </>
                )}
              </Button>
              
              {lockoutTime && Date.now() < lockoutTime && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-center text-destructive font-medium">
                    Too many failed attempts. Please wait {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''} before trying again.
                  </p>
                </div>
              )}
            </form>
            
            <div className="pt-4 border-t">
              <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Create one now
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