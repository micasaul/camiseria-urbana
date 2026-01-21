import { Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'

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
import AdminPanel from '../pages/AdminPanel'
import AdminProductosAgregar from '../pages/AdminProductosAgregar'
import AdminProductosListar from '../pages/AdminProductosListar'
import AdminPromosAgregar from '../pages/AdminPromosAgregar'
import AdminPromosListar from '../pages/AdminPromosListar'
import AdminVentas from '../pages/AdminVentas'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {/* Home */}
        <Route path="/" element={<Home />} />

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
      </Route>

      {/* Autenticación */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPanel />} />
        <Route path="productos/agregar" element={<AdminProductosAgregar />} />
        <Route path="productos/listar" element={<AdminProductosListar />} />
        <Route path="promos/agregar" element={<AdminPromosAgregar />} />
        <Route path="promos/listar" element={<AdminPromosListar />} />
        <Route path="ventas" element={<AdminVentas />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
