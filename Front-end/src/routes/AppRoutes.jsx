import { Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import HomeRoutes from './HomeRoutes.jsx'
import CatalogoRoutes from './CatalogoRoutes.jsx'
import CuentaRoutes from './CuentaRoutes.jsx'
import PagosRoutes from './PagosRoutes.jsx'
import InfoRoutes from './InfoRoutes.jsx'
import AuthRoutes from './AuthRoutes.jsx'
import AdminRoutes from './AdminRoutes.jsx'
import Error from '../pages/info/Error'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {HomeRoutes()}
        {CatalogoRoutes()}
        {CuentaRoutes()}
        {InfoRoutes()}
        {PagosRoutes()}

        {/* Ruta para cuando algo se rompe */}
        <Route path="*" element={<Error />} />
      </Route>

      {/* Autenticación */}
      <Route element={<AuthLayout />}>
        {AuthRoutes()}
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        {AdminRoutes()}
      </Route>
    </Routes>
  )
}

export default AppRoutes
