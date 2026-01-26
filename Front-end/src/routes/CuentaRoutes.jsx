import { Route } from 'react-router-dom'
import MiCuenta from '../pages/cuenta/MiCuenta'
import Direcciones from '../pages/cuenta/Direcciones'
import AgregarDireccion from '../pages/cuenta/AgregarDireccion'
import DetalleCompra from '../pages/cuenta/DetalleCompra'
import CrearResena from '../pages/cuenta/CrearResena'

export default function CuentaRoutes() {
  return (
    <>
      <Route path="/mi-cuenta" element={<MiCuenta />} />
      <Route path="/cuenta/direcciones" element={<Direcciones />} />
      <Route path="/cuenta/agregar-direccion" element={<AgregarDireccion />} />
      <Route path="/cuenta/detalle-compra/:documentId" element={<DetalleCompra />} />
      <Route path="/cuenta/crear-resena/:productoId" element={<CrearResena />} />

    </>
  )
}
