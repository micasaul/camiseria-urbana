import { getImageUrl } from '../utils/url.js';
import { enriquecerVariacionesConImagenFallback } from '../utils/producto.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const urlImagenVariacion = (imagenRaw) => {
  if (!imagenRaw) return null;
  if (typeof imagenRaw === 'string' && imagenRaw.trim()) return getImageUrl(imagenRaw.trim());
  const data = imagenRaw?.data ?? imagenRaw;
  const attrs = data?.attributes ?? data ?? {};
  const url = attrs?.url ?? data?.url ?? imagenRaw?.url ?? attrs?.formats?.thumbnail?.url ?? attrs?.formats?.small?.url;
  if (!url) return null;
  return getImageUrl(url);
};

const normalizarVariacion = (variacion) => {
  const attrs = variacion?.attributes ?? variacion;

  const stockRaw = attrs?.stock ?? variacion?.stock ?? attrs?.cantidad ?? variacion?.cantidad ?? 0;
  const stockNumber = Number(stockRaw);

  const imagenRaw = attrs?.imagen ?? variacion?.imagen;

  return {
    id: variacion?.id ?? attrs?.id,
    documentId: variacion?.documentId ?? attrs?.documentId ?? null,
    color: attrs?.color ?? variacion?.color ?? '',
    talle: attrs?.talle ?? variacion?.talle ?? '',
    stock: Number.isNaN(stockNumber) ? 0 : stockNumber,
    imagen: urlImagenVariacion(imagenRaw)
  };
};

const normalizarVariaciones = (variacionesRaw) => {
  const lista = Array.isArray(variacionesRaw)
    ? variacionesRaw
    : (variacionesRaw?.data ?? []);

  const variaciones = lista.map(normalizarVariacion);
  enriquecerVariacionesConImagenFallback(variaciones);
  return variaciones;
};

export function normalizarMarca(data) {
  const marcaRaw = data?.marca?.data ?? data?.marca ?? data;
  const attrs = marcaRaw?.attributes ?? marcaRaw;

  if (!attrs) return null;

  return {
    id: marcaRaw.id ?? attrs.id,
    documentId: marcaRaw.documentId ?? attrs.documentId,
    nombre: attrs.nombre ?? marcaRaw.nombre ?? ''
  };
}

const normalizarProducto = (item) => {
  const attrs = item?.attributes ?? item;

  const variacionesRaw = attrs?.variaciones ?? attrs?.variacions ?? item?.variaciones ?? [];
  const promoProductosRaw = attrs?.promo_productos?.data ?? attrs?.promo_productos ?? item?.promo_productos ?? [];
  const promoProductos = Array.isArray(promoProductosRaw) ? promoProductosRaw : [];

  return {
    id: item.id ?? attrs?.id,
    documentId: item.documentId ?? attrs?.documentId ?? null,
    nombre: attrs?.nombre ?? item?.nombre ?? '',
    descripcion: attrs?.descripcion ?? item?.descripcion ?? '',
    material: attrs?.material ?? item?.material ?? '',
    precio: Number(attrs?.precio ?? item?.precio ?? 0),
    inactivo: attrs?.inactivo ?? item?.inactivo ?? false,
    promo_productos: promoProductos,
    variaciones: normalizarVariaciones(variacionesRaw),
    marca: normalizarMarca(attrs),
    createdAt: attrs?.createdAt ?? item?.createdAt ?? null,
    publishedAt: attrs?.publishedAt ?? item?.publishedAt ?? null
  };
};

const adjuntarVariaciones = async (items) => {
  return items;
};


