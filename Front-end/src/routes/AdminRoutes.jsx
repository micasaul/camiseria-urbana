import { Route } from 'react-router-dom'
import AdminPanel from '../pages/admin/AdminPanel'
import AdminProductosAgregar from '../pages/admin/ProductosAgregar'
import AdminProductosListar from '../pages/admin/ProductosListar'
import AdminPromosAgregar from '../pages/admin/PromosAgregar'
import AdminPromosListar from '../pages/admin/PromosListar'
import AdminVentas from '../pages/admin/Ventas'

export default function AdminRoutes() {
  return (
    <>
      <Route index element={<AdminPanel />} />
      <Route path="productos/agregar" element={<AdminProductosAgregar />} />
      <Route path="productos/listar" element={<AdminProductosListar />} />
      <Route path="promos/agregar" element={<AdminPromosAgregar />} />
      <Route path="promos/listar" element={<AdminPromosListar />} />
      <Route path="ventas" element={<AdminVentas />} />
    </>
  )
}
