import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import BlueButton from "../../components/buttons/blue-btn/BlueButton"
import "./AgregarDireccion.css"

const API_URL = import.meta.env.BACKEND_URL ?? "http://localhost:1337"

const AgregarDireccion = () => {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    calle: "",
    numero: "",
    cp: ""
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

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
      const token = localStorage.getItem("strapiToken")
      if (!token) throw new Error("No hay token de sesión")

      // Usamos el endpoint personalizado que crea dirección y relación en una sola operación
      // Este endpoint usa entityService directamente y evita problemas de permisos
      const direccionUsuarioRes = await fetch(`${API_URL}/api/direcciones-usuarios/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          data: {
            calle: formData.calle,
            numero: formData.numero,
            cp: formData.cp
          }
        })
      })

      if (!direccionUsuarioRes.ok) {
        const errorText = await direccionUsuarioRes.text()
        console.error("Error al crear dirección:", errorText)
        throw new Error("No se pudo crear la dirección")
      }

      // Si todo salió bien, redirigimos a mi-cuenta
      navigate("/mi-cuenta")
    } catch (error) {
      console.error("Error al guardar dirección:", error)
      setError(error.message || "Error al guardar la dirección")
    } finally {
      setCargando(false)
    }
  }

  if (!usuario) {
    return <p>No hay sesión activa</p>
  }

  return (
    <section className="agregar-direccion">
      <h1>Agregar nueva dirección</h1>

      <form onSubmit={handleSubmit} className="direccion-form">
        <div className="form-group">
          <label htmlFor="calle">Calle</label>
          <input
            type="text"
            id="calle"
            name="calle"
            value={formData.calle}
            onChange={handleChange}
            required
            placeholder="Ingresá la calle"
          />
        </div>

        <div className="form-group">
          <label htmlFor="numero">Número</label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            required
            placeholder="Ingresá el número"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cp">Código postal</label>
          <input
            type="text"
            id="cp"
            name="cp"
            value={formData.cp}
            onChange={handleChange}
            required
            placeholder="Ingresá el código postal"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <BlueButton type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar"}
        </BlueButton>
      </form>
    </section>
  )
}

export default AgregarDireccion
