# AdSense Ad Units Setup Guide for RKR Laundry

This guide will help you set up AdSense ad units for your website in a way that's responsive and user-friendly.

## 📋 Step-by-Step Setup Instructions

### Step 1: Create Ad Units in AdSense Dashboard

1. Go to your [AdSense Dashboard](https://adsense.google.com/adsense/u/0/pub-1482729173853463/arc/ca-pub-1482729173853463)
2. Click on **"Ads"** in the left sidebar
3. Click **"By ad unit"** tab
4. Click **"Create new ad unit"** button

### Step 2: Create Desktop Sidebar Ads (Left & Right)

You need to create **2 separate ad units** for the left and right sidebars:

#### Left Sidebar Ad:
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
     crossorigin="anonymous"></script>
<!-- Left Sidebar Ad - Desktop -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1482729173853463"
     data-ad-slot="3844537316"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>


#### Right Sidebar Ad:
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
     crossorigin="anonymous"></script>
<!-- Right Sidebar Ad - Desktop -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1482729173853463"
     data-ad-slot="3805433852"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>

### Step 3: Create Mobile Top Banner Ad

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
     crossorigin="anonymous"></script>
<!-- Mobile Top Banner -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1482729173853463"
     data-ad-slot="7330935263"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>

### Step 4: Create Popup Ad (Optional but Recommended)
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
     crossorigin="anonymous"></script>
<!-- Popup Ad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1482729173853463"
     data-ad-slot="7821873949"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>

## 🔧 Adding Ad Slot IDs to Your Code

After creating the ad units, you need to add the slot IDs to these files:

### File 1: `src/components/side-ad-banners.tsx`
- **Line 144:** Replace `data-ad-slot=""` with your **Left Sidebar Ad Slot ID**
- **Line 167:** Replace `data-ad-slot=""` with your **Right Sidebar Ad Slot ID**

### File 2: `src/components/mobile-ad-banner.tsx`
- **Line 171:** Replace `data-ad-slot=""` with your **Mobile Top Banner Ad Slot ID**

### File 3: `src/components/popup-ad.tsx`
- **Line 185:** Replace `data-ad-slot=""` with your **Popup Ad Slot ID**

## 📱 Responsive Design Strategy

### Desktop (≥1024px):
- **Left Sidebar:** 160px wide, 600px tall (fixed position)
- **Right Sidebar:** 160px wide, 600px tall (fixed position)
- **Main Content:** Has 184px margins on both sides (160px ad + 24px spacing)
- **No top banner** (to avoid crowding)

### Mobile (<1024px):
- **Top Banner:** Full width, 50px tall (minimizable)
- **No sidebars** (hidden on mobile)
- **Popup ads:** Triggered on "Check Status" button click
- **Main Content:** Full width (no side margins)

## ✅ Best Practices Implemented

1. **Non-Intrusive Placement:**
   - Side ads don't overlap content
   - Mobile banner is minimizable
   - Popup ads only show when user takes action

2. **Responsive Design:**
   - Different ad placements for desktop vs mobile
   - Content adjusts automatically
   - No horizontal scrolling

3. **User Experience:**
   - Ads don't block important content
   - Close buttons on all popups
   - Collapsible mobile banner
   - Auto-close if no ad loads

4. **Performance:**
   - Ads load asynchronously
   - No layout shifts
   - Proper z-index management

## 🎯 Ad Placement Summary

| Location | Device | Size | Visibility | Collapsible |
|----------|--------|------|------------|-------------|
| Left Sidebar | Desktop only | 160x600 | Always | No |
| Right Sidebar | Desktop only | 160x600 | Always | No |
| Top Banner | Mobile only | Responsive | Always | Yes |
| Popup | All devices | 300x250 | On button click | Yes (close button) |

## 🔍 Testing Your Ads

1. **Desktop Testing:**
   - Check that left and right sidebars appear
   - Verify main content has proper margins
   - Ensure ads don't overlap header

2. **Mobile Testing:**
   - Check top banner appears and is minimizable
   - Test popup ad on "Check Status" button
   - Verify no horizontal scrolling

3. **Ad Loading:**
   - Wait 5-10 seconds for ads to load
   - Check browser console for any errors
   - Verify ad slot IDs are correct

## ⚠️ Important Notes

- **Ad Approval:** New ad units may take 24-48 hours to start showing ads
- **Ad Inventory:** Google may not always have ads available (this is normal)
- **Ad Blockers:** Users with ad blockers won't see ads (this is expected)
- **Testing:** Use AdSense's "Test mode" to verify ad units are working

## 🚀 Next Steps

1. Create all 4 ad units in AdSense
2. Copy the ad slot IDs
3. Update the code files with your slot IDs
4. Test on both desktop and mobile
5. Monitor performance in AdSense dashboard

## 📞 Need Help?

If you encounter issues:
- Check AdSense dashboard for ad unit status
- Verify ad slot IDs are correct in code
- Check browser console for errors
- Ensure AdSense account is approved and active
