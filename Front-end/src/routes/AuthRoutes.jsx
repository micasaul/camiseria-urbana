import { Route } from 'react-router-dom'
import AuthCallback from '../pages/AuthCallback'

function AuthRoutes() {
  return <Route path="/auth/callback" element={<AuthCallback />} />
}

export default AuthRoutes
