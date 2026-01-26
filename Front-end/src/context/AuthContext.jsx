import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STRAPI_URL = import.meta.env.BACKEND_URL
const TOKEN_STORAGE_KEY = 'strapiToken'
const USER_STORAGE_KEY = 'strapiUser'
const ROLE_STORAGE_KEY = 'strapiRole'

export function AuthProvider({ children }) {
  const [rol, setRol] = useState('guest')
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY)

    if (storedRole) {
      setRol(storedRole)
    }

    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser))
      } catch {
        setUsuario(null)
      }
    }
    if (token) {
      obtenerUsuarioActual(token).finally(() => {
        setCargando(false)
      })
      return
    }

    setCargando(false)
  }, [])

  const normalizarRol = (rolStrapi) => {
    if (!rolStrapi) {
      return 'client'
    }
    const rolNormalizado = rolStrapi.toLowerCase()
    if (rolNormalizado.includes('admin')) {
      return 'admin'
    }
    return 'client'
  }

  const obtenerUsuarioActual = async (token) => {
    try {
      const respuesta = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!respuesta.ok) {
        throw new Error('No se pudo obtener el usuario actual.')
      }

      const data = await respuesta.json()
      console.info('Usuario actual Strapi:', data, token)
      setUsuario(data)
      const rolCalculado = normalizarRol(data?.role?.name)
      setRol(rolCalculado)
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
      window.localStorage.setItem(ROLE_STORAGE_KEY, rolCalculado)
    } catch {
      cerrarSesion()
    }
  }

  const establecerSesion = async ({ token, usuario: usuarioEntrante }) => {
    if (!token) {
      throw new Error('No se recibió token de autenticación.')
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setCargando(true)

    if (usuarioEntrante) {
      const rolEntrante = usuarioEntrante?.role?.name ?? usuarioEntrante?.role?.type
      if (rolEntrante) {
        const rolCalculado = normalizarRol(rolEntrante)
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioEntrante))
        window.localStorage.setItem(ROLE_STORAGE_KEY, rolCalculado)
        setUsuario(usuarioEntrante)
        setRol(rolCalculado)
        console.info('Rol detectado en sesión:', rolCalculado)
        return { token, user: usuarioEntrante, rol: rolCalculado }
      }
    }

    await obtenerUsuarioActual(token)
    setCargando(false)
    return { token }
  }

  const iniciarSesion = async ({ identificador, password }) => {
    const respuesta = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: identificador,
        password
      })
    })

    if (!respuesta.ok) {
      throw new Error('Error al iniciar sesión.')
    }

    const data = await respuesta.json()
    return establecerSesion({ token: data?.jwt, usuario: data?.user ?? null })
  }

  const cerrarSesion = () => {
    setRol('guest')
    setUsuario(null)
    setCargando(false)
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(ROLE_STORAGE_KEY)
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }

  const refrescarUsuario = async () => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      return
    }
    setCargando(true)
    await obtenerUsuarioActual(token)
    setCargando(false)
  }

  const value = useMemo(
    () => ({
      rol,
      usuario,
      cargando,
      setRol,
      establecerSesion,
      iniciarSesion,
      cerrarSesion,
      refrescarUsuario
    }),
    [rol, usuario]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
