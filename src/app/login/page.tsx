
'use client'

import { useState } from 'react'
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
import { LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      
      if (!signInData.user) {
        throw new Error("Login failed, please try again.");
      }

      // After successful sign-in, fetch the user's role from the `profiles` table
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user.id)
        .single();
      
      if (profileError) {
        // Handle case where profile doesn't exist or there's an error,
        // but the user is authenticated. Default to customer role.
        console.error("Error fetching user role, defaulting to customer.", profileError);
      }
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        className: 'bg-green-500 text-white',
      })

      if (userProfile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: 'Login Failed',
            description: error.message || 'Please check your credentials and try again.',
        })
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader showLogo />

      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  )
}
