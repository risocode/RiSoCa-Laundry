
import { Facebook, Mail } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="w-full py-2 md:py-4">
      <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground px-4">
        <p>&copy; {new Date().getFullYear()} RKR Laundry. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Facebook</span>
          </a>
          <a href="mailto:risoca2025@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
            <Mail className="h-4 w-4" />
            <span className="sr-only">Email</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
