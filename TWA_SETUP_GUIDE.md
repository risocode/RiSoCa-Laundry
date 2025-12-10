# TWA (Trusted Web Activity) Setup Guide for RKR Laundry

## 📱 Overview

This guide documents the complete TWA (Trusted Web Activity) integration for the RKR Laundry app, enabling it to be published on the Google Play Store as a native Android app that wraps your web application.

## ✅ What's Already Configured

### 1. Digital Asset Links (`assetlinks.json`)
**Location:** `public/.well-known/assetlinks.json`

**Current Configuration:**
```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.rkrlaundry.app",
      "sha256_cert_fingerprints": [
        "24:78:7D:90:59:EB:00:4F:9B:B4:2E:BE:55:DF:F8:B0:E7:47:D3:B4:DB:11:23:8D:E1:5C:83:2E:7A:D6:E5:50"
      ]
    }
  }
]
```

**What it does:**
- Establishes trust between your Android app and your website
- Allows the Android app to handle all URLs from your domain
- Enables credential sharing between the app and web

**Verification:**
- Accessible at: `https://rkrlaundry.com/.well-known/assetlinks.json`
- Route handler backup: `src/app/.well-known/assetlinks.json/route.ts`

### 2. Web App Manifest (`manifest.json`)
**Location:** `public/manifest.json`

**Enhanced with TWA-specific fields:**
- ✅ `display: "standalone"` - Full-screen experience
- ✅ `orientation: "portrait-primary"` - Preferred orientation
- ✅ `categories: ["lifestyle", "business"]` - App store categories
- ✅ `shortcuts` - Quick actions for Android
- ✅ Proper icon configuration with maskable icons

### 3. Meta Tags
**Location:** `src/app/layout.tsx`

**TWA-specific meta tags added:**
- `mobile-web-app-capable` - Enables mobile web app mode
- `apple-mobile-web-app-capable` - iOS support
- `application-name` - App name
- `msapplication-TileColor` - Windows tile color
- `theme-color` - Status bar color

### 4. HTTP Headers
**Location:** `next.config.ts` and `vercel.json`

**Configured headers:**
- Content-Type: `application/json` for `.well-known` paths
- Content-Type: `application/manifest+json` for manifest
- Cache-Control headers for optimal performance
- CORS headers for assetlinks.json

## 🔧 Android App Configuration

### Required Android App Settings

When building your Android app (using Android Studio or Bubblewrap), ensure:

1. **Package Name:** `com.rkrlaundry.app`
   - Must match the `package_name` in `assetlinks.json`
   - Set in `AndroidManifest.xml` or `twa-manifest.json` (if using Bubblewrap)

2. **SHA-256 Certificate Fingerprint:**
   ```
   24:78:7D:90:59:EB:00:4F:9B:B4:2E:BE:55:DF:F8:B0:E7:47:D3:B4:DB:11:23:8D:E1:5C:83:2E:7A:D6:E5:50
   ```
   - This is your **release signing key** fingerprint
   - Must match exactly in `assetlinks.json`

3. **Start URL:** `https://rkrlaundry.com/`
   - Must match your `start_url` in `manifest.json`

4. **Scope:** `https://rkrlaundry.com/`
   - Must match your `scope` in `manifest.json`

### Getting Your SHA-256 Fingerprint

**For Release Key:**
```bash
# If using keytool
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias

# If using Google Play App Signing
# Get it from Google Play Console > App Signing > App signing key certificate
```

**For Debug Key (testing only):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 📋 Play Store Submission Checklist

### Before Building Your Android App:

- [x] ✅ `assetlinks.json` configured and accessible
- [x] ✅ `manifest.json` properly configured
- [x] ✅ TWA meta tags added
- [x] ✅ HTTPS enabled (required for TWA)
- [x] ✅ Privacy policy page exists
- [x] ✅ Icons (192x192 and 512x512) available

### Android App Requirements:

- [ ] Package name matches: `com.rkrlaundry.app`
- [ ] SHA-256 fingerprint matches assetlinks.json
- [ ] Start URL: `https://rkrlaundry.com/`
- [ ] App signed with release key
- [ ] Target SDK: 33 or higher (recommended)
- [ ] Minimum SDK: 21 or higher

### Play Store Listing:

- [ ] App name: "RKR Laundry"
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] Privacy Policy URL: `https://rkrlaundry.com/privacy-policy`
- [ ] Category: Lifestyle or Business
- [ ] Screenshots (required)
- [ ] Feature graphic (required)
- [ ] App icon (512x512)

## 🚀 Building Your Android App

### Option 1: Using Bubblewrap (Recommended)

Bubblewrap is Google's official tool for creating TWA apps.

1. **Install Bubblewrap:**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize project:**
   ```bash
   bubblewrap init --manifest https://rkrlaundry.com/manifest.json
   ```

