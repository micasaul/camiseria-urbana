import { Link } from 'react-router-dom'
import './admin.css'

export default function Ventas() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Ventas</h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-ventas">
          <span>Fecha</span>
          <span>Orden</span>
          <span>Cliente</span>
          <span>Monto</span>
          <span>Estado</span>
          <span></span>
        </div>
        <div className="admin-table-row admin-table-ventas">
          <span>2024-10-20</span>
          <span>#00123</span>
          <span>cliente@mail.com</span>
          <span>$ 120.000</span>
          <span>En proceso</span>
          <Link className="admin-detail-link" to="/admin/ventas/detalleventa">
            Ver detalle
          </Link>
        </div>
      </div>
      <div className="admin-pagination">
        <span>Anterior</span>
        <span>1</span>
        <span>Siguiente</span>
      </div>
    </div>
  )
}
