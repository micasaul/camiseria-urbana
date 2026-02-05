const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Busca un cupón por nombre (código). Compatible con Strapi 5 (respuesta plana) y Strapi 4 (data.attributes).
 * @param {string} nombre - Código del cupón (cupon.nombre)
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

  // Strapi 5: atributos en el documento; Strapi 4: en item.attributes
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
