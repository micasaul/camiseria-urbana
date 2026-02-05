import { Outlet } from 'react-router-dom'
import Header from '../components/Header/Header.jsx'
import Footer from '../components/Footer/Footer.jsx'

export default function PublicLayout() {
  return (
    <div className="layout">
      <div className="shipping-banner">
        Envíos gratis a partir de $600
      </div>
      <Header />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
