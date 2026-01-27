// src/pages/mi-cuenta/MiCuenta.jsx
import "./MiCuenta.css"
import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"
import LinkButton from "../../components/buttons/link-btn/LinkButton"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"

import userIcon from "../../assets/1144811.png"
import mapIcon from "../../assets/map-location-pin-icon-free.png"
const API_URL = import.meta.env.VITE_BACKEND_URL

const MiCuenta = () => {
  const { usuario, cargando } = useAuth()

  const [ventas, setVentas] = useState([])
  const [cargandoVentas, setCargandoVentas] = useState(false)
  const [direcciones, setDirecciones] = useState([])
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false)

  useEffect(() => {
    if (!usuario) return

    const fetchVentas = async () => {
      setCargandoVentas(true)
      try {
        const token = localStorage.getItem("strapiToken")
        if (!token) throw new Error("No hay token de sesión")

        // Obtener las ventas directamente desde el usuario con populate (más seguro y directo)
        const userWithVentas = await fetch(
          `${API_URL}/api/users/me?populate[0]=ventas&populate[1]=ventas.direccion&populate[2]=ventas.detalle_ventas&populate[3]=ventas.detalle_ventas.variacion&populate[4]=ventas.detalle_ventas.variacion.producto&populate[5]=ventas.detalle_ventas.combo&populate[6]=ventas.detalle_ventas.combo.imagen`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (!userWithVentas.ok) {
          throw new Error("No se pudieron obtener las ventas")
        }

        const userData = await userWithVentas.json()
        const ventasRaw = userData?.ventas?.data ?? userData?.ventas ?? []
        
        // Ordenar por fecha descendente (más reciente primero)
        const ventasOrdenadas = ventasRaw
          .map(item => {
            const attrs = item?.attributes ?? item
            return {
              ...attrs,
              id: item?.id ?? attrs?.id,
              documentId: item?.documentId ?? attrs?.documentId ?? null
            }
          })
          .sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
            return fechaB - fechaA // Descendente
          })
        
        setVentas(ventasOrdenadas)
      } catch (error) {
        console.error("Error ventas:", error)
        setVentas([])
      } finally {
        setCargandoVentas(false)
      }
    }

    fetchVentas()
  }, [usuario])

  useEffect(() => {
    if (!usuario) return

    const fetchDirecciones = async () => {
      setCargandoDirecciones(true)
      try {
        const token = localStorage.getItem("strapiToken")
        if (!token) throw new Error("No hay token de sesión")

        // Obtenemos las direcciones a través del usuario con populate
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

  if (cargando) {
    return <p>Cargando cuenta...</p>
  }

  if (!usuario) {
    return <p>No hay sesión activa</p>
  }

  return (
    <div className="mi-cuenta">
      {/* PERFIL */}
      <section className="perfil">
        <div className="perfil-card">
          <h2>
            <img src={userIcon} alt="Usuario" />
            Datos personales
          </h2>
          <p>
            <strong>Nombre:</strong> {usuario.username}
          </p>
          <p>
            <strong>Email:</strong> {usuario.email}
          </p>
        </div>

        {/* SECCIÓN DIRECCIONES */}
        <div className="direcciones-card">
          <h2>
            <img src={mapIcon} alt="Direcciones" />
            Direcciones
          </h2>
          <div>
            {cargandoDirecciones ? (
              <p>Cargando dirección...</p>
            ) : direcciones.length > 0 ? (
              <>
                <p>
                  {direcciones[0].calle ?? "—"} {direcciones[0].numero ?? "—"}, CP:{" "}
                  {direcciones[0].cp ?? "—"}
                </p>
                <p>
                  {direcciones[0].provincia ?? "—"}
                </p>
              </>
            ) : (
              <p>No tenés direcciones registradas.</p>
            )}
          </div>
          <Link to="/cuenta/direcciones">
            <BlueButton>Ver más</BlueButton>
          </Link>
        </div>
      </section>

      {/* VENTAS */}
      <section className="ventas">
        <h2>Mis pedidos</h2>

        {cargandoVentas && <p>Cargando ventas...</p>}

        {!cargandoVentas && ventas.length === 0 && (
          <p>No tenés pedidos todavía</p>
        )}

        {!cargandoVentas && ventas.length > 0 && (
          <div className={`ventas-container ${ventas.length >= 2 ? 'ventas-scroll' : ''}`}>
            {ventas.map((venta) => {
              const fecha = venta.fecha
              const total = venta.total
              const estado = venta.estado
              const nroSeguimiento = venta.nroSeguimiento

              return (
                <div key={venta.id} className="venta">
                  <p>
                    <strong>Orden:</strong> #{venta.documentId}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {fecha ? new Date(fecha).toLocaleDateString() : "—"}
                  </p>
                  <p>
                    <strong>Estado:</strong> {estado ?? "Sin estado"}
                  </p>
                  <p>
                    <strong>Número de seguimiento:</strong> {nroSeguimiento ?? "—"}
                  </p>
                  <p>
                    <strong>Total:</strong> ${total != null ? total : 0}
                  </p>
                  <Link to={`/cuenta/detalle-compra/${venta.documentId ?? venta.attributes?.documentId ?? venta.id}`}>
                    <LinkButton>Más detalles</LinkButton>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default MiCuenta
