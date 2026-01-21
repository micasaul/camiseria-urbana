const STRAPI_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337'

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${STRAPI_URL}/api/connect/google`
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>LOGIN</h1>
      <button type="button" onClick={handleGoogleLogin}>
        Ingresar con Google
      </button>
    </div>
  )
}

export default Login
  