import { getImageUrl } from '../utils/url.js';
import { enriquecerVariacionesConImagenFallback } from '../utils/producto.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const urlImagenVariacion = (imagenRaw) => {
  if (!imagenRaw) {
    console.log('urlImagenVariacion - imagenRaw es null/undefined');
    return null;
  }
  
  console.log('urlImagenVariacion - imagenRaw recibido:', imagenRaw);
  
  const data = imagenRaw?.data ?? imagenRaw;
  const attrs = data?.attributes ?? data ?? {};
  const url = attrs?.url ?? data?.url ?? imagenRaw?.url;
  
  console.log('urlImagenVariacion - Estructura parseada:', { data, attrs, url });
  
  if (!url) {
    console.log('urlImagenVariacion - No se encontró URL:', { imagenRaw, data, attrs });
    return null;
  }
  
  const finalUrl = getImageUrl(url);
  console.log('urlImagenVariacion - URL final:', finalUrl);
  return finalUrl;
};

const normalizarVariacion = (variacion) => {
  const variacionAttrs = variacion?.attributes ?? variacion;
  const stockRaw =
    variacionAttrs?.stock ??
    variacion?.stock ??
    variacionAttrs?.cantidad ??
    variacion?.cantidad ??
    0;
  const stockNumber = Number(stockRaw);
  const imagenRaw = variacionAttrs?.imagen ?? variacion?.imagen;
  const imagenUrl = urlImagenVariacion(imagenRaw);
  
  if (imagenRaw && !imagenUrl) {
    console.log('normalizarVariacion - Imagen raw pero no se pudo parsear:', {
      variacionId: variacion?.id ?? variacionAttrs?.id,
      imagenRaw: imagenRaw
    });
  }
  
  return {
    id: variacion?.id ?? variacionAttrs?.id,
    documentId: variacion?.documentId ?? variacionAttrs?.documentId ?? null,
    color: variacionAttrs?.color ?? variacion?.color ?? '',
    talle: variacionAttrs?.talle ?? variacion?.talle ?? '',
    stock: Number.isNaN(stockNumber) ? 0 : stockNumber,
    imagen: imagenUrl
  };
};

const normalizarVariaciones = (variacionesRaw) => {
  const lista = Array.isArray(variacionesRaw)
    ? variacionesRaw
    : variacionesRaw?.data ?? [];
  const variaciones = lista.map(normalizarVariacion);
  enriquecerVariacionesConImagenFallback(variaciones);
  return variaciones;
};

const normalizarResena = (resena) => {
  const resenaAttrs = resena?.attributes ?? resena;
  const userRaw = resenaAttrs?.users_permissions_user?.data ?? resenaAttrs?.users_permissions_user;
  const userAttrs = userRaw?.attributes ?? userRaw;
  return {
    id: resena?.id ?? resenaAttrs?.id,
    documentId: resena?.documentId ?? resenaAttrs?.documentId ?? null,
    valoracion: Number(resenaAttrs?.valoracion ?? resena?.valoracion ?? 0),
    comentario: resenaAttrs?.comentario ?? resena?.comentario ?? '',
    users_permissions_user: {
      id: userRaw?.id ?? userAttrs?.id,
      documentId: userRaw?.documentId ?? userAttrs?.documentId ?? null,
      username: userAttrs?.username ?? userRaw?.username ?? '',
      email: userAttrs?.email ?? userRaw?.email ?? ''
    }
  };
};

const normalizarResenas = (resenasRaw) => {
  const lista = Array.isArray(resenasRaw)
    ? resenasRaw
    : resenasRaw?.data ?? [];
  return lista.map(normalizarResena);
};

