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
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                // Helper function to check if error is from ad network
                function isAdNetworkError(message) {
                  if (!message) return false;
                  const msg = String(message).toLowerCase();
                  return (
                    msg.includes('err_name_not_resolved') ||
                    msg.includes('dsp.360yield.com') ||
                    msg.includes('360yield') ||
                    msg.includes('net::err_name_not_resolved') ||
                    (msg.includes('failed to load resource') && (msg.includes('dsp') || msg.includes('yield'))) ||
                    (msg.includes('get') && msg.includes('dsp.360yield.com')) ||
                    (msg.includes('cookie_push_onload'))
                  );
                }
                
                console.error = function(...args) {
                  const errorMessage = args.join(' ');
                  if (isAdNetworkError(errorMessage)) {
                    // Silently ignore - these are non-critical ad network errors
                    return;
                  }
                  // Log all other errors normally
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const warnMessage = args.join(' ');
                  if (isAdNetworkError(warnMessage)) {
                    // Silently ignore - these are non-critical ad network warnings
                    return;
                  }
                  // Log all other warnings normally
                  originalWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  const logMessage = args.join(' ');
                  // Suppress ad network logs but keep other logs
                  if (isAdNetworkError(logMessage)) {
                    return;
                  }
                  originalLog.apply(console, args);
                };
                
                // Suppress network errors in window error handler
                window.addEventListener('error', function(event) {
                  const errorMsg = event.message || event.filename || '';
                  if (isAdNetworkError(errorMsg)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Suppress unhandled promise rejections from ad networks
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason?.message || event.reason?.toString() || '';
                  if (isAdNetworkError(reason)) {
                    event.preventDefault();
                    return false;
                  }
                });
                
                // Prevent AdSense Auto Ads from causing layout shift
                // Monitor for ad insertion and make them fixed position below header
                function preventAdLayoutShift() {
                  // Find header height (default to 64px for h-16)
                  const header = document.querySelector('header');
                  const headerHeight = header ? header.offsetHeight : 64;
                  
                  // Find all AdSense ads
                  const ads = document.querySelectorAll('ins.adsbygoogle');
                  ads.forEach(function(ad) {
                    // Make ads fixed position so they don't push content down
                    // Position them below the header
                    if (ad.parentElement === document.body || ad.parentElement === null) {
                      ad.style.position = 'fixed';
                      ad.style.top = headerHeight + 'px';
                      ad.style.left = '0';
                      ad.style.width = '100%';
                      ad.style.zIndex = '998';
                      ad.style.margin = '0';
                      ad.style.padding = '0';
                      ad.style.border = 'none';
                      
                      // Only show if ad is filled
                      const adStatus = ad.getAttribute('data-ad-status');
                      if (adStatus !== 'filled') {
                        ad.style.display = 'none';
                      } else {
                        ad.style.display = 'block';
                      }
                    }
                  });
                }
                
                // Run immediately
                preventAdLayoutShift();
                
                // Monitor for new ads being inserted
                const adObserver = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'INS' && node.classList.contains('adsbygoogle')) {
                          preventAdLayoutShift();
                        }
                        // Also check for ads inside added nodes
                        const ads = node.querySelectorAll && node.querySelectorAll('ins.adsbygoogle');
                        if (ads && ads.length > 0) {
                          preventAdLayoutShift();
                        }
                      }
                    });
                  });
                });
                
                // Observe body for ad insertions
                adObserver.observe(document.body, {
                  childList: true,
                  subtree: true
                });
                
                // Also observe when ad status changes
                const statusObserver = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                      preventAdLayoutShift();
                    }
                  });
                });
                
                // Observe all ads for status changes
                document.querySelectorAll('ins.adsbygoogle').forEach(function(ad) {
                  statusObserver.observe(ad, {
                    attributes: true,
                    attributeFilter: ['data-ad-status']
                  });
                });
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
