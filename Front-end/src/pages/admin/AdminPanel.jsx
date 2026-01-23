import './admin.css'

export default function AdminPanel() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Dashboard</h1>
      <div className="admin-card-grid">
        <div className="admin-card">
          <h2 className="admin-card-title">Mejores clientes</h2>
          <div className="admin-stats-table">
            <div className="admin-stats-header">
              <span>Cliente</span>
              <span>Total comprado</span>
            </div>
            <div className="admin-stats-row">
              <span>cliente1@mail.com</span>
              <span>$ 120.000</span>
            </div>
            <div className="admin-stats-row">
              <span>cliente2@mail.com</span>
              <span>$ 98.500</span>
            </div>
            <div className="admin-stats-row">
              <span>cliente3@mail.com</span>
              <span>$ 76.200</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <h2 className="admin-card-title">Artículos más comprados</h2>
          <div className="admin-stats-table">
            <div className="admin-stats-header">
              <span>Artículo</span>
              <span>Cantidad</span>
            </div>
            <div className="admin-stats-row">
              <span className="admin-item-cell">
                <span className="admin-item-thumb" />
                Camisa Lino
              </span>
              <span>56</span>
            </div>
            <div className="admin-stats-row">
              <span className="admin-item-cell">
                <span className="admin-item-thumb" />
                Camisa Jean
              </span>
              <span>42</span>
            </div>
            <div className="admin-stats-row">
              <span className="admin-item-cell">
                <span className="admin-item-thumb" />
                Camisa Algodón
              </span>
              <span>31</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
