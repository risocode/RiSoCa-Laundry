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
        {/* Google AdSense Auto Ads - Only on pages with sufficient content */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1036864152624333"
          crossOrigin="anonymous"
        />
        <script
          id="adsense-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // CRITICAL: Set flag IMMEDIATELY before any other operations
                if (window.__adsbygoogle_page_level_initialized) {
                  return;
                }
                window.__adsbygoogle_page_level_initialized = true;
                
                // Initialize adsbygoogle array if it doesn't exist
                window.adsbygoogle = window.adsbygoogle || [];
                
                // Helper function to check if page level ads already exist
                function hasPageLevelAds() {
                  if (!window.adsbygoogle || !Array.isArray(window.adsbygoogle)) {
                    return false;
                  }
                  try {
                    for (var i = 0; i < window.adsbygoogle.length; i++) {
                      var item = window.adsbygoogle[i];
                      if (item && typeof item === 'object' && item.enable_page_level_ads === true) {
                        return true;
                      }
                    }
                  } catch (e) {
                    return false;
                  }
                  return false;
                }
                
                // Check immediately if already pushed - if so, we're done
                if (hasPageLevelAds()) {
                  return;
                }
                
                // Pages with minimal content that should not show ads
                var minimalContentPages = [
                  '/select-location',
                  '/download-app',
                  '/branches',
                  '/contact-us',
                  '/admin',
                  '/employee',
                  '/login',
                  '/register',
                  '/reset-password',
                  '/profile',
                  '/delete-account',
                  '/my-orders',
                  '/customer-ratings',
                  '/rating/',
                  '/privacy-policy',
                  '/terms-and-conditions',
                ];
                
                // Check if current page should have ads
                var path = window.location.pathname;
                var shouldShowAds = true;
                for (var j = 0; j < minimalContentPages.length; j++) {
                  if (path.startsWith(minimalContentPages[j])) {
                    shouldShowAds = false;
                    break;
                  }
                }
                if (path.startsWith('/admin/') || path.startsWith('/employee/')) {
                  shouldShowAds = false;
                }
                
                if (!shouldShowAds) {
                  return;
                }
                
                // Single function to push - will only execute once due to flag
                function pushPageLevelAdsOnce() {
                  // Double-check flag and state
                  if (window.__adsbygoogle_push_executed) {
                    return;
                  }
                  
                  // Check if already pushed
                  if (hasPageLevelAds()) {
                    window.__adsbygoogle_push_executed = true;
                    return;
                  }
                  
                  // Mark as executed BEFORE pushing
                  window.__adsbygoogle_push_executed = true;
                  
                  try {
                    window.adsbygoogle.push({
                      google_ad_client: "ca-pub-1036864152624333",
                      enable_page_level_ads: true
                    });
                  } catch (e) {
                    // Error already logged by AdSense, just prevent further attempts
                  }
                }
                
                // Execute once when script is ready
                if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
                  pushPageLevelAdsOnce();
                } else {
                  // Wait for script to load, but only try once
                  var triedOnce = false;
                  var checkInterval = setInterval(function() {
                    if (triedOnce) {
                      clearInterval(checkInterval);
                      return;
                    }
                    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
                      triedOnce = true;
                      clearInterval(checkInterval);
                      pushPageLevelAdsOnce();
                    }
                  }, 100);
                  
                  // Timeout after 3 seconds
                  setTimeout(function() {
                    clearInterval(checkInterval);
                  }, 3000);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased flex flex-col h-screen overflow-hidden">
        <PromoProviderWrapper>
          {children}
          <Toaster />
          <CookieConsentBanner />
        </PromoProviderWrapper>
      </body>
    </html>
  );
}
