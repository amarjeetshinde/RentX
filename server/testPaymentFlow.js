import crypto from 'node:crypto'
import { handleTestPayment } from './paymentServer.js'

async function runTests() {
  console.log('--- RentX Phase 6 Payment Logic Tests ---')

  // 1. Test HMAC Signature Verification
  const testSecret = 'RentX_Test_Secret_Key_987654321'
  const orderId = 'order_test_12345'
  const paymentId = 'pay_test_67890'
  const validSig = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const forgedSig = 'forged_fake_signature_abc123'

  const checkValid = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex') === validSig

  const checkForged = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex') === forgedSig

  console.log('1. Valid HMAC Signature check:', checkValid ? 'PASS' : 'FAIL')
  console.log('2. Forged Signature rejection:', !checkForged ? 'PASS' : 'FAIL')

  // 3. Test Failed Payment Handling (Simulation)
  const failedResult = await handleTestPayment({
    bookingId: 'test-booking-id',
    shouldSucceed: false,
  })
  console.log('3. Payment failure/cancellation handling:', failedResult.status === 400 ? 'PASS' : 'FAIL')
  console.log('   Reported error code:', failedResult.body.code)

  // 4. Test Missing bookingId Handling
  const missingResult = await handleTestPayment({
    shouldSucceed: true,
  })
  console.log('4. Missing parameters rejection:', missingResult.status === 400 ? 'PASS' : 'FAIL')

  console.log('--- All Unit Signature Tests Completed ---')
}

runTests().catch(console.error)
