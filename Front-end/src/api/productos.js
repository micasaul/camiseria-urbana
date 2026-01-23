
const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getProductos(page = 1, pageSize = 10) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/productos?populate=variacions&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
    if (!res.ok) throw new Error('Error al obtener productos');

    const data = await res.json();
    const items = data.data.map(item => {
      const attrs = item?.attributes ?? item;
      const variacionesRaw =
        attrs?.variacions?.data ??
        attrs?.variacions ??
        item?.variacions ??
        [];
      const variaciones = Array.isArray(variacionesRaw)
        ? variacionesRaw
        : [];
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
        variaciones: variaciones.map((variacion) => {
          const variacionAttrs = variacion?.attributes ?? variacion;
          return {
            id: variacion.id ?? variacionAttrs?.id,
            documentId: variacion.documentId ?? variacionAttrs?.documentId ?? null,
            color: variacionAttrs?.color ?? '',
            stock: variacionAttrs?.stock ?? 0
          };
        })
      };
    });
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
    `${BACKEND_URL}/api/productos/${id}?populate[0]=variacions&populate[1]=marca`
  );
  if (!res.ok) {
    throw new Error('No se pudo obtener el producto.');
  }
  return res.json();
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
    params.append('populate', 'variacions');
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

    const res = await fetch(`${BACKEND_URL}/api/productos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al obtener productos');

    const data = await res.json();
    const items = (data.data || []).map(item => {
      const attrs = item?.attributes ?? item;
      const variacionesRaw =
        attrs?.variacions?.data ??
        attrs?.variacions ??
        item?.variacions ??
        [];
      const variaciones = Array.isArray(variacionesRaw)
        ? variacionesRaw
        : [];
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        material: attrs?.material ?? '',
        precio: attrs?.precio ?? 0,
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
        variaciones: variaciones.map((variacion) => {
          const variacionAttrs = variacion?.attributes ?? variacion;
          return {
            id: variacion.id ?? variacionAttrs?.id,
            documentId: variacion.documentId ?? variacionAttrs?.documentId ?? null,
            color: variacionAttrs?.color ?? '',
            talle: variacionAttrs?.talle ?? '',
            stock: variacionAttrs?.stock ?? 0
          };
        })
      };
    });
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


