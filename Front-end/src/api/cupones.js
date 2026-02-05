const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function formatFecha(str) {
  if (!str) return "";
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * @param {string} 
 * @returns {Promise<{ documentId: string, nombre: string, descuento: number, fechaInicio: string, fechaFin: string } | null>}
 */
export async function obtenerCuponPorNombre(nombre) {
  const codigo = (nombre || "").trim();
  if (!codigo) return null;

  const res = await fetch(
    `${BACKEND_URL}/api/cupones?filters[nombre][$eq]=${encodeURIComponent(codigo)}&pagination[pageSize]=1`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("No hay permiso para validar cupones. Revisá en Strapi que el rol tenga permiso 'find' en Cupones.");
    }
    throw new Error("No se pudo validar el cupón.");
  }
  const data = await res.json();
  const item = (data?.data ?? [])[0];
  if (!item) return null;

  const attrs = item?.attributes ?? item;
  const descuento = Number(attrs?.descuento ?? item?.descuento ?? 0);
  return {
    documentId: item.documentId ?? attrs?.documentId ?? item.id,
    nombre: attrs?.nombre ?? item?.nombre ?? codigo,
    descuento,
    fechaInicio: attrs?.fechaInicio ?? item?.fechaInicio ?? null,
    fechaFin: attrs?.fechaFin ?? item?.fechaFin ?? null,
  };
}

/**
 * @param {string} 
 * @param {string} 
 * @returns {Promise<{ documentId: string, nombre: string, descuento: number }>}
 */
export async function validarCuponParaUsuario(nombre, userDocumentId) {
  const codigo = (nombre || "").trim();
  if (!codigo) throw new Error("Ingresá un código de cupón.");
  if (!userDocumentId) throw new Error("Iniciá sesión para usar un cupón.");

  const cupon = await obtenerCuponPorNombre(codigo);
  if (!cupon) throw new Error("Cupón no encontrado.");
  if (cupon.descuento <= 0) throw new Error("El cupón no tiene descuento configurado.");

  const ahora = new Date();
  if (cupon.fechaInicio) {
    const inicio = new Date(cupon.fechaInicio);
    if (inicio > ahora) {
      throw new Error(`El cupón aún no está vigente (válido desde el ${formatFecha(cupon.fechaInicio)}).`);
    }
  }
  if (cupon.fechaFin) {
    const fin = new Date(cupon.fechaFin);
    if (fin < ahora) {
      throw new Error(`El cupón ya no está vigente (venció el ${formatFecha(cupon.fechaFin)}).`);
    }
  }

  const res = await fetch(
    `${BACKEND_URL}/api/cupones-usuarios?filters[cupon][documentId][$eq]=${encodeURIComponent(cupon.documentId)}&filters[users_permissions_user][documentId][$eq]=${encodeURIComponent(userDocumentId)}&pagination[pageSize]=1`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("No se puede validar el cupón. Revisá permisos de Cupones-usuarios en Strapi.");
    }
    throw new Error("No se pudo validar el cupón.");
  }
  const data = await res.json();
  const cu = (data?.data ?? [])[0];
  if (!cu) {
    throw new Error("Este cupón no está asignado a tu cuenta.");
  }
  const usado = cu?.usado ?? cu?.attributes?.usado;
  if (usado) {
    throw new Error("Este cupón ya fue utilizado.");
  }

  return {
    documentId: cupon.documentId,
    nombre: cupon.nombre,
    descuento: cupon.descuento,
  };
}
