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

/**
 * Obtiene un cupón por documentId o id.
 * @param {string} id - documentId o id del cupón
 * @returns {Promise<{ documentId, nombre, descuento, fechaInicio, fechaFin, ... }>}
 */
export async function getCuponPorId(id) {
  const res = await fetch(`${BACKEND_URL}/api/cupones/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('No tenés permiso para ver este cupón.');
    if (res.status === 404) throw new Error('Cupón no encontrado.');
    throw new Error('No se pudo obtener el cupón.');
  }
  const data = await res.json();
  const item = data?.data ?? data;
  const attrs = item?.attributes ?? item;
  return {
    documentId: item?.documentId ?? attrs?.documentId ?? item?.id,
    id: item?.id ?? attrs?.id,
    nombre: attrs?.nombre ?? item?.nombre ?? '',
    descuento: attrs?.descuento ?? item?.descuento ?? 0,
    fechaInicio: attrs?.fechaInicio ?? item?.fechaInicio ?? '',
    fechaFin: attrs?.fechaFin ?? item?.fechaFin ?? '',
  };
}

/**
 * Actualiza un cupón por documentId o id.
 * @param {string} id - documentId o id del cupón
 * @param {{ nombre: string, descuento: number, fechaInicio: string, fechaFin: string }} data
 */
export async function actualizarCupon(id, data) {
  const res = await fetch(`${BACKEND_URL}/api/cupones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      data: {
        nombre: data.nombre?.trim() ?? '',
        descuento: data.descuento,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'No se pudo actualizar el cupón.');
  }
  return res.json();
}

/**
 * Lista cupones con paginación.
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<{ items: any[], pagination: { page, pageSize, pageCount, total } }>}
 */
export async function getCupones(page = 1, pageSize = 10) {
  const res = await fetch(
    `${BACKEND_URL}/api/cupones?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('No se pudieron obtener los cupones.');
  const data = await res.json();
  return {
    items: data?.data ?? [],
    pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: 0 },
  };
}

/**
 * Elimina un cupón por documentId o id.
 * @param {string} id - documentId o id del cupón
 */
export async function eliminarCupon(id) {
  const res = await fetch(`${BACKEND_URL}/api/cupones/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('No se pudo eliminar el cupón.');
  if (res.status === 204) return null;
  return res.json();
}

/**
 * @param {{ nombre: string, descuento: number, fechaInicio: string, fechaFin: string }} 
 * @returns {Promise<{ cupon: object, cuponesUsuariosCreados: number }>}
 */
export async function crearCuponConUsuarios(data) {
  const res = await fetch(`${BACKEND_URL}/api/cupones/crear-con-usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      data: {
        nombre: data.nombre?.trim() ?? '',
        descuento: data.descuento,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'No se pudo crear el cupón.');
  }
  return res.json();
}