3. **Update `twa-manifest.json`:**
   ```json
   {
     "packageId": "com.rkrlaundry.app",
     "host": "rkrlaundry.com",
     "name": "RKR Laundry",
     "launcherName": "RKR Laundry",
     "display": "standalone",
     "themeColor": "#6d28d9",
     "navigationColor": "#6d28d9",
     "backgroundColor": "#f3e8ff",
     "enableNotifications": false,
     "startUrl": "/",
     "iconUrl": "https://rkrlaundry.com/icons/android-chrome-512x512.png",
     "maskableIconUrl": "https://rkrlaundry.com/icons/android-chrome-512x512.png",
     "monochromeIconUrl": "https://rkrlaundry.com/icons/android-chrome-512x512.png",
     "splashScreenFadeOutDuration": 300,
     "signingKey": {
       "path": "./android.keystore",
       "alias": "rkr-laundry"
     },
     "appVersionName": "1.0.0",
     "appVersionCode": 1,
     "shortcuts": [
       {
         "name": "Create Order",
         "shortName": "New Order",
         "url": "/create-order",
         "icons": [{"src": "https://rkrlaundry.com/icons/android-chrome-192x192.png", "sizes": "192x192"}]
       },
       {
         "name": "Track Order",
         "shortName": "Track",
         "url": "/order-status",
         "icons": [{"src": "https://rkrlaundry.com/icons/android-chrome-192x192.png", "sizes": "192x192"}]
       }
     ]
   }
   ```

4. **Build the app:**
   ```bash
   bubblewrap build
   ```

5. **Generate signed AAB:**
   ```bash
   bubblewrap build --mode release
   ```

### Option 2: Using Android Studio

1. Create a new Android project
2. Add TWA library dependency
3. Configure `AndroidManifest.xml`
4. Set up Digital Asset Links
5. Build and sign the app

## 🔍 Verification Steps

### 1. Verify assetlinks.json is accessible:
```bash
curl https://rkrlaundry.com/.well-known/assetlinks.json
```

Should return your assetlinks.json content with proper headers.

### 2. Verify manifest.json:
```bash
curl https://rkrlaundry.com/manifest.json
```

Should return your manifest with `Content-Type: application/manifest+json`.

### 3. Test Digital Asset Links:
Use Google's Digital Asset Links API:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://rkrlaundry.com&relation=delegate_permission/common.handle_all_urls
```

### 4. Test TWA locally:
- Build debug APK
- Install on Android device
- Verify it opens in full-screen mode
- Verify no browser UI appears

## ⚠️ Common Issues & Solutions

### Issue 1: "Digital Asset Links verification failed"

**Solution:**
- Ensure `assetlinks.json` is accessible at `https://rkrlaundry.com/.well-known/assetlinks.json`
- Verify SHA-256 fingerprint matches exactly (no spaces, colons only)
- Ensure you're using the **release** signing key fingerprint, not debug
- Wait 24-48 hours after deployment for Google to cache the file

### Issue 2: "App opens in browser instead of full-screen"

**Solution:**
- Verify `display: "standalone"` in manifest.json
- Check that start_url and scope match exactly
- Ensure HTTPS is enabled
- Clear app data and reinstall

### Issue 3: "Assetlinks.json returns 404"

**Solution:**
- Check `public/.well-known/assetlinks.json` exists
- Verify `next.config.ts` headers are configured
- Check `vercel.json` rewrites (if using Vercel)
- Ensure route handler at `src/app/.well-known/assetlinks.json/route.ts` works

### Issue 4: "SHA-256 fingerprint mismatch"

**Solution:**
- Get the correct fingerprint from your release keystore
- Update `assetlinks.json` with the correct fingerprint
- Redeploy the file
- Wait for cache to clear

## 📝 Important Notes

1. **Package Name Consistency:**
   - Your `assetlinks.json` uses: `com.rkrlaundry.app`
   - Your compliance report mentions: `com.rkrlaundry.twa`
   - **Action Required:** Ensure your Android app uses `com.rkrlaundry.app` to match assetlinks.json, OR update assetlinks.json to match your app's package name

2. **SHA-256 Fingerprint:**
   - The fingerprint in `assetlinks.json` must match your **release signing key**
   - If using Google Play App Signing, use the **App signing key certificate** fingerprint from Play Console
   - Debug keys won't work in production

3. **HTTPS Required:**
   - TWA requires HTTPS (already configured)
   - All assets must be served over HTTPS

4. **Cache Considerations:**
   - Google caches assetlinks.json for 24-48 hours
   - Changes may take time to propagate
   - Use Google's Digital Asset Links API to verify immediately

## 🔗 Useful Resources

- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [PWA Builder](https://www.pwabuilder.com/)
- [Google Play Console](https://play.google.com/console)

## 📞 Support

If you encounter issues:
1. Check this guide's "Common Issues" section
2. Verify all configuration files match
3. Test assetlinks.json accessibility
4. Verify SHA-256 fingerprint matches
5. Check Google Play Console for specific errors

---

**Last Updated:** December 2024  
**App Package:** com.rkrlaundry.app  
**Domain:** rkrlaundry.com

