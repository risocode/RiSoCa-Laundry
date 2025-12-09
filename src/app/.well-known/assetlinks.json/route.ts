import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Route handler for Digital Asset Links
 * Serves assetlinks.json at /.well-known/assetlinks.json
 * Required for TWA (Trusted Web Activity) verification
 * 
 * This route handler serves as a fallback if the static file
 * at public/.well-known/assetlinks.json is not accessible.
 */
export async function GET() {
  try {
    // Try to read from .well-known directory first
    const wellKnownPath = join(process.cwd(), 'public', '.well-known', 'assetlinks.json');
    let fileContents: string;
    
    try {
      fileContents = readFileSync(wellKnownPath, 'utf8');
    } catch {
      // Fallback to root public directory
      const filePath = join(process.cwd(), 'public', 'assetlinks.json');
      fileContents = readFileSync(filePath, 'utf8');
    }
    
    const assetlinks = JSON.parse(fileContents);
    
    return NextResponse.json(assetlinks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error reading assetlinks.json:', error);
    return NextResponse.json(
      { error: 'Asset links file not found' },
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

