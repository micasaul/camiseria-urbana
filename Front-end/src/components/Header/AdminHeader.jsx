import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import "./Header.css"
import LogoCamiseriaUrbana from "../../assets/LogoCamiseriaUrbana.png" 
import SearchButton from './buttons/SearchButton.jsx'
import AccountButton from './buttons/AccountButton.jsx'
import AdminButton from './buttons/AdminButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { rol, cerrarSesion } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const adminLinks = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard', to: '/admin' },
    {
      id: 'productos',
      label: 'Productos',
      children: [
        { id: 'productos-agregar', label: 'Agregar', to: '/admin/productos/agregar' },
        { id: 'productos-listar', label: 'Listar', to: '/admin/productos/listar' }
      ]
    },
    {
      id: 'promos',
      label: 'Promos',
      children: [
        { id: 'promos-agregar', label: 'Agregar', to: '/admin/promos/agregar' },
        { id: 'promos-listar', label: 'Listar', to: '/admin/promos/listar' }
      ]
    },
    { id: 'ventas', label: 'Ventas', to: '/admin/ventas' }
  ]), [])

  const handleSearchClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true)
      setIsAccountOpen(false)
      return
    }

    const query = searchQuery.trim()
    const target = query ? `/buscar?query=${encodeURIComponent(query)}` : '/buscar'
    navigate(target)
  }

  const handleAccountToggle = () => {
    setIsAccountOpen((prev) => !prev)
    setIsSearchOpen(false)
  }

  return (
    <header className="header admin-header">
      {/* Menú admin */}
      {rol === 'admin' && (
        <AdminButton
          items={adminLinks}
        />
      )}

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
      </div>
    </header>
  )
}
