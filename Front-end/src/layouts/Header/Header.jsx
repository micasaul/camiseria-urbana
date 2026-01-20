import { Link } from 'react-router-dom'
import "./Header.css"
import LogoCamiseriaUrbana from "../../assets/LogoCamiseriaUrbana.png" 

export default function Header() {
  return (
    <header className="header">

      {/* Menú izquierda (sin ruta por ahora) */}
      <button className="white-btn">
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
        <Link to="/buscar">
          <button className="white-btn ghost-btn">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
            </svg>
          </button>
        </Link>

        {/* Login / Mi cuenta */}
        <Link to="/login">
          <button className="white-btn ghost-btn">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd"
                d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                clipRule="evenodd"/>
            </svg>
          </button>
        </Link>

        {/* Wishlist */}
        <Link to="/wishlist">
          <button className="white-btn ghost-btn">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"/>
            </svg>
          </button>
        </Link>

        {/* Carrito / checkout */}
        <Link to="/checkout">
          <button className="white-btn ghost-btn">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
            </svg>
          </button>
        </Link>

      </div>
    </header>
  )
}
