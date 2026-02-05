import { Route } from 'react-router-dom'
import CheckoutTest from '../pages/pagos/CheckoutTest'
import PaymentSuccess from '../pages/pagos/PaymentSuccess'
import PaymentPending from '../pages/pagos/PaymentPending'
import PaymentFailure from '../pages/pagos/PaymentFailure'
import Compra from '../pages/pagos/Compra'

export default function PagosRoutes() {
  return (
    <>
      <Route path="/checkout-test" element={<CheckoutTest />} />
      <Route path="/pago/success" element={<PaymentSuccess />} />
      <Route path="/pago/pending" element={<PaymentPending />} />
      <Route path="/pago/failure" element={<PaymentFailure />} />
      <Route path="/compra" element={<Compra />} />
    </>
  )
}
