
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-hidden flex items-center justify-center container mx-auto px-4">
        <Card className="w-full max-w-lg">
            <CardHeader className="p-4">
                <CardTitle className="text-2xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <form className="space-y-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your Name" />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Your Email" />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="Your message..." className="min-h-[60px]" />
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground">
                       <Send className="mr-2 h-4 w-4"/> Send Message
                    </Button>
                </form>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
