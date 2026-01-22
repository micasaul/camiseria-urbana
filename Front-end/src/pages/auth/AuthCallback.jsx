import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const STRAPI_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337'

function AuthCallback() {
  const navigate = useNavigate()
  const { establecerSesion } = useAuth()
  const [jwt, setJwt] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const idToken = urlParams.get('id_token')
    const accessToken = urlParams.get('access_token')

    if (idToken || accessToken) {
      setLoading(true)
      
      fetch(`${STRAPI_URL}/api/auth/google-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken,
          access_token: accessToken,
        }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.jwt) {
            console.info('Respuesta OAuth Strapi:', data)
            setJwt(data.jwt)
            setUser(data.user)
            await establecerSesion({ token: data.jwt, usuario: data.user })
            // Limpiar URL
            window.history.replaceState({}, document.title, window.location.pathname)
            navigate('/')
          } else {
            setError(data.error?.message || data.message || 'Ocurrió un error desconocido')
          }
        })
        .catch((err) => {
          setError(err.message)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white' }}>Procesando autenticación...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'red' }}>Error</h1>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', color: 'white' }}>
          {error}
        </pre>
      </div>
    )
  }

  if (jwt) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
        <h1 style={{ color: 'black' }}>Autenticación Exitosa</h1>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: 'black' }}>JWT Token:</h2>
          <pre style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', overflowX: 'auto', wordBreak: 'break-all', color: 'black' }}>
            {jwt}
          </pre>
        </div>
        {user && (
          <div>
            <h2 style={{ color: 'black' }}>Usuario:</h2>
            <pre style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', color: 'black' }}>
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: 'black' }}>Google OAuth Callback</h1>
      <p style={{ color: 'black' }}>Esperando tokens de Google...</p>
    </div>
  )
}

export default AuthCallback
