const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PROMO_PRODUCTO_ENDPOINT = '/api/promos-productos';

export async function existePromoPorNombre(nombre) {
  const res = await fetch(
    `${BACKEND_URL}/api/promos?filters[nombre][$eq]=${encodeURIComponent(nombre)}&pagination[pageSize]=1`
  );
  if (!res.ok) {
    throw new Error('No se pudo validar el nombre de la promo.');
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

export async function crearPromo(payload) {
  const res = await fetch(`${BACKEND_URL}/api/promos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo crear la promo.');
  }

  return res.json();
}

export async function actualizarPromo(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/promos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar la promo.');
  }

  return res.json();
}

export async function getPromoPorId(id) {
  const res = await fetch(
    `${BACKEND_URL}/api/promos/${id}?populate[0]=promo_productos&populate[1]=promo_productos.producto`
  );
  if (!res.ok) {
    throw new Error('No se pudo obtener la promo.');
  }
  return res.json();
}

export async function getPromoProductos(promoId) {
  const filtro = Number.isNaN(Number(promoId))
    ? `filters[promo][documentId][$eq]=${promoId}`
    : `filters[promo][id][$eq]=${promoId}`;
  const res = await fetch(
    `${BACKEND_URL}${PROMO_PRODUCTO_ENDPOINT}?${filtro}&populate=producto`,
    { headers: { ...getAuthHeaders() } }
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener los productos de la promo.');
  }
  const data = await res.json();
  return data?.data ?? [];
}

export async function eliminarPromoProducto(id) {
  const res = await fetch(`${BACKEND_URL}${PROMO_PRODUCTO_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la relación promo-producto.');
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export async function crearPromoProducto(payload) {
  const res = await fetch(`${BACKEND_URL}${PROMO_PRODUCTO_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo asociar el producto a la promo.');
  }

  return res.json();
}

export async function getPromos(page = 1, pageSize = 10) {
  const res = await fetch(
    `${BACKEND_URL}/api/promos?pagination[page]=${page}&pagination[pageSize]=${pageSize}`
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener las promos.');
  }
  const data = await res.json();
  return {
    items: data?.data ?? [],
    pagination: data?.meta?.pagination ?? { page: 1, pageSize, pageCount: 1, total: 0 }
  };
}

export async function eliminarPromo(id) {
  const res = await fetch(`${BACKEND_URL}/api/promos/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la promo.');
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

/**
 * @returns {Promise<Map<string, number>>} 
 */
export async function obtenerDescuentosActivos() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/promo-productos/activas/productos`)
    
    if (!res.ok) {
      console.error('Error al obtener promo_productos activos:', res.status)
      return new Map()
    }
    
    const data = await res.json()
    const promoProductos = data?.promoProductos ?? data?.data ?? []
    const descuentosMap = new Map()
    
    console.log(`Promo_productos activos encontrados: ${promoProductos.length}`)
    
    promoProductos.forEach((promoProductoItem) => {
      const ppAttrs = promoProductoItem?.attributes ?? promoProductoItem
      
      const promo = ppAttrs?.promo?.data ?? promoProductoItem?.promo?.data ?? ppAttrs?.promo ?? promoProductoItem?.promo
      if (!promo) {
        console.warn('  - Promo no encontrada en promo_producto')
        return
      }
      
      const promoAttrs = promo?.attributes ?? promo
      const descuento = Number(promoAttrs?.descuento ?? 0)
      if (descuento <= 0) return
      
      const producto = ppAttrs?.producto?.data ?? promoProductoItem?.producto?.data ?? ppAttrs?.producto ?? promoProductoItem?.producto
      if (!producto) {
        console.warn('  - Producto no encontrado en promo_producto')
        return
      }
      
      const productoAttrs = producto?.attributes ?? producto
      const productoId = producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id
      if (!productoId) {
        console.warn('  - No se pudo obtener ID del producto')
        return
      }
      
      const key = String(productoId)
      const descuentoActual = descuentosMap.get(key) ?? 0
      if (descuento > descuentoActual) {
        descuentosMap.set(key, descuento)
        console.log(`  ✓ Descuento ${descuento}% aplicado a producto ${key} (${productoAttrs?.nombre ?? 'sin nombre'})`)
      }
    })
    
    console.log('Mapa de descuentos final:', Array.from(descuentosMap.entries()))
    return descuentosMap
  } catch (error) {
    console.error('Error al obtener descuentos activos:', error)
    return new Map()
  }
}
