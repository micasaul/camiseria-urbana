import './admin.css'

export default function PromosListar() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Promos <span className="admin-title-sub">- Listar</span>
      </h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-promos">
          <span>Fechas</span>
          <span>Nombre</span>
          <span>Descuento</span>
          <span>Acción</span>
        </div>
        <div className="admin-table-row admin-table-promos">
          <span className="admin-date-stack">
            <span>2024-10-01</span>
            <span>2024-10-15</span>
          </span>
          <span>Promo Primavera</span>
          <span>20%</span>
          <span className="admin-action-group">
            <button className="admin-action-btn" type="button">Editar</button>
            <button className="admin-action-btn admin-action-delete" type="button">Cancelar</button>
          </span>
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
