import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm md:text-base">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to RKR Laundry ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use our laundry service application and website.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">2.1 Personal Information</h3>
                    <p className="leading-relaxed">
                      When you create an account or place an order, we collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Email address (for account creation and communication)</li>
                      <li>First name and last name</li>
                      <li>Contact phone number</li>
                      <li>Account password (encrypted and stored securely)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">2.2 Location Information</h3>
                    <p className="leading-relaxed">
                      When you use our delivery services, we may collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Your current location (with your permission) to calculate delivery distance and pricing</li>
                      <li>Selected delivery address or location coordinates</li>
                      <li>Distance information for pricing calculations</li>
                    </ul>
                    <p className="mt-2 leading-relaxed">
                      <strong>Note:</strong> Location data is only collected when you explicitly select a location on the map or grant permission for location access. We do not track your location continuously.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">2.3 Order Information</h3>
                    <p className="leading-relaxed">
                      When you place an order, we collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Order details (service package, weight, loads)</li>
                      <li>Delivery preferences</li>
                      <li>Payment status</li>
                      <li>Order status and history</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">2.4 Usage Information</h3>
                    <p className="leading-relaxed">
                      We may automatically collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Device information (browser type, device type)</li>
                      <li>IP address (for security and analytics)</li>
                      <li>Usage patterns and app interactions</li>
                      <li>Login attempt information (for security purposes)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">We use your information to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Process and manage your orders</li>
                    <li>Calculate delivery fees based on location</li>
                    <li>Communicate with you about your orders and account</li>
                    <li>Provide customer support</li>
                    <li>Improve our services and user experience</li>
                    <li>Ensure account security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. How We Store Your Information</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p className="leading-relaxed">
                    Your data is stored securely using:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Supabase:</strong> Our backend database service that provides secure, encrypted storage with Row Level Security (RLS) policies</li>
                    <li><strong>HTTPS:</strong> All data transmission is encrypted</li>
                    <li><strong>Authentication:</strong> Passwords are hashed and never stored in plain text</li>
                    <li><strong>Access Controls:</strong> Only authorized users can access their own data</li>
                  </ul>
                  <p className="leading-relaxed mt-3">
                    We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time by contacting us.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p className="leading-relaxed">
                    We use the following third-party services that may have access to your information:
                  </p>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">5.1 Supabase</h3>
                      <p className="leading-relaxed">
                        We use Supabase for database storage, authentication, and backend services. Your data is stored on Supabase's secure servers. 
                        <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          View Supabase Privacy Policy
                        </a>
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">5.2 Google Maps API</h3>
                      <p className="leading-relaxed">
                        We use Google Maps API to provide location selection and distance calculation features. Google may collect location data as described in their privacy policy.
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          View Google Privacy Policy
                        </a>
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">5.3 Vercel</h3>
                      <p className="leading-relaxed">
                        Our website is hosted on Vercel. Vercel may collect technical information about your visit.
                        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          View Vercel Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Location Data</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">
                    <strong>Why we collect location data:</strong> We use your location to calculate delivery distance and determine accurate pricing for our delivery services.
                  </p>
                  <p className="leading-relaxed">
                    <strong>How we collect it:</strong> Location data is only collected when you:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Explicitly select a location on the map</li>
                    <li>Grant permission for browser geolocation access</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    <strong>Data retention:</strong> Location coordinates are stored only for the duration needed to calculate pricing and process your order. We do not continuously track your location.
                  </p>
                  <p className="leading-relaxed mt-2">
                    <strong>Your control:</strong> You can deny location access at any time. However, this may limit your ability to use delivery services that require location calculation.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Cookies and Local Storage</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">
                    We use browser localStorage for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Storing authentication session information</li>
                    <li>Tracking login attempts for security purposes (rate limiting)</li>
                  </ul>
                  <p className="leading-relaxed mt-2">
                    You can clear this data at any time through your browser settings. Clearing localStorage will log you out and reset security tracking.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">You have the right to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct your information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Objection:</strong> Object to certain data processing activities</li>
                    <li><strong>Portability:</strong> Request your data in a portable format</li>
                  </ul>
                  <p className="leading-relaxed mt-3">
                    To exercise these rights, please contact us at <a href="mailto:support@rkrlaundry.com" className="text-primary hover:underline">support@rkrlaundry.com</a>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Data Security</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">
                    We implement security measures to protect your information:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Encrypted data transmission (HTTPS)</li>
                    <li>Secure password storage (hashing)</li>
                    <li>Row Level Security (RLS) policies</li>
                    <li>Regular security updates</li>
                    <li>Access controls and authentication</li>
                  </ul>
                  <p className="leading-relaxed mt-3">
                    However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="leading-relaxed">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <ul className="list-none space-y-1">
                    <li><strong>Email:</strong> <a href="mailto:support@rkrlaundry.com" className="text-primary hover:underline">support@rkrlaundry.com</a></li>
                    <li><strong>Website:</strong> <a href="https://rkrlaundry.com" className="text-primary hover:underline">https://rkrlaundry.com</a></li>
                    <li><strong>Contact Page:</strong> <a href="/contact-us" className="text-primary hover:underline">Visit our Contact Us page</a></li>
                  </ul>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