const adjuntarResenas = async (items = []) => {
  const productosIds = items
    .map((producto) => producto?.documentId ?? producto?.id)
    .filter(Boolean);

  if (!productosIds.length) {
    return items;
  }

  const params = new URLSearchParams();
  productosIds.forEach((id, index) => {
    params.append(`filters[producto][documentId][$in][${index}]`, id);
  });
  params.append('populate[producto]', 'true');
  params.append('populate[users_permissions_user]', 'true');
  params.append('pagination[pageSize]', '1000');

  try {
    const res = await fetch(`${BACKEND_URL}/api/resenas?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      console.error('Error al obtener reseñas:', res.status, res.statusText);
      return items;
    }
    const data = await res.json();
    const resenasRaw = data?.data ?? [];
    const resenasPorProducto = new Map();
    const valoracionesPorProducto = new Map();

    resenasRaw.forEach((resena) => {
      const resenaAttrs = resena?.attributes ?? resena;
      const producto = resenaAttrs?.producto?.data ?? resenaAttrs?.producto;
      const productoAttrs = producto?.attributes ?? producto;
      const productoId =
        producto?.documentId ??
        productoAttrs?.documentId ??
        producto?.id ??
        productoAttrs?.id;
      if (!productoId) return;
      
      const resenaNormalizada = normalizarResena(resena);
      const lista = resenasPorProducto.get(productoId) ?? [];
      lista.push(resenaNormalizada);
      resenasPorProducto.set(productoId, lista);
      
      const valoraciones = valoracionesPorProducto.get(productoId) ?? [];
      valoraciones.push(resenaNormalizada.valoracion);
      valoracionesPorProducto.set(productoId, valoraciones);
    });

    return items.map((producto) => {
      const key = String(producto?.documentId ?? producto?.id ?? '');
      const resenas = resenasPorProducto.get(key) ?? [];
      const valoraciones = valoracionesPorProducto.get(key) ?? [];
      return {
        ...producto,
        resenas: resenas,
        valoraciones: valoraciones
      };
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    return items;
  }
};

const adjuntarVariaciones = async (items = []) => {
  const productDocumentIds = items
    .map((producto) => producto?.documentId)
    .filter(Boolean);

  if (!productDocumentIds.length) {
    return items;
  }

  const params = new URLSearchParams();
  productDocumentIds.forEach((documentId, index) => {
    params.append(`filters[producto][documentId][$in][${index}]`, documentId);
  });
  params.append('populate[producto]', 'true');
  params.append('populate', 'imagen');
  params.append('pagination[pageSize]', '1000');

  try {
    const url = `${BACKEND_URL}/api/variaciones?${params.toString()}`;
    console.log('adjuntarVariaciones - URL:', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error('adjuntarVariaciones - Error en fetch:', res.status, res.statusText);
      return items;
    }
    const data = await res.json();
    const variacionesRaw = data?.data ?? [];
    console.log('adjuntarVariaciones - Variaciones recibidas:', variacionesRaw.length);
    
    if (variacionesRaw.length > 0) {
      console.log('adjuntarVariaciones - Primera variación raw:', variacionesRaw[0]);
      const primera = variacionesRaw[0];
      const attrs = primera?.attributes ?? primera;
      console.log('adjuntarVariaciones - Primera variación imagen raw:', attrs?.imagen);
    }
    
    const variacionesPorProducto = new Map();

    variacionesRaw.forEach((variacion) => {
      const variacionAttrs = variacion?.attributes ?? variacion;
      const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto;
      const productoAttrs = producto?.attributes ?? producto;
      const productoId =
        producto?.documentId ??
        productoAttrs?.documentId ??
        producto?.id ??
        productoAttrs?.id;
      if (!productoId) return;
      const key = String(productoId);
      const lista = variacionesPorProducto.get(key) ?? [];
      const variacionNormalizada = normalizarVariacion(variacion);
      console.log('adjuntarVariaciones - Variación normalizada:', {
        id: variacionNormalizada.id,
        color: variacionNormalizada.color,
        talle: variacionNormalizada.talle,
        tieneImagen: !!variacionNormalizada.imagen,
        imagen: variacionNormalizada.imagen
      });
      lista.push(variacionNormalizada);
      variacionesPorProducto.set(key, lista);
    });

    return items.map((producto) => {
      const key = String(producto?.documentId ?? producto?.id ?? '');
      const variacionesNuevas = variacionesPorProducto.get(key);
      const variacionesExistentes = producto?.variaciones ?? [];
      
      let variacionesFinales = variacionesNuevas && variacionesNuevas.length > 0
        ? variacionesNuevas
        : variacionesExistentes;
      enriquecerVariacionesConImagenFallback(variacionesFinales);

      if (variacionesFinales.length > 0) {
        const conImagen = variacionesFinales.filter(v => v?.imagen);
        if (conImagen.length === 0) {
          console.log('adjuntarVariaciones - Producto sin imágenes en variaciones:', {
            productoId: key,
            nombre: producto?.nombre,
            totalVariaciones: variacionesFinales.length,
            variaciones: variacionesFinales.map(v => ({
              id: v?.id,
              color: v?.color,
              talle: v?.talle,
              tieneImagen: !!v?.imagen,
              imagen: v?.imagen
            }))
          });
        }
      }
      
      return {
        ...producto,
        variaciones: variacionesFinales
      };
    });
  } catch (error) {
    console.error('Error al obtener variaciones:', error);
    return items;
  }
};

export async function getProductos(page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'variacions');
    params.append('populate[1]', 'promo_productos');
    params.append('populate[2]', 'promo_productos.promo');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al obtener productos');

    const data = await res.json();
    let items = data.data.map(item => {
      const attrs = item?.attributes ?? item;
      const variacionesRaw =
        attrs?.variaciones?.data ??
        attrs?.variaciones ??
        attrs?.variacions?.data ??
        attrs?.variacions ??
        item?.variaciones ??
        item?.variacions ??
        [];
      const variaciones = Array.isArray(variacionesRaw)
        ? variacionesRaw
        : [];
      const promoProductosRaw = attrs?.promo_productos?.data ?? attrs?.promo_productos ?? item?.promo_productos ?? [];
      const promoProductos = Array.isArray(promoProductosRaw) ? promoProductosRaw : [];
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        inactivo: attrs?.inactivo ?? false,
        promo_productos: promoProductos,
        variaciones: normalizarVariaciones(variaciones),
        createdAt: attrs?.createdAt ?? item?.createdAt ?? null,
        publishedAt: attrs?.publishedAt ?? item?.publishedAt ?? null
      };
    });
    items = await adjuntarVariaciones(items);
    return {
      items,
      pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: items.length }
    };
  } catch (error) {
    console.error(error);
    return {
      items: [],
      pagination: { page: 1, pageSize, pageCount: 1, total: 0 }
    };
  }
}

export async function subirImagen(file) {
  const form = new FormData();
  form.append('files', file, file.name);
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'No se pudo subir la imagen.');
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];
  const first = arr[0];
  if (!first?.id) throw new Error('Respuesta de upload inválida.');
  return first;
}

export async function existeProductoPorNombre(nombre) {
  const res = await fetch(
    `${BACKEND_URL}/api/productos?filters[nombre][$eq]=${encodeURIComponent(nombre)}&pagination[pageSize]=1`
  );
  if (!res.ok) {
    throw new Error('No se pudo validar el nombre del producto.');
  }
  const data = await res.json();
  const item = (data?.data ?? [])[0];
  if (!item) return null;
  const attrs = item?.attributes ?? item;
  return {
    id: item.id ?? attrs?.id,
    documentId: item.documentId ?? attrs?.documentId ?? null,
  };
}

export async function crearProducto(payload) {
  const res = await fetch(`${BACKEND_URL}/api/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo crear el producto.');
  }

  return res.json();
}

export async function crearVariacion(payload) {
  const url = `${BACKEND_URL}/api/variaciones`
  const body = JSON.stringify(payload)
  console.log('[crearVariacion] POST', url, { payload, body })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body
  });

  if (!res.ok) {
    const text = await res.text()
    console.error('[crearVariacion] Error', res.status, text)
    throw new Error('No se pudo crear una variación.');
  }

  const data = await res.json()
  console.log('[crearVariacion] OK', data)
  return data
}

