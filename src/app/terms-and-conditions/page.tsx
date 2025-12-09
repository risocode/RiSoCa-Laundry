
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 relative pb-14 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Image
          src="/terms_and_conditions.jpg"
          alt="Terms and Conditions"
          fill
          style={{ objectFit: "contain" }}
          quality={100}
        />
      </main>
      <AppFooter />
    </div>
  );
}
