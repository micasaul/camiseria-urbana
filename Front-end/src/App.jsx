import Footer from "./components/Footer/Footer.jsx"
import Header from "./components/Header/Header.jsx"
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
 