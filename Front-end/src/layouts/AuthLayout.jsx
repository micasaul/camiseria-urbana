import { Outlet, Link } from 'react-router-dom'
import './AuthLayout.css'
import '../components/Header/Header.css'
import LogoCamiseriaUrbana from '../assets/LogoCamiseriaUrbana.png'

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <header className="header auth-header">
        <div className="logo">
          <Link to="/">
            <img src={LogoCamiseriaUrbana} alt="Logo Camisería Urbana" />
          </Link>
        </div>
      </header>
      <div className="auth-content">
        <Outlet />
      </div>
    </div>
  )
}