export async function getProductoPorId(id) {
  const res = await fetch(
    `${BACKEND_URL}/api/productos/${id}?populate[0]=variacions&populate[1]=marca&populate[2]=promo_productos&populate[3]=promo_productos.promo&populate[4]=wishlists`
  );
  if (!res.ok) {
    const errorText = await res.text()
    console.error('Error response:', errorText)
    throw new Error('No se pudo obtener el producto.');
  }
  const data = await res.json();
  
  const item = data?.data ?? data;
  const attrs = item?.attributes ?? item;
  
  const variacionesRaw =
    attrs?.variaciones?.data ??
    attrs?.variaciones ??
    attrs?.variacions?.data ??
    attrs?.variacions ??
    item?.variaciones ??
    item?.variacions ??
    [];
  const variaciones = Array.isArray(variacionesRaw) ? variacionesRaw : [];
  const promoProductosRaw = attrs?.promo_productos?.data ?? attrs?.promo_productos ?? item?.promo_productos ?? [];
  const promoProductos = Array.isArray(promoProductosRaw) ? promoProductosRaw : [];
  
  const marcaRaw = attrs?.marca?.data ?? attrs?.marca ?? item?.marca ?? null;
  const marca = marcaRaw ? {
    id: marcaRaw.id ?? marcaRaw.attributes?.id ?? marcaRaw.data?.id ?? null,
    documentId: marcaRaw.documentId ?? marcaRaw.attributes?.documentId ?? marcaRaw.data?.documentId ?? null
  } : null;
  
  const productoNormalizado = {
    id: item.id ?? attrs?.id,
    documentId: item.documentId ?? attrs?.documentId ?? null,
    nombre: attrs?.nombre ?? '',
    descripcion: attrs?.descripcion ?? '',
    material: attrs?.material ?? '',
    precio: attrs?.precio ?? 0,
    promo_productos: promoProductos,
    variaciones: normalizarVariaciones(variaciones),
    marca: marca,
    createdAt: attrs?.createdAt ?? item?.createdAt ?? null,
    publishedAt: attrs?.publishedAt ?? item?.publishedAt ?? null
  };
  
  const items = [productoNormalizado];
  const itemsConVariaciones = await adjuntarVariaciones(items);
  const itemsConResenas = await adjuntarResenas(itemsConVariaciones);
  
  return {
    ...data,
    data: itemsConResenas[0] ?? productoNormalizado
  };
}

