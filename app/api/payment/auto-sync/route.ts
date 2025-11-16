import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Auto-sync endpoint để tự động hoàn thiện thanh toán
 * Không gọi SePay API (gây lỗi 501)
 * Thay vào đó, dựa vào webhook từ SePay
 * 
 * GET /api/payment/auto-sync
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function syncPayments() {
  try {
    console.log('=== AUTO-SYNC: Checking for pending payments ===', {
      timestamp: new Date().toISOString()
    });

    // Lấy danh sách pending payments từ database
    const { data: pendingPayments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentError) {
      console.error('=== AUTO-SYNC: Error fetching payments ===', paymentError);
      return { success: false, error: 'Failed to fetch payments', synced: 0, checked: 0 };
    }

    console.log('=== AUTO-SYNC: Found pending payments ===', {
      count: pendingPayments?.length || 0
    });

    // Chỉ log, không xử lý
    // Webhook từ SePay sẽ tự động xử lý khi có giao dịch
    // Nếu webhook chậm, user có thể nhấn nút "Xác nhận thanh toán"

    return {
      success: true,
      message: 'Sync check completed - waiting for SePay webhook',
      checked: pendingPayments?.length || 0,
      synced: 0,
      note: 'Payments will be auto-completed when SePay webhook is received'
    };
  } catch (error) {
    console.error('=== AUTO-SYNC: Error ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      synced: 0,
      checked: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await syncPayments();
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AUTO-SYNC: Unhandled error ===', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run auto-sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Cũng hỗ trợ POST để dễ trigger từ webhook hoặc cron job
  try {
    const result = await syncPayments();
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AUTO-SYNC: Unhandled error ===', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run auto-sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
