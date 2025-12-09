import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Route handler for Digital Asset Links
 * Serves assetlinks.json at /.well-known/assetlinks.json
 * Required for TWA (Trusted Web Activity) verification
 * 
 * IMPORTANT: Update the assetlinks.json file with your actual:
 * - package_name: Your Android app's package name (e.g., "com.rkrlaundry.app")
 * - sha256_cert_fingerprints: Your app's signing certificate SHA-256 fingerprint
 */
export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'assetlinks.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const assetlinks = JSON.parse(fileContents);
    
    return NextResponse.json(assetlinks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error reading assetlinks.json:', error);
    return NextResponse.json(
      { error: 'Asset links file not found' },
      { status: 404 }
    );
  }
}

