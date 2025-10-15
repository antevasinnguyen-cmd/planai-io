// Payos integration for VietQR pro payments
import axios from 'axios'
import crypto from 'crypto'

// Payos API configuration
const PAYOS_API_URL = 'https://api-merchant.payos.vn'
const PAYOS_API_KEY = process.env.PAYOS_API_KEY
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY

// Payment status
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Payment interface
export interface Payment {
  id: string
  orderCode: string
  amount: number
  description: string
  status: PaymentStatus
  createdAt: string
  paymentUrl?: string
  qrCode?: string
  accountName?: string
  accountNumber?: string
  reference?: string
}

// Create payment link
export const createPaymentLink = async (
  orderCode: string,
  amount: number,
  description: string,
  returnUrl: string,
  cancelUrl: string
): Promise<Payment> => {
  try {
    // Kiểm tra các biến môi trường cần thiết
    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      throw new Error('Missing PayOS configuration: CLIENT_ID or API_KEY')
    }

    console.log('Creating PayOS payment (simplified):', {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl
    })

    // Thử phiên bản đơn giản trước - không cần checksum
    const response = await axios.post(
      `${PAYOS_API_URL}/v2/payment-requests`,
      {
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        expiredAt: getExpiredTime()
      },
      {
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        }
      }
    )

    if (response.data.code !== '00') {
      throw new Error(`Payment creation failed: ${response.data.desc}`)
    }

    const paymentData = response.data.data
    return {
      id: paymentData.paymentLinkId,
      orderCode,
      amount,
      description,
      status: PaymentStatus.PENDING,
      createdAt: new Date().toISOString(),
      paymentUrl: paymentData.checkoutUrl,
      qrCode: paymentData.qrCode,
      accountName: paymentData.accountName,
      accountNumber: paymentData.accountNumber,
      reference: paymentData.reference
    }
  } catch (error) {
    console.error('Payos payment creation error:', error)
    throw error
  }
}

// Check payment status
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
  try {
    const response = await axios.get(
      `${PAYOS_API_URL}/v2/payment-requests/${paymentId}`,
      {
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        }
      }
    )

    if (response.data.code !== '00') {
      throw new Error(`Payment status check failed: ${response.data.desc}`)
    }

    const status = response.data.data.status
    switch (status) {
      case 'PAID':
        return PaymentStatus.COMPLETED
      case 'PENDING':
        return PaymentStatus.PENDING
      case 'EXPIRED':
        return PaymentStatus.EXPIRED
      default:
        return PaymentStatus.FAILED
    }
  } catch (error) {
    console.error('Payos payment status check error:', error)
    throw error
  }
}

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: any,
  signature: string
): boolean => {
  try {
    // Implement signature verification based on Payos documentation
    // This is a placeholder - actual implementation depends on Payos webhook security
    return true
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Helper function to get expiration time (24 hours from now)
const getExpiredTime = (): string => {
  const date = new Date()
  date.setHours(date.getHours() + 24)
  return date.toISOString()
}

// Process subscription payment
export const processSubscriptionPayment = async (
  userId: string,
  tier: string,
  amount: number
): Promise<Payment> => {
  const orderCode = `SUB_${userId}_${Date.now()}`
  const description = `PlanAI Subscription - ${tier} Plan`
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`

  return await createPaymentLink(
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl
  )
}

// Get subscription price
export const getSubscriptionPrice = (tier: string): number => {
  switch (tier) {
    case 'basic':
      return 169000 // 169,000 VND
    case 'pro':
      return 289000 // 289,000 VND
    case 'pro_max':
      return 499000 // 499,000 VND
    default:
      return 0 // Free tier
  }
}
