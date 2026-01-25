import "./MiCuenta.css"
import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"
import LinkButton from "../../components/buttons/link-btn/LinkButton"

import userIcon from "../../assets/1144811.png"
const API_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337"

const MiCuenta = () => {
  const { usuario, cargando } = useAuth()

  const [ventas, setVentas] = useState([])
  const [cargandoVentas, setCargandoVentas] = useState(false)

  useEffect(() => {
    if (!usuario) return

    const fetchVentas = async () => {
      setCargandoVentas(true)
      try {
        const token = localStorage.getItem("strapiToken")

        const res = await fetch(
          `${API_URL}/api/ventas?filters[users_permissions_user][id][$eq]=${usuario.id}&sort=fecha:desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!res.ok) {
          throw new Error("Error al obtener ventas")
        }

        const data = await res.json()
        setVentas(data.data)
      } catch (error) {
        console.error("Error ventas:", error)
      } finally {
        setCargandoVentas(false)
      }
    }

    fetchVentas()
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
      </section>

      {/* VENTAS */}
      <section className="ventas">
        <h2>Mis pedidos</h2>

        {cargandoVentas && <p>Cargando ventas...</p>}

        {!cargandoVentas && ventas.length === 0 && (
          <p>No tenés pedidos todavía</p>
        )}

        {!cargandoVentas &&
          ventas.map((venta) => {
            // Ahora accedemos a los campos directamente del objeto, no a attributes
            const fecha = venta.fecha
            const total = venta.total
            const estado = venta.estado
            const nroSeguimiento = venta.nroSeguimiento

            return (
              <div key={venta.id} className="venta">
                <p>
                  <strong>Orden número:</strong> #{venta.id}
                </p>

                <p>
                  <strong>Fecha:</strong>{" "}
                  {fecha ? new Date(fecha).toLocaleDateString() : "—"}
                </p>

                <p>
                  <strong>Total:</strong> ${total != null ? total : 0}
                </p>

                <p>
                  <strong>Estado:</strong> {estado ?? "Sin estado"}
                </p>

                <p>
                  <strong>Número de seguimiento:</strong> {nroSeguimiento ?? "—"}
                </p>

                <Link to={`/cuenta/detalle-compra/${venta.id}`}>
                  <LinkButton>Más detalles</LinkButton>
                </Link>
              </div>
            )
          })}
      </section>
    </div>
  )
}

export default MiCuenta
