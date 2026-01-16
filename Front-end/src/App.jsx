import { Routes, Route } from 'react-router-dom'
import AuthCallback from './pages/AuthCallback'
import CheckoutTest from './pages/CheckoutTest.jsx'
import PaymentFailure from './pages/PaymentFailure.jsx'
import PaymentPending from './pages/PaymentPending.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
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
          <Route path="/checkout-test" element={<CheckoutTest />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/pending" element={<PaymentPending />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
 