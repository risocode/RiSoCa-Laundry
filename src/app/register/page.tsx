'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'

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
import { UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    const firstName = String(formData.get('firstName'))
    const lastName = String(formData.get('lastName'))

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (signUpData.user) {
        const { error: profileError } = await supabase
            .from('users')
            .update({ first_name: firstName, last_name: lastName })
            .eq('id', signUpData.user.id)
        
        if (profileError) {
            setLoading(false)
            setError(profileError.message)
            // Optional: handle user cleanup if profile creation fails
            return
        }
    }


    setLoading(false)

    // Show success toast and start countdown
    let countdown = 3;
    const { id: toastId, update } = toast({
      variant: 'default',
      title: 'Signup Successful!',
      description: `Redirecting to login in ${countdown}s...`,
      className: 'bg-green-500 text-white',
    });

    const interval = setInterval(() => {
      countdown -= 1;
      update({ id: toastId, description: `Redirecting to login in ${countdown}s...` });
      if (countdown === 0) {
        clearInterval(interval);
        router.push('/login');
      }
    }, 1000);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader showLogo />

      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Max"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Robinson"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? 'Creating account...' : 'Create an account'}
              </Button>
            </form>

            {error && (
              <p className="mt-3 text-center text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="mt-3 text-center text-xs">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  )
}
