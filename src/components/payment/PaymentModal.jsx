import { useState } from 'react'
import {
  loadRazorpaySDK,
  createServerPaymentOrder,
  verifyServerPayment,
  processTestModePayment,
} from '../../lib/paymentService'
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react'

export default function PaymentModal({ isOpen, onClose, booking, user, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('razorpay_modal') // 'razorpay_modal' | 'test_instant'

  if (!isOpen || !booking) return null

  const rentalAmount = parseFloat(booking.rental_amount || 0)
  const depositAmount = parseFloat(booking.deposit_amount || 0)
  const totalAmount = parseFloat(booking.total_amount || 0)
  const equipmentName = booking.equipment?.name || 'Equipment Rental'

  /**
   * Handle Razorpay standard Checkout popup
   */
  const handleRazorpayCheckout = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Create order on server
      const order = await createServerPaymentOrder(booking.id)

      // 2. Load SDK
      const sdkLoaded = await loadRazorpaySDK()
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay SDK. You can use the Instant Test Payment simulation below.')
      }

      // 3. Open Razorpay options
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RentX Platform',
        description: `Rental payment for ${equipmentName}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setLoading(true)
            await verifyServerPayment({
              bookingId: booking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'razorpay',
            })

            setPaymentSuccess(true)
            if (onSuccess) onSuccess()
          } catch (vErr) {
            console.error('[PaymentModal] Verification error:', vErr)
            setErrorMsg(vErr.message || 'Payment signature verification failed.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'RentX Customer',
          email: user?.email || '',
          contact: user?.user_metadata?.phone || '',
        },
        theme: {
          color: '#0284c7', // Sky-600
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            setErrorMsg('Payment was cancelled or closed before completion.')
          },
        },
      }

      const rzpInstance = new window.Razorpay(options)
      rzpInstance.on('payment.failed', function (resp) {
        setLoading(false)
        setErrorMsg(resp.error?.description || 'Payment failed. Please try another method.')
      })

      rzpInstance.open()
    } catch (err) {
      console.error('[PaymentModal] Order creation error:', err)
      setErrorMsg(err.message || 'Failed to initiate payment. Please try again.')
      setLoading(false)
    }
  }

  /**
   * Handle Test Mode simulation (executes full server-side signature check & DB write)
   */
  const handleTestSimulation = async (shouldSucceed = true) => {
    setLoading(true)
    setErrorMsg(null)

    try {
      await processTestModePayment({
        bookingId: booking.id,
        shouldSucceed,
        paymentMethod: 'upi_test',
      })

      setPaymentSuccess(true)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('[PaymentModal] Test simulation error:', err)
      setErrorMsg(err.message || 'Payment simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="card max-w-md w-full p-6 sm:p-8 animate-fade-up bg-white my-8 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {paymentSuccess ? (
          /* ── SUCCESS VIEW ── */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-1">
              Payment Completed!
            </h3>
            <p className="text-slate-600 text-xs mb-6 max-w-sm mx-auto">
              Your payment of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> for <strong>{equipmentName}</strong> was verified and recorded successfully.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2 mb-6 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Rental Fee:</span>
                <span className="font-semibold text-slate-800">₹{rentalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Refundable Deposit (Held in Escrow):</span>
                <span className="font-semibold text-emerald-600">₹{depositAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200">
                <span>Total Paid:</span>
                <span className="text-sky-600">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Status:</span>
                <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Paid & Verified
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              Done & Return to Bookings
            </button>
          </div>
        ) : (
          /* ── PAYMENT FORM VIEW ── */
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <span className="badge badge-sky text-[10px] uppercase tracking-wider mb-1">
                  Razorpay Checkout
                </span>
                <h2 className="text-lg font-bold text-navy-900 leading-tight">
                  Complete Rental Payment
                </h2>
                <p className="text-xs text-slate-500">
                  {equipmentName}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Financial Breakdown Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Rental Period:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(booking.start_date).toLocaleDateString()} &rarr; {new Date(booking.end_date).toLocaleDateString()} ({booking.total_days}d)
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Rental Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  ₹{rentalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Refundable Security Deposit:</span>
                <span className="font-semibold text-emerald-600">
                  ₹{depositAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-navy-900 pt-2 border-t border-slate-200">
                <span>Total Amount Due:</span>
                <span className="text-sky-600">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Test Mode / Security Note */}
            <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 mb-5 flex items-start gap-2">
              <ShieldCheck size={16} className="text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Razorpay Test Mode Active: </span>
                Signature verification and database recording are tested securely on the server without real currency charges.
              </div>
            </div>

            {/* Method Chooser */}
            <div className="space-y-2.5 mb-6">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Checkout Flow:
              </label>

              <button
                type="button"
                onClick={() => setSelectedMethod('razorpay_modal')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  selectedMethod === 'razorpay_modal'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} className="text-sky-600" />
                  <span>Razorpay Standard Checkout (Popup Modal)</span>
                </div>
                {selectedMethod === 'razorpay_modal' && <CheckCircle2 size={16} className="text-sky-600" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('test_instant')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  selectedMethod === 'test_instant'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>Instant Test Verification (Server HMAC Validation)</span>
                </div>
                {selectedMethod === 'test_instant' && <CheckCircle2 size={16} className="text-sky-600" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>

              {selectedMethod === 'razorpay_modal' ? (
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={loading}
                  className="btn-primary text-xs py-2 px-5 font-bold shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Pay ₹{totalAmount.toLocaleString('en-IN')} via Razorpay</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTestSimulation(true)}
                  disabled={loading}
                  className="btn-primary text-xs py-2 px-5 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Simulate Successful Payment</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
