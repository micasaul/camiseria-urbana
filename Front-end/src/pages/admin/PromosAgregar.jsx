import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import WhiteButton from '../../components/buttons/white-btn/WhiteButton.jsx'
import './admin.css'

export default function PromosAgregar() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">
        Promos <span className="admin-title-sub">- Agregar</span>
      </h1>
      <form className="admin-form">
        <div className="admin-field">
          <label>
            Nombre<span className="admin-required">*</span>
          </label>
          <input className="admin-input" type="text" placeholder="Nombre de la promo" />
        </div>
        <div className="admin-field">
          <label>
            Porcentaje<span className="admin-required">*</span>
          </label>
          <input className="admin-input" type="number" placeholder="% de descuento" />
        </div>
        <div className="admin-field">
          <div className="admin-date-row">
            <div className="admin-date-field">
              <label>
                Desde<span className="admin-required">*</span>
              </label>
              <input className="admin-input" type="date" />
            </div>
            <div className="admin-date-field">
              <label>
                Hasta<span className="admin-required">*</span>
              </label>
              <input className="admin-input" type="date" />
            </div>
          </div>
        </div>
        <div className="admin-field">
          <label>
            Productos<span className="admin-required">*</span>
          </label>
          <div className="admin-product-select">
            <label className="admin-product-option">
              <input type="checkbox" />
              <span className="admin-product-thumb" />
              <span>Camisa Lino</span>
            </label>
            <label className="admin-product-option">
              <input type="checkbox" />
              <span className="admin-product-thumb" />
              <span>Camisa Algodón</span>
            </label>
            <label className="admin-product-option">
              <input type="checkbox" />
              <span className="admin-product-thumb" />
              <span>Camisa Jean</span>
            </label>
          </div>
        </div>
        <div className="admin-actions admin-actions-fixed">
          <BlueButton width="180px" height="40px">Guardar</BlueButton>
          <WhiteButton width="140px" height="40px" className="admin-white-action">
            Cancelar
          </WhiteButton>
        </div>
      </form>
    </div>
  )
}
