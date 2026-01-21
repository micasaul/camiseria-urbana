import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import "./Header.css"
import LogoCamiseriaUrbana from "../../assets/LogoCamiseriaUrbana.png" 

export default function Header({ userRole = 'guest' }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const productLinks = useMemo(() => ([
    { label: 'Lino', to: '/catalogo' },
    { label: 'Algodón', to: '/catalogo' },
    { label: 'Jean', to: '/catalogo' }
  ]), [])

  const accountMenu = useMemo(() => ({
    admin: [
      { label: 'Panel admin', to: '/admin' },
      { label: 'Mi cuenta', to: '/mi-cuenta' }
    ],
    client: [
      { label: 'Mi cuenta', to: '/mi-cuenta' },
      { label: 'Wishlist', to: '/wishlist' }
    ],
    guest: [
      { label: 'Iniciar sesión', to: '/login' },
      { label: 'Crear cuenta', to: '/signup' }
    ]
  }), [])

  const activeAccountMenu = accountMenu[userRole] ?? accountMenu.guest

  const closePanels = () => {
    setIsMenuOpen(false)
    setIsWishlistOpen(false)
    setIsCartOpen(false)
  }

  const handleSearchClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true)
      setIsAccountOpen(false)
      closePanels()
      return
    }

    const query = searchQuery.trim()
    const target = query ? `/buscar?query=${encodeURIComponent(query)}` : '/buscar'
    navigate(target)
  }

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev)
    setIsProductsOpen(false)
    setIsAccountOpen(false)
    setIsSearchOpen(false)
    setIsWishlistOpen(false)
    setIsCartOpen(false)
  }

  const handleWishlistToggle = () => {
    setIsWishlistOpen((prev) => !prev)
    setIsMenuOpen(false)
    setIsAccountOpen(false)
    setIsSearchOpen(false)
    setIsCartOpen(false)
  }

  const handleCartToggle = () => {
    setIsCartOpen((prev) => !prev)
    setIsMenuOpen(false)
    setIsAccountOpen(false)
    setIsSearchOpen(false)
    setIsWishlistOpen(false)
  }

  const handleAccountToggle = () => {
    setIsAccountOpen((prev) => !prev)
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setIsWishlistOpen(false)
    setIsCartOpen(false)
  }

  return (
    <header className="header">

      {/* Menú izquierda (sin ruta por ahora) */}
      <button className="white-btn" onClick={handleMenuToggle} aria-expanded={isMenuOpen}>
        <span className="white-icon">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14"/>
          </svg>
        </span>
      </button>

      {/* Logo → Home */}
      <div className="logo">
        <Link to="/">
          <img src={LogoCamiseriaUrbana} alt="Logo Camisería Urbana" />
        </Link>
      </div>

      {/* Iconos derecha */}
      <div className="icons">

        {/* Buscar */}
        <div className="search-wrapper">
          {isSearchOpen && (
            <input
              className="search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar..."
              aria-label="Buscar productos"
            />
          )}
          <button className="white-btn ghost-btn" onClick={handleSearchClick} aria-expanded={isSearchOpen}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
            </svg>
          </button>
        </div>

        {/* Login / Mi cuenta */}
        <div className="account-wrapper">
          <button className="white-btn ghost-btn" onClick={handleAccountToggle} aria-expanded={isAccountOpen}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd"
                d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                clipRule="evenodd"/>
            </svg>
          </button>
          {isAccountOpen && (
            <div className="account-dropdown">
              {activeAccountMenu.map((item) => (
                <Link key={item.label} to={item.to} className="dropdown-link">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Wishlist */}
        <button className="white-btn ghost-btn" onClick={handleWishlistToggle} aria-expanded={isWishlistOpen}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"/>
          </svg>
        </button>

        {/* Carrito / checkout */}
        <button className="white-btn ghost-btn" onClick={handleCartToggle} aria-expanded={isCartOpen}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
          </svg>
        </button>

      </div>

      {isMenuOpen && (
        <aside className="side-panel">
          <div className="side-panel-header">
            <span>Menú</span>
            <button className="close-btn" onClick={() => setIsMenuOpen(false)} aria-label="Cerrar menú">×</button>
          </div>
          <nav className="side-panel-links">
            <button
              type="button"
              className="side-panel-toggle"
              onClick={() => setIsProductsOpen((prev) => !prev)}
              aria-expanded={isProductsOpen}
            >
              <span>Todos los productos</span>
              <span className={`chevron ${isProductsOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {isProductsOpen && (
              <div className="side-panel-submenu">
                {productLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="side-panel-link sub-link"
                    onClick={() => setIsMenuOpen(false)}
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

      {isWishlistOpen && (
        <aside className="side-panel right">
          <div className="side-panel-header">
            <span>Wishlist</span>
            <button className="close-btn" onClick={() => setIsWishlistOpen(false)} aria-label="Cerrar wishlist">×</button>
          </div>
          <div className="side-panel-body">
            <p>Acá van las wishlist-cards.</p>
          </div>
        </aside>
      )}

      {isCartOpen && (
        <aside className="side-panel right">
          <div className="side-panel-header">
            <span>Carrito</span>
            <button className="close-btn" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">×</button>
          </div>
          <div className="side-panel-body">
            <p>Acá van las cart-cards.</p>
          </div>
        </aside>
      )}
    </header>
  )
}
