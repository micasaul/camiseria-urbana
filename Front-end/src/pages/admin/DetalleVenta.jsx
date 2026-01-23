import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import './admin.css'

const ESTADOS_VENTA = ['En proceso', 'Enviado', 'Entregado']

export default function DetalleVenta() {
  return (
    <div className="admin-page admin-page-full">
      <h1 className="admin-title admin-title-offset">
        Ventas <span className="admin-title-sub">- Detalle</span>
      </h1>
      <div className="admin-card admin-detail-card">
        <div className="admin-venta-detail">
          <div className="admin-venta-col">
            <div className="admin-venta-heading">
              <h2 className="admin-venta-title">Orden #00123</h2>
              <p className="admin-venta-date">20 Oct 2024 - 14:32</p>
            </div>

            <div className="admin-venta-meta admin-venta-meta-center">
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Dirección:</span>
                <span className="admin-venta-meta-value">Calle Falsa 123, CABA</span>
              </div>
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Seguimiento:</span>
                <span className="admin-venta-meta-value">AR-00012345</span>
              </div>
              <div className="admin-venta-meta-item">
                <span className="admin-venta-meta-title">Estados:</span>
                <select className="admin-select admin-venta-select">
                  {ESTADOS_VENTA.map((estado) => (
                    <option key={estado} value={estado.toLowerCase()}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-venta-actions">
              <BlueButton width="160px" height="40px">Guardar</BlueButton>
            </div>
          </div>

          <div className="admin-venta-col">
            <div className="admin-venta-products">
              <div className="admin-venta-product">
                <span className="admin-venta-product-thumb" />
                <div className="admin-venta-product-info">
                  <span className="admin-venta-product-name">Camisa Lino</span>
                  <span className="admin-venta-product-variant">Talle: M - Color: Blanco</span>
                  <span className="admin-venta-product-qty">Cantidad: 2</span>
                </div>
                <span className="admin-venta-product-price">$ 25.000</span>
              </div>
              <div className="admin-venta-product">
                <span className="admin-venta-product-thumb" />
                <div className="admin-venta-product-info">
                  <span className="admin-venta-product-name">Camisa Jean</span>
                  <span className="admin-venta-product-variant">Talle: L - Color: Azul</span>
                  <span className="admin-venta-product-qty">Cantidad: 1</span>
                </div>
                <span className="admin-venta-product-price">$ 18.000</span>
              </div>
            </div>

            <div className="admin-venta-summary">
              <div className="admin-venta-summary-row">
                <span>Subtotal</span>
                <span>$ 68.000</span>
              </div>
              <div className="admin-venta-summary-row">
                <span>Envío</span>
                <span>$ 3.500</span>
              </div>
              <div className="admin-venta-summary-row total">
                <span className="admin-venta-total-label">Total</span>
                <span>$ 71.500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
