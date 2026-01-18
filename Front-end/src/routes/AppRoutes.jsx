import { Routes } from 'react-router-dom'
import AuthRoutes from './AuthRoutes.jsx'
import PaymentRoutes from './PaymentRoutes.jsx'

function AppRoutes() {
  return (
    <Routes>
      <AuthRoutes />
      <PaymentRoutes />
    </Routes>
  )
}

export default AppRoutes
