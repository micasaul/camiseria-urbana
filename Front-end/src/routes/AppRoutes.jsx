import { Routes, Route } from 'react-router-dom'

// Páginas principales
import Home from '../pages/Home'
import Login from '../pages/Login'
import Signup from '../pages/signup'
import Catalogo from '../pages/Catalogo'
import Producto from '../pages/Producto'
import Wishlist from '../pages/Wishlist'
import MiCuenta from '../pages/MiCuenta'
import Buscar from '../pages/Buscar'

// Checkout y Gracias
import Checkout from '../pages/Checkout'
import Thanks from '../pages/Thanks'
import CheckoutTest from '../pages/CheckoutTest'
import PaymentSuccess from '../pages/PaymentSuccess'
import PaymentPending from '../pages/PaymentPending'
import PaymentFailure from '../pages/PaymentFailure'
import Error from '../pages/Error'
// Info y soporte
import SobreNosotros from '../pages/SobreNosotros'
import Faq from '../pages/Faq'

// Autenticación
import AuthCallback from '../pages/AuthCallback'

function AppRoutes() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* Autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Catálogo y Productos */}
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/producto/:id" element={<Producto />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/mi-cuenta" element={<MiCuenta />} />
      <Route path="/buscar" element={<Buscar />} />

      {/* Checkout */}
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/thanks" element={<Thanks />} /> {/* ← ahora directo a /thanks */}
      <Route path="/checkout-test" element={<CheckoutTest />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/pending" element={<PaymentPending />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />

      {/* Info y Soporte */}
      <Route path="/sobre-nosotros" element={<SobreNosotros />} />
      <Route path="/faq" element={<Faq />} />

      {/* Ruta para cuando algo se rompe */}
      <Route path="*" element={<Error />} />
    </Routes>
  )
}

export default AppRoutes
