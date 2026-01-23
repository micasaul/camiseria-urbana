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
