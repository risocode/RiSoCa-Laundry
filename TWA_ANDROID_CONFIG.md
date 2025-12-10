# TWA Android App Configuration Quick Reference

## 🔑 Critical Configuration Values

### Package Name
```
com.rkrlaundry.app
```
**Must match exactly in:**
- Android app's `AndroidManifest.xml` or `twa-manifest.json`
- `assetlinks.json` file

### SHA-256 Certificate Fingerprint
```
24:78:7D:90:59:EB:00:4F:9B:B4:2E:BE:55:DF:F8:B0:E7:47:D3:B4:DB:11:23:8D:E1:5C:83:2E:7A:D6:E5:50
```
**Must match exactly in:**
- `assetlinks.json` file
- Your release signing key certificate

### Website URLs
- **Start URL:** `https://rkrlaundry.com/`
- **Scope:** `https://rkrlaundry.com/`
- **Host:** `rkrlaundry.com`

### Digital Asset Links
- **URL:** `https://rkrlaundry.com/.well-known/assetlinks.json`
- **Verification:** Use Google's Digital Asset Links API or test in Chrome

### App Details
- **Name:** RKR Laundry
- **Short Name:** RKR Laundry
- **Theme Color:** `#6d28d9`
- **Background Color:** `#f3e8ff`
- **Display Mode:** `standalone`
- **Orientation:** `portrait-primary`

### Icons
- **192x192:** `https://rkrlaundry.com/icons/android-chrome-192x192.png`
- **512x512:** `https://rkrlaundry.com/icons/android-chrome-512x512.png`

## 📱 Bubblewrap Configuration Example

If using Bubblewrap, here's a complete `twa-manifest.json`:

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
      "icons": [
        {
          "src": "https://rkrlaundry.com/icons/android-chrome-192x192.png",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "Track Order",
      "shortName": "Track",
      "url": "/order-status",
      "icons": [
        {
          "src": "https://rkrlaundry.com/icons/android-chrome-192x192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

## ✅ Pre-Submission Checklist

Before submitting to Play Store:

- [ ] Package name is `com.rkrlaundry.app`
- [ ] SHA-256 fingerprint matches assetlinks.json
- [ ] Start URL is `https://rkrlaundry.com/`
- [ ] App is signed with release key
- [ ] Target SDK is 33+ (recommended)
- [ ] Minimum SDK is 21+
- [ ] App opens in full-screen (no browser UI)
- [ ] Digital Asset Links verification passes
- [ ] Privacy Policy URL: `https://rkrlaundry.com/privacy-policy`

## 🔍 Verification Commands

### Test assetlinks.json:
```bash
curl https://rkrlaundry.com/.well-known/assetlinks.json
```

### Test manifest.json:
```bash
curl https://rkrlaundry.com/manifest.json
```

### Verify Digital Asset Links:
Visit in browser:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://rkrlaundry.com&relation=delegate_permission/common.handle_all_urls
```

## ⚠️ Important Reminders

1. **Use Release Key Fingerprint:** The SHA-256 in assetlinks.json must be from your **release signing key**, not debug key.

2. **Package Name Must Match:** If your Android app uses a different package name, update `assetlinks.json` accordingly.

3. **HTTPS Required:** All URLs must use HTTPS (already configured).

4. **Cache Wait Time:** After updating assetlinks.json, wait 24-48 hours for Google to cache the changes.

5. **Test Before Submission:** Build a debug APK and test on a real device before submitting to Play Store.

