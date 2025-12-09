'use client'

import { useState } from 'react'
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
import { LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const { error } = await signInWithEmail(email, password)
    if (error) {
      toast({
        variant: "destructive",
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Login Successful',
      description: 'Welcome back!',
    })
    router.push('/');
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 scrollable flex items-center justify-center px-4 pb-14">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
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
                <Label htmlFor="password">Password</Label>
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
             <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  )
}
