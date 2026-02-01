import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import "./Header.css"
import LogoCamiseriaUrbana from "../../assets/LogoCamiseriaUrbana.png" 
import MenuButton from './buttons/MenuButton.jsx'
import SearchButton from './buttons/SearchButton.jsx'
import AccountButton from './buttons/AccountButton.jsx'
import WishlistButton from './buttons/WishlistButton.jsx'
import CartButton from './buttons/CartButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const headerRef = useRef(null)
  const { rol, cerrarSesion } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [ofertasActivas, setOfertasActivas] = useState(false)
  const [productosOferta, setProductosOferta] = useState([])

  useEffect(() => {
    let activo = true
    let intervaloId

    const obtenerOfertasActivas = async () => {
      try {
        const respuesta = await fetch(`${BACKEND_URL}/api/promo-productos/activa`)
        if (!respuesta.ok) {
          return
        }
        const data = await respuesta.json()
        if (activo) {
          setOfertasActivas(Boolean(data?.activa))
        }
      } catch {
        if (activo) {
          setOfertasActivas(false)
        }
      }
    }

    obtenerOfertasActivas()
    intervaloId = setInterval(obtenerOfertasActivas, 30000)

    return () => {
      activo = false
      if (intervaloId) {
        clearInterval(intervaloId)
      }
    }
  }, [])

  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true)
      setIsMenuOpen(false)
      setIsAccountOpen(false)
      setIsSearchOpen(false)
      setIsWishlistOpen(false)
    }

    window.addEventListener('cart:open', handleOpenCart)
    return () => window.removeEventListener('cart:open', handleOpenCart)
  }, [])

  const closeAllPanels = () => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setIsAccountOpen(false)
    setIsWishlistOpen(false)
    setIsCartOpen(false)
  }

  useEffect(() => {
    closeAllPanels()
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeAllPanels()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cargarProductosOferta = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/promo-productos/activa`)
      
      const respuesta = await fetch(`${BACKEND_URL}/api/promo-productos/activas/productos`)
      if (!respuesta.ok) {
        return
      }
      const data = await respuesta.json()
      const productos = data?.productos ?? []
      setProductosOferta(productos)
      setOfertasActivas(productos.length > 0)
    } catch {
      setProductosOferta([])
      setOfertasActivas(false)
    }
  }

  const productLinks = useMemo(() => ([
    { label: 'Lino', to: '/catalogo?material=Lino' },
    { label: 'Algodón', to: '/catalogo?material=Algodón' },
    { label: 'Jean', to: '/catalogo?material=Jean' }
  ]), [])


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
    <header ref={headerRef} className="header">

      {/* Menú izquierda */}
      <MenuButton
        isOpen={isMenuOpen}
        onClick={handleMenuToggle}
        onClose={() => setIsMenuOpen(false)}
        productLinks={productLinks}
        ofertasActivas={ofertasActivas}
        onAbrirMenu={cargarProductosOferta}
      />

      {/* Logo → Home */}
      <div className="logo">
        <Link to="/">
          <img src={LogoCamiseriaUrbana} alt="Logo Camisería Urbana" />
        </Link>
      </div>

      {/* Iconos derecha */}
      <div className="icons">

        {/* Buscar */}
        <SearchButton
          isOpen={isSearchOpen}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onClick={handleSearchClick}
          onClose={() => {
            setIsSearchOpen(false)
            setSearchQuery('')
          }}
        />

        {/* Login / Mi cuenta */}
        <AccountButton
          isOpen={isAccountOpen}
          onClick={handleAccountToggle}
          userRole={rol}
          onLogout={cerrarSesion}
          onClose={() => setIsAccountOpen(false)}
        />

        {/* Wishlist */}
        <WishlistButton
          isOpen={isWishlistOpen}
          onClick={handleWishlistToggle}
          onClose={() => setIsWishlistOpen(false)}
        />

        {/* Carrito */}
        <CartButton
          isOpen={isCartOpen}
          onClick={handleCartToggle}
          onClose={() => setIsCartOpen(false)}
        />

      </div>

    </header>
  )
}
