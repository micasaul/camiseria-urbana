import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import WhiteButton from '../../buttons/white-btn/WhiteButton.jsx'

export default function MenuButton({ isOpen, onClick, onClose, productLinks }) {
  const navigate = useNavigate()
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  const handleToggle = () => {
    onClick()
    if (isOpen) {
      setIsProductsOpen(false)
    }
  }

  return (
    <>
      <WhiteButton className="header-icon-btn" onClick={handleToggle} aria-expanded={isOpen}>
        <span className="white-icon">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </span>
      </WhiteButton>

      {isOpen && (
        <aside className="side-panel">
          <div className="side-panel-header">
            <span>Menú</span>
            <button className="close-btn" onClick={onClose} aria-label="Cerrar menú">×</button>
          </div>
          <nav className="side-panel-links">
            <div className="side-panel-toggle">
              <button
                type="button"
                className="side-panel-link side-panel-button"
                onClick={() => {
                  onClose()
                  navigate('/catalogo')
                }}
              >
                Todos los productos
              </button>
              <button
                type="button"
                className="chevron-button"
                onClick={() => setIsProductsOpen((prev) => !prev)}
                aria-expanded={isProductsOpen}
                aria-label="Abrir submenú de productos"
              >
                <span className={`chevron ${isProductsOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
              </button>
            </div>
            {isProductsOpen && (
              <div className="side-panel-submenu">
                {productLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="side-panel-link sub-link"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            <button type="button" className="side-panel-link side-panel-link-disabled" disabled>
              Ofertas
            </button>
          </nav>
        </aside>
      )}
    </>
  )
}
