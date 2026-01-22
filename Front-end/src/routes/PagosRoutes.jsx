import { Route } from 'react-router-dom'
import Checkout from '../pages/pagos/Checkout'
import Thanks from '../pages/pagos/Thanks'
import CheckoutTest from '../pages/pagos/CheckoutTest'
import PaymentSuccess from '../pages/pagos/PaymentSuccess'
import PaymentPending from '../pages/pagos/PaymentPending'
import PaymentFailure from '../pages/pagos/PaymentFailure'
import Compra from '../pages/pagos/Compra'

export default function PagosRoutes() {
  return (
    <>
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/thanks" element={<Thanks />} />
      <Route path="/checkout-test" element={<CheckoutTest />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/pending" element={<PaymentPending />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />
      <Route path="/compra" element={<Compra />} />
    </>
  )
}
