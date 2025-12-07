
import { Facebook, Mail } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 w-full py-2 md:py-4 px-4 bg-background/95 border-t">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </a>
          <a href="mailto:risoca2025@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
            <Mail className="h-5 w-5" />
            <span className="sr-only">Email</span>
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} RKR Laundry. All rights reserved.</p>
      </div>
    </footer>
  );
}
