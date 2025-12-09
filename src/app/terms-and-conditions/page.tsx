import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
          <div className="relative w-full max-w-4xl min-h-[400px] md:min-h-[600px]">
        <Image
              src="/terms_and_conditions.jpg"
          alt="Terms and Conditions"
          fill
          style={{ objectFit: "contain" }}
          quality={100}
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