export async function getProductosConFiltros(filtros = {}, page = 1, pageSize = 9) {
  try {
    const params = new URLSearchParams();

    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    params.append('filters[$or][0][inactivo][$eq]', 'false');
    params.append('filters[$or][1][inactivo][$null]', 'true');

    if (filtros.material) params.append('filters[material][$eq]', filtros.material);
    if (filtros.precioMin) params.append('filters[precio][$gte]', filtros.precioMin);
    if (filtros.precioMax) params.append('filters[precio][$lte]', filtros.precioMax);
    if (filtros.ordenarPor) params.append('sort', filtros.ordenarPor);

    if (filtros.ids && Array.isArray(filtros.ids) && filtros.ids.length > 0) {
      filtros.ids.forEach((id, index) => {
        params.append(`filters[documentId][$in][${index}]`, String(id));
      });
    }

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Error al obtener productos');

    const body = await res.json();

    let rawItems = [];
    let meta = { page: 1, pageSize, pageCount: 1, total: 0 };

    if (Array.isArray(body)) {
      rawItems = body;
      meta.total = body.length;
    } else if (body?.data) {
      rawItems = Array.isArray(body.data) ? body.data : [];
      if (body.meta?.pagination) meta = body.meta.pagination;
    }

    const items = rawItems.map(normalizarProducto);
    const itemsFinal = await adjuntarVariaciones(items);

    return { items: itemsFinal, pagination: meta };
  } catch (error) {
    console.error('Error en getProductosConFiltros:', error);
    return { items: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } };
  }
}

export async function getProductos(page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams();
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    params.append('filters[$or][0][inactivo][$eq]', 'false');
    params.append('filters[$or][1][inactivo][$null]', 'true');

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener productos');

    const body = await res.json();
    let rawItems = Array.isArray(body) ? body : (body?.data ?? []);
    const items = rawItems.map(normalizarProducto);

    return {
      items,
      pagination: body?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: items.length }
    };
  } catch (error) {
    console.error(error);
    return { items: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } };
  }
}

export async function getProductoPorId(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/productos/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener producto');
    const body = await res.json();
    const itemRaw = body?.data ?? body;

    const producto = normalizarProducto(itemRaw);
    const attrs = itemRaw?.attributes ?? itemRaw;
    return {
      data: {
        ...producto,
        resenas: itemRaw?.resenas ?? attrs?.resenas?.data ?? attrs?.resenas ?? [],
        valoraciones: itemRaw?.valoraciones ?? [],
        wishlists: itemRaw?.wishlists ?? attrs?.wishlists?.data ?? attrs?.wishlists ?? []
      }
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function buscarProductos(query, page = 1, pageSize = 12) {
  try {
    const params = new URLSearchParams();
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    params.append('filters[$or][0][inactivo][$eq]', 'false');
    params.append('filters[$or][1][inactivo][$null]', 'true');

    if (query && query.trim()) {
      params.append('filters[nombre][$containsi]', query.trim());
    }

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al buscar productos');

    const body = await res.json();
    let rawItems = Array.isArray(body) ? body : (body?.data ?? []);
    const items = rawItems.map(normalizarProducto);

    return {
      items,
      pagination: body?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: items.length }
    };
  } catch (error) {
    console.error(error);
    return { items: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } };
  }
}

export async function existeProductoPorNombre(nombre) {
  const res = await fetch(
    `${BACKEND_URL}/api/productos?filters[nombre][$eq]=${encodeURIComponent(nombre)}&pagination[pageSize]=1`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) return null;
  const body = await res.json();
  const rawItems = Array.isArray(body) ? body : (body?.data ?? []);
  const item = rawItems[0];
  if (!item) return null;

  const attrs = item.attributes ?? item;
  return {
    id: item.id ?? attrs.id,
    documentId: item.documentId ?? attrs.documentId
  };
}

export async function crearProducto(payload) {
  const res = await fetch(`${BACKEND_URL}/api/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

export async function actualizarProducto(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar producto');
  return res.json();
}

export async function crearVariacion(payload) {
  const res = await fetch(`${BACKEND_URL}/api/variaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al crear variación');
  return res.json();
}

export async function actualizarVariacion(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/variaciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar variación');
  return res.json();
}

export async function subirImagen(file) {
  const form = new FormData();
  form.append('files', file, file.name);
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];
  return arr[0];
}
