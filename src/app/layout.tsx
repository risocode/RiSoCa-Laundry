import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { PromoProviderWrapper } from '@/components/promo-provider-wrapper';
import { AdBanner } from '@/components/ad-banner';
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
                // Move in-page ads into the ad banner container
                // Allow overlay formats (anchor, vignette) to work normally
                function manageAdPlacement() {
                  // Find header height (default to 64px for h-16)
                  const header = document.querySelector('header');
                  const headerHeight = header ? header.offsetHeight : 64;
                  
                  // Find ad banner container
                  const adContainer = document.getElementById('ad-banner-container');
                  
                  // Find all AdSense ads that are direct children of body
                  const ads = document.querySelectorAll('body > ins.adsbygoogle');
                  ads.forEach(function(ad) {
                    // Only process ads that are direct children of body
                    if (ad.parentElement === document.body) {
                      const adStatus = ad.getAttribute('data-ad-status');
                      
                      // Check if this is an overlay format (anchor or vignette)
                      const isAnchorAd = ad.hasAttribute('data-anchor-type') || ad.hasAttribute('data-anchor-status');
                      const isVignette = ad.hasAttribute('data-vignette-status');
                      
                      // Allow overlay formats to work normally - don't move them
                      if (isAnchorAd || isVignette) {
                        // Ensure proper z-index for overlay ads
                        if (isAnchorAd) {
                          ad.style.zIndex = '997';
                        } else if (isVignette) {
                          ad.style.zIndex = '996';
                        }
                        return; // Don't process overlay ads
                      }
                      
                      // Hide unfilled in-page ads
                      if (adStatus !== 'filled') {
                        ad.style.display = 'none';
                        return;
                      }
                      
                      // Move filled in-page ads to the ad banner container if it exists
                      if (adContainer && !adContainer.contains(ad)) {
                        // Remove any positioning styles
                        ad.style.position = '';
                        ad.style.top = '';
                        ad.style.left = '';
                        ad.style.width = '';
                        ad.style.zIndex = '';
                        ad.style.margin = '';
                        ad.style.padding = '';
                        ad.style.border = '';
                        ad.style.display = 'block';
                        
                        // Move ad to container
                        adContainer.appendChild(ad);
                      } else if (!adContainer) {
                        // If container doesn't exist yet, keep ad hidden
                        ad.style.display = 'none';
                      }
                    }
                  });
                }
                
                // Run immediately
                manageAdPlacement();
                
                // Monitor for new ads being inserted
                const adObserver = new MutationObserver(function(mutations) {
                  let shouldUpdate = false;
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'INS' && node.classList.contains('adsbygoogle')) {
                          shouldUpdate = true;
                        }
                      }
                    });
                    // Also check for status changes
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                      shouldUpdate = true;
                    }
                  });
                  if (shouldUpdate) {
                    manageAdPlacement();
                  }
                });
                
                // Observe body for ad insertions and status changes
                adObserver.observe(document.body, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['data-ad-status']
                });
                
                // Also observe the ad container when it's created
                const containerObserver = new MutationObserver(function() {
                  manageAdPlacement();
                });
                
                // Check for container periodically (in case it's created later)
                const checkContainer = setInterval(function() {
                  const adContainer = document.getElementById('ad-banner-container');
                  if (adContainer) {
                    containerObserver.observe(adContainer, {
                      childList: true,
                      subtree: true
                    });
                    manageAdPlacement();
                    clearInterval(checkContainer);
                  }
                }, 100);
                
                // Clean up after 10 seconds
                setTimeout(function() {
                  clearInterval(checkContainer);
                }, 10000);
              })();
            `,
          }}
        />
        <PromoProviderWrapper>
          <AdBanner />
          {children}
          <Toaster />
          <CookieConsentBanner />
        </PromoProviderWrapper>
      </body>
    </html>
  );
}
