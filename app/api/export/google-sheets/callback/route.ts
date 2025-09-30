import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsRefreshToken } from '@/lib/export/googleSheets';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Get authorization code from query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?googleError=true`);
    }
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?googleError=missing_code`);
    }
    
    // Exchange code for refresh token
    const refreshToken = await getGoogleSheetsRefreshToken(code);
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Store refresh token in user's profile metadata
      await supabase
        .from('profiles')
        .update({
          metadata: {
            googleSheets: {
              refreshToken,
              connectedAt: new Date().toISOString()
            }
          }
        })
        .eq('id', session.user.id);
    }
    
    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?googleConnected=true`);
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?googleError=token_exchange`);
  }
}
