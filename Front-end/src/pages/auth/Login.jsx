import './Login.css'
import LogoGoogle from '../../assets/logo-google.png'

const STRAPI_URL = import.meta.env.VITE_BACKEND_URL

function Login() {
  const handleGoogleLogin = () => {
    const frontendUrl = `${window.location.origin}/auth/callback`
    
    window.location.href = `${STRAPI_URL}/api/connect/google?callback=${encodeURIComponent(frontendUrl)}`
  }

  return (
    <div className="login-page">
      <button type="button" className="login-google-button" onClick={handleGoogleLogin}>
        <span className="login-google-icon" aria-hidden="true">
          <img src={LogoGoogle} alt="" />
        </span>
        <span>Continuar con Google</span>
      </button>
    </div>
  )
}

export default Login