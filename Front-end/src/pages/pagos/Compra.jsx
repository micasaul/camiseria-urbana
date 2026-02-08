import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MercadoPagoButton from "../../components/buttons/mp-btn/MercadoPagoButton.jsx";
import { obtenerCarritoCompleto } from "../../api/carrito.js";
import { obtenerDescuentosActivos } from "../../api/promos.js";
import { validarCuponParaUsuario } from "../../api/cupones.js";
import { parsearPrecio, aplicarDescuentos, calcularSubtotal } from "../../utils/carrito.js";
import { obtenerPrecioEnvio } from "../../utils/envio.js";
import NgrokImage from "../../components/NgrokImage.jsx";
import "./Compra.css"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Compra() {
  const { usuario: usuarioAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState("");
  const [usuario, setUsuario] = useState({
    nombre: "",
    telefono: "",
    provincia: "",
    ciudad: "",
    calle: ""
  });
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [cuponError, setCuponError] = useState("");
  const [cuponLoading, setCuponLoading] = useState(false);

  useEffect(() => {
    async function fetchCarrito() {
      try {
        const [items, descuentosMap] = await Promise.all([
          obtenerCarritoCompleto(),
          obtenerDescuentosActivos()
        ]);
        
        const productosConDescuento = aplicarDescuentos(items, descuentosMap);
        const soloConStock = productosConDescuento.filter((p) => !p.sinStock);
        setProductos(soloConStock);
      } catch (error) {
        console.error("Error cargando carrito:", error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCarrito();
  }, []);

  useEffect(() => {
    if (!usuarioAuth) return;

    async function fetchDirecciones() {
      setCargandoDirecciones(true);
      try {
        const token = localStorage.getItem("strapiToken");
        if (!token) throw new Error("No hay token de sesión");

        const userWithDirecciones = await fetch(
          `${BACKEND_URL}/api/users/me?populate[0]=direccion_usuarios&populate[1]=direccion_usuarios.direccion`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!userWithDirecciones.ok) {
          throw new Error("No se pudieron obtener las direcciones");
        }

        const userDataWithDirecciones = await userWithDirecciones.json();
        const direccionesUsuarios = userDataWithDirecciones.direccion_usuarios?.data ?? userDataWithDirecciones.direccion_usuarios ?? [];
        
        const direccionesList = direccionesUsuarios
          .map(item => {
            const attrs = item?.attributes ?? item;
            const direccionData = attrs.direccion?.data ?? attrs.direccion;
            const direccion = direccionData?.attributes ?? direccionData;
            const documentId = direccionData?.documentId ?? direccion?.documentId ?? direccionData?.id ?? direccion?.id;
            const createdAt = attrs.createdAt || item?.createdAt;
            return direccion ? { ...direccion, createdAt, documentId } : null;
          })
          .filter(Boolean)
          .filter((direccion, index, self) => 
            index === self.findIndex(d => d.documentId === direccion.documentId)
          )
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        
        setDirecciones(direccionesList);
        // Seleccionar la primera dirección por defecto si existe
        if (direccionesList.length > 0) {
          setDireccionSeleccionadaId(direccionesList[0].documentId || direccionesList[0].id);
        }
      } catch (error) {
        console.error("Error direcciones:", error);
        setDirecciones([]);
      } finally {
        setCargandoDirecciones(false);
      }
    }

    fetchDirecciones();
  }, [usuarioAuth]);

  // Actualizar datos del usuario cuando se selecciona una dirección
  useEffect(() => {
    if (direccionSeleccionadaId && direcciones.length > 0) {
      const direccionSeleccionada = direcciones.find(d => (d.documentId || d.id) === direccionSeleccionadaId);
      if (direccionSeleccionada) {
        setUsuario(prev => ({
          ...prev,
          provincia: direccionSeleccionada.provincia || "",
          calle: `${direccionSeleccionada.calle || ""} ${direccionSeleccionada.numero || ""}`.trim()
        }));
      }
    }
  }, [direccionSeleccionadaId, direcciones]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({ ...prev, [name]: value }));
  };

  const handleAplicarCupon = async () => {
    const codigo = cuponInput.trim();
    setCuponError("");
    setCuponAplicado(null);
    if (!codigo) return;
    const userDocumentId = usuarioAuth?.documentId ?? usuarioAuth?.id;
    setCuponLoading(true);
    try {
      const cupon = await validarCuponParaUsuario(codigo, userDocumentId);
      setCuponAplicado({ documentId: cupon.documentId, nombre: cupon.nombre, descuento: cupon.descuento });
    } catch (err) {
      setCuponError(err?.message || "No se pudo validar el cupón.");
    } finally {
      setCuponLoading(false);
    }
  };

  const subtotal = calcularSubtotal(productos);
  const envioBase = obtenerPrecioEnvio(usuario.provincia);
  const envio = subtotal >= 600 ? 0 : envioBase;
  const descuentoCupon =
    cuponAplicado && cuponAplicado.descuento > 0
      ? (subtotal * cuponAplicado.descuento) / 100
      : 0;
  const total = subtotal - descuentoCupon + envio;

  if (loading) return <p className="compra-loading">Cargando carrito...</p>;
  if (productos.length === 0) return <p className="compra-empty">No hay productos en el carrito.</p>;

  return (
    <div className="compra-page">
      <div className="compra-container">
        {/* Columna Izquierda: Datos del Usuario */}
        <aside className="compra-usuario">
          <h2>Datos del Usuario</h2>

          <div className="compra-form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={usuario.nombre}
              onChange={handleChange}
              placeholder="Ingrese su nombre completo"
            />
          </div>

          <div className="compra-form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={usuario.telefono}
              onChange={handleChange}
              placeholder="Ingrese su teléfono"
            />
          </div>

          <div className="compra-form-group">
            <label>Cupón</label>
            <div className="compra-cupon-row">
              <input
                type="text"
                value={cuponInput}
                onChange={(e) => {
                  setCuponInput(e.target.value);
                  setCuponError("");
                }}
                placeholder="Código del cupón"
                disabled={cuponLoading}
              />
              <button
                type="button"
                className="compra-cupon-btn"
                onClick={handleAplicarCupon}
                disabled={cuponLoading || !cuponInput.trim()}
              >
                {cuponLoading ? "..." : "Aplicar"}
              </button>
            </div>
            {cuponError && <p className="compra-cupon-error" style={{ color: "#c00", marginTop: "4px", fontSize: "0.9rem" }}>{cuponError}</p>}
            {cuponAplicado && <p className="compra-cupon-ok" style={{ color: "#0a0", marginTop: "4px", fontSize: "0.9rem" }}>Cupón "{cuponAplicado.nombre}" aplicado: {cuponAplicado.descuento}% de descuento</p>}
          </div>

          <div className="compra-form-group">
            <label>Dirección de envío</label>
            {cargandoDirecciones ? (
              <p>Cargando direcciones...</p>
            ) : direcciones.length > 0 ? (
              <select
                name="direccion"
                value={direccionSeleccionadaId}
                onChange={(e) => setDireccionSeleccionadaId(e.target.value)}
              >
                {direcciones.map((direccion) => (
                  <option key={direccion.documentId || direccion.id} value={direccion.documentId || direccion.id}>
                    {direccion.calle ?? "—"} {direccion.numero ?? "—"}, CP: {direccion.cp ?? "—"}
                    {direccion.provincia && `, ${direccion.provincia}`}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <p>No tenés direcciones registradas.</p>
                <Link to="/cuenta/agregar-direccion" style={{ color: '#1B2A41', textDecoration: 'underline' }}>
                  Agregar dirección
                </Link>
              </div>
            )}
          </div>

          <MercadoPagoButton
            productos={productos}
            envio={envio}
            descuentoCupon={descuentoCupon}
            cuponId={cuponAplicado?.documentId ?? null}
            usuario={usuario}
            direccionId={direccionSeleccionadaId}
            disabled={productos.length === 0 || !direccionSeleccionadaId || !usuario.nombre || !usuario.telefono || direcciones.length === 0}
          />
        </aside>

        {/* Columna Derecha: Resumen de Compra */}
        <main className="compra-resumen">
          <h2>Resumen de Compra</h2>

          {productos.length === 0 && !loading && (
            <p className="compra-sin-stock-aviso" style={{ color: '#c00', marginBottom: '1rem', fontSize: '0.95rem' }}>
              No hay productos con stock para comprar. Los ítems sin stock siguen en tu carrito.
            </p>
          )}
          {productos.map((producto) => {
            return (
              <div key={producto.id ?? producto.documentId} className="compra-producto">
                <NgrokImage src={producto.imageSrc} alt={producto.name} />
                <div className="compra-producto-info">
                  <h3>{producto.name}</h3>
                  <p>Talle: {producto.size}   -   Color: {producto.color}</p>
                  <p>Cantidad: {producto.quantity}</p>
                  {producto.hasDiscount ? (
                    <p style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="compra-precio-original">Precio: {producto.priceOriginal}</span>
                      <span className="compra-precio-final">Precio con descuento: {producto.priceFinal}</span>
                    </p>
                  ) : (
                    <p>Precio: {producto.priceFinal}</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="compra-total">
            <p>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>
            {descuentoCupon > 0 && (
              <p>
                <span>Descuento (cupón):</span>
                <span>-${descuentoCupon.toFixed(2)}</span>
              </p>
            )}
            <p>
              <span>Envío:</span>
              <span>${envio.toFixed(2)}</span>
            </p>
            <p className="compra-total-final">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
