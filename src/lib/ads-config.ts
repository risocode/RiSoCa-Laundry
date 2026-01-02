/**
 * AdSense Ad Slot Configuration
 * 
 * Replace the empty strings with your actual AdSense ad slot IDs
 * You can find these in your AdSense dashboard after creating ad units
 * 
 * Format: "1234567890" (just the numbers, no quotes needed in the code)
 */

export const AD_SLOTS = {
  // Desktop Sidebar Ads (160x600 - Wide Skyscraper)
  LEFT_SIDEBAR: '3844537316', // Left Sidebar Ad - Desktop
  RIGHT_SIDEBAR: '3805433852', // Right Sidebar Ad - Desktop
  
  // Mobile Top Banner (Responsive - Horizontal)
  MOBILE_TOP_BANNER: '7330935263', // Mobile Top Banner
  
  // Popup Ad (300x250 - Medium Rectangle or Responsive)
  POPUP_AD: '7821873949', // Popup Ad - Order Status
} as const;

/**
 * Check if ad slots are configured
 */
export function areAdSlotsConfigured(): boolean {
  return Object.values(AD_SLOTS).some(slot => slot !== '');
}

/**
 * Get ad slot ID, returns empty string if not configured
 */
export function getAdSlot(key: keyof typeof AD_SLOTS): string {
  return AD_SLOTS[key] || '';
}
