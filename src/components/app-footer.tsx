'use client';

import { Facebook, Mail } from 'lucide-react';
import Link from 'next/link';
import { TermsModal } from '@/components/terms-modal';

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full min-h-[3.5rem] py-2 px-4 bg-background/95 border-t z-10 backdrop-blur-sm">
      <div className="container mx-auto flex flex-wrap items-center justify-center text-xs sm:text-sm text-muted-foreground gap-x-4 gap-y-1">
        <p className="text-center">&copy; {new Date().getFullYear()} RKR Laundry. All rights reserved.</p>
        <div className="flex items-center gap-x-3">
          <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors underline">
            Privacy Policy
          </Link>
          <TermsModal>
            <button className="text-muted-foreground hover:text-primary transition-colors underline">
              Terms & Conditions
            </button>
          </TermsModal>
          <div className="flex items-center space-x-2">
          <div className="text-muted-foreground opacity-50 cursor-not-allowed" title="Facebook page coming soon">
              <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Facebook</span>
            </div>
            <a href="mailto:support@rkrlaundry.com" className="text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Footer height constant for padding calculations (approximately 48px with padding)
export const FOOTER_HEIGHT = '3.5rem';
