import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"
import LinkButton from "../../components/buttons/link-btn/LinkButton"
import "./Direcciones.css"

const API_URL = import.meta.env.VITE_BACKEND_URL

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
            const direccionData = attrs.direccion?.data ?? attrs.direccion
            const direccion = direccionData?.attributes ?? direccionData
            const documentId = direccionData?.documentId ?? direccion?.documentId ?? direccionData?.id ?? direccion?.id
            const createdAt = attrs.createdAt || item?.createdAt
            return direccion ? { ...direccion, createdAt, documentId } : null
          })
          .filter(Boolean)
          // Eliminamos duplicados basándonos en el documentId de la dirección
          .filter((direccion, index, self) => 
            index === self.findIndex(d => d.documentId === direccion.documentId)
          )
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

  const direccionesHistorial = direcciones

  return (
    <section className="direcciones">
      <div className="direcciones-header">
        <h1>Direcciones</h1>
        <Link to="/cuenta/agregar-direccion">
          <BlueButton>Agregar nueva</BlueButton>
        </Link>
      </div>

      {direccionesHistorial.length > 0 ? (
        <div className="direcciones-historial">
          {direccionesHistorial.map((direccion) => (
            <div key={direccion.documentId || direccion.id} className="direccion-item">
              <div className="direccion-info">
                <p className="direccion-linea">
                  {direccion.calle ?? "—"} {direccion.numero ?? "—"}
                </p>
                <p className="direccion-linea">
                  CP: {direccion.cp ?? "—"}
                  {direccion.provincia && ` • ${direccion.provincia}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="direcciones-vacio">
          <p>No tenés direcciones registradas.</p>
        </div>
      )}

      <div className="direcciones-volver">
        <Link to="/mi-cuenta">
          <LinkButton>Volver a mi cuenta</LinkButton>
        </Link>
      </div>
    </section>
  )
}

export default Direcciones
