import { Route } from 'react-router-dom'
import AdminPanel from '../pages/admin/AdminPanel'
import AdminProductosAgregar from '../pages/admin/ProductosAgregar'
import AdminProductosListar from '../pages/admin/ProductosListar'
import AdminCombosAgregar from '../pages/admin/CombosAgregar'
import AdminCombosListar from '../pages/admin/CombosListar'
import AdminPromosAgregar from '../pages/admin/PromosAgregar'
import AdminPromosListar from '../pages/admin/PromosListar'
import AdminCuponesAgregar from '../pages/admin/CuponesAgregar'
import AdminCuponesListar from '../pages/admin/CuponesListar'
import AdminVentas from '../pages/admin/Ventas'
import AdminDetalleVenta from '../pages/admin/DetalleVenta'

export default function AdminRoutes() {
  return (
    <>
      <Route index element={<AdminPanel />} />
      <Route path="productos/agregar" element={<AdminProductosAgregar />} />
      <Route path="productos/editar/:id" element={<AdminProductosAgregar />} />
      <Route path="productos/listar" element={<AdminProductosListar />} />
      <Route path="combos/agregar" element={<AdminCombosAgregar />} />
      <Route path="combos/editar/:id" element={<AdminCombosAgregar />} />
      <Route path="combos/listar" element={<AdminCombosListar />} />
      <Route path="promos/agregar" element={<AdminPromosAgregar />} />
      <Route path="promos/editar/:id" element={<AdminPromosAgregar />} />
      <Route path="promos/listar" element={<AdminPromosListar />} />
      <Route path="cupones/agregar" element={<AdminCuponesAgregar />} />
      <Route path="cupones/editar/:id" element={<AdminCuponesAgregar />} />
      <Route path="cupones/listar" element={<AdminCuponesListar />} />
      <Route path="ventas" element={<AdminVentas />} />
      <Route path="ventas/detalle/:id" element={<AdminDetalleVenta />} />
    </>
  )
}
