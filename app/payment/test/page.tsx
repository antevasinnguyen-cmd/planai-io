'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PaymentTestPage() {
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [testResult, setTestResult] = useState<any>(null)
  const [isTestingPayment, setIsTestingPayment] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkConfig()
  }, [])

  const checkConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payment/check-config')
      const data = await response.json()
      setConfigStatus(data.configStatus)
    } catch (error) {
      console.error('Error checking config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testPaymentAPI = async (method: string) => {
    try {
      setIsTestingPayment(true)
      setTestResult(null)
      
      // Tạo một yêu cầu thanh toán thử nghiệm
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'test',
          amount: 1000,
          userId: 'test-user',
          paymentMethod: method
        })
      })
      
      const data = await response.json()
      setTestResult({
        method,
        status: response.status,
        data
      })
    } catch (error) {
      console.error(`Error testing ${method} payment:`, error)
      setTestResult({
        method,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTestingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Kiểm tra hệ thống thanh toán</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Trạng thái cấu hình</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : configStatus ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Môi trường: {configStatus.nodeEnv}</h3>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">SePay</h3>
                <p className="text-sm">
                  Trạng thái: {configStatus.sepay.configured ? 
                    <span className="text-green-600 font-medium">Đã cấu hình</span> : 
                    <span className="text-red-600 font-medium">Chưa cấu hình</span>}
                </p>
                <p className="text-sm">Token: {configStatus.sepay.token || 'Không có'}</p>
                <p className="text-sm">Số tài khoản: {configStatus.sepay.account || 'Không có'}</p>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">PayOS</h3>
                <p className="text-sm">
                  Trạng thái: {configStatus.payos.configured ? 
                    <span className="text-green-600 font-medium">Đã cấu hình</span> : 
                    <span className="text-red-600 font-medium">Chưa cấu hình</span>}
                </p>
                <p className="text-sm">Client ID: {configStatus.payos.clientId || 'Không có'}</p>
                <p className="text-sm">API Key: {configStatus.payos.apiKey || 'Không có'}</p>
                <p className="text-sm">Checksum Key: {configStatus.payos.checksumKey || 'Không có'}</p>
                <p className="text-sm">API URL: {configStatus.payos.apiUrl || 'Không có'}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Không thể tải thông tin cấu hình</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Kiểm tra API thanh toán</h2>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => testPaymentAPI('sepay')}
              disabled={isTestingPayment || !configStatus?.sepay.configured}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isTestingPayment && testResult?.method === 'sepay' ? 'Đang kiểm tra...' : 'Kiểm tra SePay'}
            </button>
            
            <button
              onClick={() => testPaymentAPI('payos')}
              disabled={isTestingPayment || !configStatus?.payos.configured}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isTestingPayment && testResult?.method === 'payos' ? 'Đang kiểm tra...' : 'Kiểm tra PayOS'}
            </button>
          </div>
          
          {testResult && (
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">Kết quả kiểm tra {testResult.method === 'sepay' ? 'SePay' : 'PayOS'}</h3>
              
              {testResult.status === 'error' ? (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-red-600">Lỗi: {testResult.error}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm">Mã trạng thái: {testResult.status}</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs overflow-auto max-h-60">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Hướng dẫn khắc phục</h2>
          
          <div className="space-y-3">
            <p className="text-sm">1. Kiểm tra file <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> và đảm bảo các biến môi trường đã được cấu hình đúng:</p>
            <pre className="bg-gray-50 p-3 rounded-md text-xs">
{`# SePay
SEPAY_TOKEN=your_sepay_token
SEPAY_ACCOUNT_NUMBER=your_sepay_account

# PayOS
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_API_URL=https://api-merchant.payos.vn`}
            </pre>
            
            <p className="text-sm">2. Khởi động lại server sau khi cập nhật biến môi trường:</p>
            <pre className="bg-gray-50 p-3 rounded-md text-xs">
{`npm run dev
# hoặc
yarn dev`}
            </pre>
            
            <p className="text-sm">3. Nếu vẫn gặp vấn đề, hãy kiểm tra logs của server để xem lỗi chi tiết.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
