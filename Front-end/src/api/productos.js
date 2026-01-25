
const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  return {
    id: variacion?.id ?? variacionAttrs?.id,
    documentId: variacion?.documentId ?? variacionAttrs?.documentId ?? null,
    color: variacionAttrs?.color ?? variacion?.color ?? '',
    talle: variacionAttrs?.talle ?? variacion?.talle ?? '',
    stock: Number.isNaN(stockNumber) ? 0 : stockNumber
  };
};

const normalizarVariaciones = (variacionesRaw) => {
  const lista = Array.isArray(variacionesRaw)
    ? variacionesRaw
    : variacionesRaw?.data ?? [];
  return lista.map(normalizarVariacion);
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
  params.append('pagination[pageSize]', '1000');

  try {
    const res = await fetch(`${BACKEND_URL}/api/variaciones?${params.toString()}`);
    if (!res.ok) {
      return items;
    }
    const data = await res.json();
    const variacionesRaw = data?.data ?? [];
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
      const lista = variacionesPorProducto.get(productoId) ?? [];
      lista.push(normalizarVariacion(variacion));
      variacionesPorProducto.set(productoId, lista);
    });

    return items.map((producto) => {
      const key = String(producto?.documentId ?? producto?.id ?? '');
      return {
        ...producto,
        variaciones: variacionesPorProducto.get(key) ?? producto?.variaciones ?? []
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
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
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
  const res = await fetch(`${BACKEND_URL}/api/variaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo crear una variación.');
  }

  return res.json();
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
  const items = [item];
  const itemsConResenas = await adjuntarResenas(items);
  
  return {
    ...data,
    data: itemsConResenas[0] ?? item
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
  const res = await fetch(`${BACKEND_URL}/api/variaciones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar una variación.');
  }

  return res.json();
}

export async function getProductosConFiltros(filtros = {}, page = 1, pageSize = 9) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'variacions');
    params.append('populate[1]', 'promo_productos');
    params.append('populate[2]', 'promo_productos.promo');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    if (filtros.material) {
      params.append('filters[material][$eq]', filtros.material);
    }

    if (filtros.precioMin !== undefined && filtros.precioMin !== '') {
      params.append('filters[precio][$gte]', filtros.precioMin);
    }
    if (filtros.precioMax !== undefined && filtros.precioMax !== '') {
      params.append('filters[precio][$lte]', filtros.precioMax);
    }

    if (filtros.colores && filtros.colores.length > 0) {
      filtros.colores.forEach((color, index) => {
        params.append(`filters[variacions][color][$in][${index}]`, color);
      });
    }

    if (filtros.talles && filtros.talles.length > 0) {
      filtros.talles.forEach((talle, index) => {
        params.append(`filters[variacions][talle][$in][${index}]`, talle);
      });
    }

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
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
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

export async function buscarProductos(query, page = 1, pageSize = 12) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'variacions');
    params.append('populate[1]', 'promo_productos');
    params.append('populate[2]', 'promo_productos.promo');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);
    
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
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
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


