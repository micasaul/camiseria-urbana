import './admin.css'

export default function ProductosListar() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Productos <span className="admin-title-sub">- Listar</span>
      </h1>
      <div className="admin-table">
        <div className="admin-table-header admin-table-products">
          <span>Imagen</span>
          <span>Nombre</span>
          <span>Material</span>
          <span>Precio</span>
          <span>Cantidad</span>
          <span>Colores</span>
          <span>Acción</span>
        </div>
        <div className="admin-table-row admin-table-products">
          <span>
            <span className="admin-product-thumb" />
          </span>
          <span>Camisa Lino</span>
          <span>Lino</span>
          <span>$ 45.000</span>
          <span>24</span>
          <span className="admin-color-options admin-color-options-inline">
            <span className="admin-color-dot" title="Blanco" />
            <span className="admin-color-dot" title="Negro" style={{ backgroundColor: '#111111' }} />
            <span className="admin-color-dot" title="Azul" style={{ backgroundColor: '#1b2a41' }} />
          </span>
          <span className="admin-action-group">
            <button className="admin-action-btn" type="button">Editar</button>
            <button className="admin-action-btn admin-action-delete" type="button">Eliminar stock</button>
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
