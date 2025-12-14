import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/dashboard&error=auth_required`);
    }

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent',
      state: user.id, // Use user ID as state for security
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log('=== GOOGLE SHEETS AUTH ===', {
      userId: user.id,
      authUrl: authUrl.split('?')[0] + '?...',
    });

    // FIXED: Redirect directly to Google OAuth instead of returning JSON
    // This allows the browser to navigate to Google's consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    // Redirect to dashboard with error instead of returning JSON
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?sheets_error=auth_failed`);
  }
}
