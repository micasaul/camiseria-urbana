import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"

const API_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337"

const Direcciones = () => {
  const { usuario, cargando } = useAuth()
  const [direcciones, setDirecciones] = useState([])
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false)

  useEffect(() => {
    if (!usuario) return

    const fetchDirecciones = async () => {
      setCargandoDirecciones(true)
      try {
        const token = localStorage.getItem("strapiToken")
        if (!token) throw new Error("No hay token de sesión")

        // Obtenemos las direcciones a través del usuario con populate
        // Esto es más directo y evita problemas con filtros
        const userWithDirecciones = await fetch(
          `${API_URL}/api/users/me?populate[0]=direccion_usuarios&populate[1]=direccion_usuarios.direccion`,  
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!userWithDirecciones.ok) {
          throw new Error("No se pudieron obtener las direcciones")
        }

        const userDataWithDirecciones = await userWithDirecciones.json()
        const direccionesUsuarios = userDataWithDirecciones.direccion_usuarios?.data ?? userDataWithDirecciones.direccion_usuarios ?? []
        
        const direccionesList = direccionesUsuarios
          .map(item => {
            const attrs = item?.attributes ?? item
            const direccion = attrs.direccion?.data?.attributes ?? attrs.direccion?.attributes ?? attrs.direccion
            const createdAt = attrs.createdAt || item?.createdAt
            return direccion ? { ...direccion, createdAt } : null
          })
          .filter(Boolean)
          // Ordenamos por fecha de creación (más reciente primero)
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0
            return new Date(b.createdAt) - new Date(a.createdAt)
          })
        
        setDirecciones(direccionesList)
      } catch (error) {
        console.error("Error direcciones:", error)
        setDirecciones([])
      } finally {
        setCargandoDirecciones(false)
      }
    }

    fetchDirecciones()
  }, [usuario])

  if (cargando || cargandoDirecciones) return <p>Cargando direcciones...</p>
  if (!usuario) return <p>No hay sesión activa</p>

  // Ordenamos las direcciones por fecha de creación (más reciente primero)
  const direccionActual = direcciones.length > 0 ? direcciones[0] : null
  const direccionesHistorial = direcciones.slice(1) // Todas excepto la primera

  return (
    <section className="direcciones">
      <h1>Direcciones</h1>
      
      <div className="direccion-actual">
        <h2>Dirección actual</h2>
        {direccionActual ? (
          <div className="direccion-info">
            <p>
              {direccionActual.calle ?? "—"} {direccionActual.numero ?? "—"}, CP:{" "}
              {direccionActual.cp ?? "—"}
            </p>
          </div>
        ) : (
          <p>No tenés direcciones registradas.</p>
        )}
      </div>

      {direccionesHistorial.length > 0 && (
        <div className="direcciones-historial">
          <h2>Historial de direcciones</h2>
          {direccionesHistorial.map((direccion, index) => (
            <div key={index} className="direccion-item">
              <div className="direccion-info">
                <p>
                  {direccion.calle ?? "—"} {direccion.numero ?? "—"}, CP:{" "}
                  {direccion.cp ?? "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/cuenta/agregar-direccion">
        <BlueButton>Agregar nueva</BlueButton>
      </Link>
    </section>
  )
}

export default Direcciones
