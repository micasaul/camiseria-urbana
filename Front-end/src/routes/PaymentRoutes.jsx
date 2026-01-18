import { Route } from 'react-router-dom'
import CheckoutTest from '../pages/CheckoutTest.jsx'
import PaymentFailure from '../pages/PaymentFailure.jsx'
import PaymentPending from '../pages/PaymentPending.jsx'
import PaymentSuccess from '../pages/PaymentSuccess.jsx'

function PaymentRoutes() {
  return (
    <>
      <Route path="/checkout-test" element={<CheckoutTest />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/pending" element={<PaymentPending />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />
    </>
  )
}

export default PaymentRoutes