export async function actualizarProducto(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/productos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar el producto.');
  }

  return res.json();
}

export async function actualizarVariacion(id, payload) {
  const url = `${BACKEND_URL}/api/variaciones/${id}`
  console.log('[actualizarVariacion] PUT', url, payload)
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text()
    console.error('[actualizarVariacion] Error', res.status, text)
    throw new Error('No se pudo actualizar una variación.');
  }

  const data = await res.json()
  console.log('[actualizarVariacion] OK', data)
  return data
}

export async function getProductosConFiltros(filtros = {}, page = 1, pageSize = 9) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'variacions');
    params.append('populate[1]', 'marca');
    params.append('populate[2]', 'promo_productos');
    params.append('populate[3]', 'promo_productos.promo');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    params.append('filters[$or][0][inactivo][$eq]', 'false');
    params.append('filters[$or][1][inactivo][$null]', 'true');

    if (filtros.material) {
      params.append('filters[material][$eq]', filtros.material);
    }

    if (filtros.precioMin !== undefined && filtros.precioMin !== '') {
      params.append('filters[precio][$gte]', filtros.precioMin);
    }
    if (filtros.precioMax !== undefined && filtros.precioMax !== '') {
      params.append('filters[precio][$lte]', filtros.precioMax);
    }

    // color y talle se filtran client-side (las variaciones vienen populadas)

    if (filtros.ordenarPor) {
      params.append('sort', filtros.ordenarPor);
    }

    if (filtros.ids && Array.isArray(filtros.ids) && filtros.ids.length > 0) {
      filtros.ids.forEach((id, index) => {
        params.append(`filters[documentId][$in][${index}]`, String(id));
      });
    }

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al obtener productos');

    const data = await res.json();
    let items = (data.data || []).map(item => {
      const attrs = item?.attributes ?? item;
      const variacionesRaw =
        attrs?.variaciones?.data ??
        attrs?.variaciones ??
        attrs?.variacions?.data ??
        attrs?.variacions ??
        item?.variaciones ??
        item?.variacions ??
        [];
      const variaciones = Array.isArray(variacionesRaw)
        ? variacionesRaw
        : [];
      const promoProductosRaw = attrs?.promo_productos?.data ?? attrs?.promo_productos ?? item?.promo_productos ?? [];
      const promoProductos = Array.isArray(promoProductosRaw) ? promoProductosRaw : [];
      
      const marcaRaw = attrs?.marca?.data ?? attrs?.marca ?? item?.marca ?? null;
      const marca = marcaRaw ? {
        id: marcaRaw.id ?? marcaRaw.attributes?.id ?? marcaRaw.data?.id ?? null,
        documentId: marcaRaw.documentId ?? marcaRaw.attributes?.documentId ?? marcaRaw.data?.documentId ?? null
      } : null;
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        promo_productos: promoProductos,
        variaciones: normalizarVariaciones(variaciones),
        marca: marca,
        createdAt: attrs?.createdAt ?? item?.createdAt ?? null,
        publishedAt: attrs?.publishedAt ?? item?.publishedAt ?? null
      };
    });
    items = await adjuntarVariaciones(items);
    return {
      items,
      pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: items.length }
    };
  } catch (error) {
    console.error(error);
    return {
      items: [],
      pagination: { page: 1, pageSize, pageCount: 1, total: 0 }
    };
  }
}

export async function buscarProductos(query, page = 1, pageSize = 12) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'variacions');
    params.append('populate[1]', 'promo_productos');
    params.append('populate[2]', 'promo_productos.promo');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    params.append('filters[$or][0][inactivo][$eq]', 'false');
    params.append('filters[$or][1][inactivo][$null]', 'true');

    if (query && query.trim()) {
      params.append('filters[nombre][$containsi]', query.trim());
    }

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al buscar productos');

    const data = await res.json();
    let items = (data.data || []).map(item => {
      const attrs = item?.attributes ?? item;
      const variacionesRaw =
        attrs?.variaciones?.data ??
        attrs?.variaciones ??
        attrs?.variacions?.data ??
        attrs?.variacions ??
        item?.variaciones ??
        item?.variacions ??
        [];
      const variaciones = Array.isArray(variacionesRaw)
        ? variacionesRaw
        : [];
      const promoProductosRaw = attrs?.promo_productos?.data ?? attrs?.promo_productos ?? item?.promo_productos ?? [];
      const promoProductos = Array.isArray(promoProductosRaw) ? promoProductosRaw : [];
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        promo_productos: promoProductos,
        variaciones: normalizarVariaciones(variaciones)
      };
    });
    items = await adjuntarVariaciones(items);
    return {
      items,
      pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: items.length }
    };
  } catch (error) {
    console.error(error);
    return {
      items: [],
      pagination: { page: 1, pageSize, pageCount: 1, total: 0 }
    };
  }
}


