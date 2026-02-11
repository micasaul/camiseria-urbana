import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"
import LinkButton from "../../components/buttons/link-btn/LinkButton"
import { getImageUrl } from "../../utils/url.js"
import NgrokImage from "../../components/NgrokImage.jsx"
import "./CrearResena.css"

const API_URL = import.meta.env.VITE_BACKEND_URL

const CrearResena = () => {
  const { productoId } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [esCombo, setEsCombo] = useState(false)
  const [cargandoItem, setCargandoItem] = useState(true)
  const [formData, setFormData] = useState({
    valoracion: "",
    comentario: ""
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!productoId) return

    const fetchItem = async () => {
      try {
        const token = localStorage.getItem("strapiToken")
        
        let res = await fetch(
          `${API_URL}/api/productos?filters[documentId][$eq]=${productoId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        )

        if (res.ok) {
          const data = await res.json()
          const productos = Array.isArray(data) ? data : (data?.data ?? [])
          if (productos.length > 0) {
            const prod = productos[0]
            const attrs = prod?.attributes ?? prod
            const imagenData = attrs?.imagen?.data ?? attrs?.imagen
            const imagen = imagenData?.attributes ?? imagenData ?? {}
            const imagenUrl = imagen?.url ? getImageUrl(imagen.url) : null

            setItem({
              id: prod?.id,
              documentId: prod?.documentId,
              nombre: attrs?.nombre ?? "—",
              imagenUrl
            })
            setEsCombo(false)
            setCargandoItem(false)
            return
          }
        }

        res = await fetch(
          `${API_URL}/api/combos?filters[documentId][$eq]=${productoId}&populate=imagen`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        )

        if (!res.ok) throw new Error("No se pudo obtener el item")

        const dataCombo = await res.json()
        const combos = Array.isArray(dataCombo) ? dataCombo : (dataCombo?.data ?? [])
        if (combos.length > 0) {
          const combo = combos[0]
          const attrs = combo?.attributes ?? combo
          const imagenData = attrs?.imagen?.data ?? attrs?.imagen
          const imagen = imagenData?.attributes ?? imagenData ?? {}
          const imagenUrl = imagen?.url ? getImageUrl(imagen.url) : null

          setItem({
            id: combo?.id,
            documentId: combo?.documentId,
            nombre: attrs?.nombre ?? "—",
            imagenUrl
          })
          setEsCombo(true)
        } else {
          throw new Error("No se encontró el item")
        }
      } catch (error) {
        console.error("Error cargando item:", error)
        setError("No se pudo cargar el item")
      } finally {
        setCargandoItem(false)
      }
    }

    fetchItem()
  }, [productoId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError("")

    try {
      if (!formData.valoracion || Number(formData.valoracion) < 1 || Number(formData.valoracion) > 5) {
        setError("Por favor seleccioná una valoración entre 1 y 5")
        setCargando(false)
        return
      }

      if (!usuario?.documentId) {
        setError("No hay sesión activa")
        setCargando(false)
        return
      }

      if (!item?.documentId) {
        setError("No se pudo obtener el item")
        setCargando(false)
        return
      }

      const token = localStorage.getItem("strapiToken")
      if (!token) throw new Error("No hay token de sesión")

      const userRes = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!userRes.ok) throw new Error("No se pudo obtener el usuario")
      const userData = await userRes.json()
      const userId = userData?.id

      const itemIdNum = item.id
      if (!itemIdNum) throw new Error("No se pudo obtener el ID del item")

      const payload = {
        data: {
          valoracion: Number(formData.valoracion),
          comentario: formData.comentario.trim() || null,
          fecha: new Date().toISOString().split('T')[0],
          users_permissions_user: userId
        }
      }

      if (esCombo) {
        payload.data.combo = itemIdNum
      } else {
        payload.data.producto = itemIdNum
      }

      const resenaRes = await fetch(`${API_URL}/api/resenas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!resenaRes.ok) {
        const errorText = await resenaRes.text()
        console.error("Error al crear reseña:", errorText)
        throw new Error("No se pudo crear la reseña")
      }

      if (esCombo) {
        navigate(`/combo/${item.documentId}`)
      } else {
        navigate(`/producto/${item.documentId}`)
      }
    } catch (error) {
      console.error("Error al guardar reseña:", error)
      setError(error.message || "Error al guardar la reseña")
    } finally {
      setCargando(false)
    }
  }

  if (cargandoItem) {
    return <div className="crear-resena-page"><p className="crear-resena-loading">Cargando {esCombo ? 'combo' : 'producto'}...</p></div>
  }

  if (!item) {
    return (
      <div className="crear-resena-page">
        <p className="crear-resena-error">No se pudo cargar el {esCombo ? 'combo' : 'producto'}</p>
        <Link to="/mi-cuenta">
          <LinkButton>Volver a mi cuenta</LinkButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="crear-resena-page">
      <div className="crear-resena-container">
        <h1>Agregar reseña</h1>

        <div className="crear-resena-producto">
          {item.imagenUrl && (
            <NgrokImage src={item.imagenUrl} alt={item.nombre} className="crear-resena-imagen" />
          )}
          <div className="crear-resena-producto-info">
            <h2>{item.nombre}</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="crear-resena-form">
          <div className="form-group">
            <label htmlFor="valoracion">Valoración *</label>
            <select
              id="valoracion"
              name="valoracion"
              value={formData.valoracion}
              onChange={handleChange}
              required
            >
              <option value="">Seleccioná una valoración</option>
              <option value="1">1 - Muy malo</option>
              <option value="2">2 - Malo</option>
              <option value="3">3 - Regular</option>
              <option value="4">4 - Bueno</option>
              <option value="5">5 - Excelente</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comentario">Comentario</label>
              <textarea
              id="comentario"
              name="comentario"
              value={formData.comentario}
              onChange={handleChange}
              placeholder={`Escribí tu comentario sobre el ${esCombo ? 'combo' : 'producto'}...`}
              rows="6"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="crear-resena-buttons">
            <BlueButton type="submit" disabled={cargando}>
              {cargando ? "Guardando..." : "Guardar reseña"}
            </BlueButton>
            <Link to={esCombo ? `/combo/${item.documentId}` : `/producto/${item.documentId}`}>
              <LinkButton>Cancelar</LinkButton>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CrearResena
