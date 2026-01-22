import BlueButton from '../../components/buttons/blue-btn/BlueButton.jsx'
import './Login.css'

const STRAPI_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337'

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${STRAPI_URL}/api/connect/google`
  }

  return (
    <div className="login-page">
      <h1 className="login-title">Ingresar</h1>
      <BlueButton width="240px" height="44px" fontSize="15px" onClick={handleGoogleLogin}>
        Ingresar con Google
      </BlueButton>
    </div>
  )
}

export default Login
