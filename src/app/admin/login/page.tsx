
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
import { useAuth } from '@/context/AuthContext'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signInAdmin } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const success = signInAdmin(email, password)

    if (success) {
      toast({
        title: 'Login Successful',
        description: 'Welcome, Admin!',
        className: 'bg-green-500 text-white',
      })
      router.push('/admin')
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader showLogo />

      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-2xl">Administrator Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
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
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  )
}
