
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 relative">
        <Image
          src="https://picsum.photos/seed/terms/1200/800"
          alt="Terms and Conditions"
          fill
          style={{ objectFit: "contain" }}
          quality={100}
          data-ai-hint="document agreement"
        />
      </main>
      <AppFooter />
    </div>
  );
}
