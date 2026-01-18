import Footer from "./layouts/Footer/Footer.jsx"
import Header from "./layouts/Header/header.jsx"
import AppRoutes from "./routes/AppRoutes.jsx"
import './App.css'

function App() {
  return (
    <div className="layout">
      <Header />
      <main className="content">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  )
}

export default App
 