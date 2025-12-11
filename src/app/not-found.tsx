'use client';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { NotFound404 } from '@/components/not-found-404';

export default function NotFound() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
          <NotFound404 />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

