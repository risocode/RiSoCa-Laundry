
import { Facebook, Twitter, Instagram } from 'lucide-react';
import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="w-full py-4 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} RKR Laundry. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Link href="#" className="hover:text-primary"><Facebook className="h-5 w-5" /></Link>
          <Link href="#" className="hover:text-primary"><Twitter className="h-5 w-5" /></Link>

          <Link href="#" className="hover:text-primary"><Instagram className="h-5 w-5" /></Link>
        </div>
      </div>
    </footer>
  );
}
