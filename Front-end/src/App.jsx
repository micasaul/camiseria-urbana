import { Routes, Route } from 'react-router-dom'
import AuthCallback from './pages/AuthCallback'
import Footer from "./layouts/Footer/Footer.jsx"
import Header from "./layouts/Header/header.jsx"
import './App.css'

function App() {
  return (
    <div className="layout">
      <Header />
      <main className="content">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
 