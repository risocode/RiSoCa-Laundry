import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { PromoProviderWrapper } from '@/components/promo-provider-wrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'RKR Laundry Service',
  description: 'Fast, clean, and convenient laundry service at rkrlaundry.com. Real-time tracking for your laundry needs.',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      { rel: 'icon', url: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', url: '/icons/favicon.ico', sizes: 'any' },
      { rel: 'icon', url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    shortcut: [
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  themeColor: '#6d28d9',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RKR Laundry',
  },
  openGraph: {
    title: 'RKR Laundry Service',
    description: 'Fast, clean, and convenient laundry service at rkrlaundry.com. Real-time tracking and smart pricing for your laundry needs.',
    url: 'https://rkrlaundry.com',
    siteName: 'RKR Laundry',
    images: [
      {
        url: 'https://rkrlaundry.com/icons/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'RKR Laundry Service',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RKR Laundry Service',
    description: 'Fast, clean, and convenient laundry service at rkrlaundry.com. Real-time tracking and smart pricing for your laundry needs.',
    images: ['https://rkrlaundry.com/icons/android-chrome-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        {/* Root-level favicon for Chrome fallback */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Additional favicon formats */}
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* TWA (Trusted Web Activity) Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RKR Laundry" />
        <meta name="application-name" content="RKR Laundry" />
        <meta name="msapplication-TileColor" content="#6d28d9" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        {/* Open Graph / Facebook / Messenger */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rkrlaundry.com" />
        <meta property="og:title" content="RKR Laundry Service" />
        <meta property="og:description" content="Fast, clean, and convenient laundry service at rkrlaundry.com. Real-time tracking and smart pricing for your laundry needs." />
        <meta property="og:image" content="https://rkrlaundry.com/icons/android-chrome-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="RKR Laundry Service" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RKR Laundry Service" />
        <meta name="twitter:description" content="Fast, clean, and convenient laundry service at rkrlaundry.com. Real-time tracking and smart pricing for your laundry needs." />
        <meta name="twitter:image" content="https://rkrlaundry.com/icons/android-chrome-512x512.png" />
        {/* Google AdSense Auto Ads */}
        {/* 
          Auto Ads are automatically enabled by the client parameter in the script URL.
          DO NOT manually push enable_page_level_ads - it causes duplicate errors.
          The script URL with ?client=ca-pub-XXXXX automatically initializes Auto Ads.
          Publisher ID matches ads.txt: pub-1482729173853463
        */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
          crossOrigin="anonymous"
          data-ad-client="ca-pub-1482729173853463"
        />
      </head>
      <body className="font-body antialiased flex flex-col h-screen overflow-hidden">
        {/* Prevent aria-hidden on body element - accessibility fix */}
        {/* Suppress non-critical third-party ad network errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Monitor and prevent aria-hidden from being set on body
                const body = document.body;
                if (!body) return;
                
                // Remove aria-hidden if it exists
                if (body.hasAttribute('aria-hidden')) {
                  body.removeAttribute('aria-hidden');
                }
                
                // Use MutationObserver to prevent aria-hidden from being set on body
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                      if (body.getAttribute('aria-hidden') === 'true') {
                        body.removeAttribute('aria-hidden');
                        console.warn('Removed aria-hidden from body element - this violates accessibility guidelines');
                      }
                    }
                  });
                });
                
                observer.observe(body, {
                  attributes: true,
                  attributeFilter: ['aria-hidden']
                });
                
                // Suppress non-critical third-party ad network errors
                // These errors come from Google AdSense's ad partners and don't affect site functionality
                const originalError = console.error;
                console.error = function(...args) {
                  const errorMessage = args.join(' ');
                  // Suppress DNS resolution errors from third-party ad networks
                  if (
                    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
                    errorMessage.includes('dsp.360yield.com') ||
                    errorMessage.includes('net::ERR_NAME_NOT_RESOLVED') ||
                    (errorMessage.includes('Failed to load resource') && errorMessage.includes('dsp'))
                  ) {
                    // Silently ignore - these are non-critical ad network errors
                    return;
                  }
                  // Log all other errors normally
                  originalError.apply(console, args);
                };
                
                // Also suppress network errors in window error handler
                window.addEventListener('error', function(event) {
                  if (
                    event.message &&
                    (
                      event.message.includes('ERR_NAME_NOT_RESOLVED') ||
                      event.message.includes('dsp.360yield.com') ||
                      event.message.includes('net::ERR_NAME_NOT_RESOLVED')
                    )
                  ) {
                    event.preventDefault();
                    return false;
                  }
                }, true);
              })();
            `,
          }}
        />
        <PromoProviderWrapper>
          {children}
          <Toaster />
          <CookieConsentBanner />
        </PromoProviderWrapper>
      </body>
    </html>
  );
}
