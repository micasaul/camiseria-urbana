import { Route } from 'react-router-dom'
import Login from '../pages/auth/Login'
import AuthCallback from '../pages/auth/AuthCallback'

export default function AuthRoutes() {
  return (
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </>
  )
}
