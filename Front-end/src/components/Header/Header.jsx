import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import "./Header.css"
import LogoCamiseriaUrbana from "../../assets/LogoCamiseriaUrbana.png" 
import MenuButton from './buttons/MenuButton.jsx'
import SearchButton from './buttons/SearchButton.jsx'
import AccountButton from './buttons/AccountButton.jsx'
import WishlistButton from './buttons/WishlistButton.jsx'
import CartButton from './buttons/CartButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header() {
  const navigate = useNavigate()
  const { rol, cerrarSesion } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const wishlistItems = useMemo(() => ([
    { id: 1, name: 'Camisa Lino', price: '$12.500', imageSrc: LogoCamiseriaUrbana },
    { id: 2, name: 'Camisa Algodón', price: '$10.900', imageSrc: LogoCamiseriaUrbana }
  ]), [])

  const cartItems = useMemo(() => ([
    {
      id: 1,
      name: 'Camisa Jean',
      price: '$14.200',
      size: 'L',
      color: 'Azul',
      quantity: 2,
      stock: 5,
      imageSrc: LogoCamiseriaUrbana
    }
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
    <header className="header">

      {/* Menú izquierda */}
      <MenuButton
        isOpen={isMenuOpen}
        onClick={handleMenuToggle}
        onClose={() => setIsMenuOpen(false)}
        productLinks={productLinks}
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
          items={wishlistItems}
        />

        {/* Carrito */}
        <CartButton
          isOpen={isCartOpen}
          onClick={handleCartToggle}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
        />

      </div>

    </header>
  )
}
