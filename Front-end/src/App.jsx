import { Routes, Route } from 'react-router-dom'
import AuthCallback from './pages/AuthCallback'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  )
}

export default App
