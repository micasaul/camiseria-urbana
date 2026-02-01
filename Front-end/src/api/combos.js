import { getImageUrl } from '../utils/url.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
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

const adjuntarResenasCombos = async (items = []) => {
  const combosIds = items
    .map((combo) => combo?.documentId ?? combo?.id)
    .filter(Boolean);

  if (!combosIds.length) {
    return items;
  }

  const params = new URLSearchParams();
  combosIds.forEach((id, index) => {
    params.append(`filters[combo][documentId][$in][${index}]`, id);
  });
  params.append('populate[combo]', 'true');
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
    const resenasPorCombo = new Map();
    const valoracionesPorCombo = new Map();

    resenasRaw.forEach((resena) => {
      const resenaAttrs = resena?.attributes ?? resena;
      const combo = resenaAttrs?.combo?.data ?? resenaAttrs?.combo;
      const comboAttrs = combo?.attributes ?? combo;
      const comboId =
        combo?.documentId ??
        comboAttrs?.documentId ??
        combo?.id ??
        comboAttrs?.id;
      if (!comboId) return;
      
      const resenaNormalizada = normalizarResena(resena);
      const lista = resenasPorCombo.get(comboId) ?? [];
      lista.push(resenaNormalizada);
      resenasPorCombo.set(comboId, lista);
      
      const valoraciones = valoracionesPorCombo.get(comboId) ?? [];
      valoraciones.push(resenaNormalizada.valoracion);
      valoracionesPorCombo.set(comboId, valoraciones);
    });

    return items.map((combo) => {
      const key = String(combo?.documentId ?? combo?.id ?? '');
      const resenas = resenasPorCombo.get(key) ?? [];
      const valoraciones = valoracionesPorCombo.get(key) ?? [];
      return {
        ...combo,
        resenas: resenas,
        valoraciones: valoraciones
      };
    });
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    return items;
  }
};

export async function getCombos(page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'imagen');
    params.append('populate[1]', 'combos-variaciones');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    const res = await fetch(`${BACKEND_URL}/api/combos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al obtener combos');

    const data = await res.json();
    let items = (data.data || []).map(item => {
      const attrs = item?.attributes ?? item;
      
      const variacionesRaw = 
        attrs?.['combos-variaciones']?.data ?? 
        attrs?.['combos-variaciones'] ?? 
        item?.['combos-variaciones']?.data ??
        item?.['combos-variaciones'] ?? 
        [];
      const variaciones = Array.isArray(variacionesRaw) ? variacionesRaw : [];
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        precio: attrs?.precio ?? 0,
        imagen: getImageUrl(attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url) || '/assets/fallback.jpg',
        createdAt: attrs?.createdAt ?? item?.createdAt ?? null,
        publishedAt: attrs?.publishedAt ?? item?.publishedAt ?? null,
        variaciones: variaciones.map(v => {
          const vAttrs = v?.attributes ?? v;
          return {
            id: v.id ?? vAttrs?.id,
            documentId: v.documentId ?? vAttrs?.documentId ?? null,
            talle: vAttrs?.talle ?? v?.talle ?? '',
            stock: Number(vAttrs?.stock ?? v?.stock ?? 0)
          };
        })
      };
    });

    items = await adjuntarResenasCombos(items);

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

export async function getComboPorId(id) {
  try {
    const params = new URLSearchParams();
    params.append('populate[imagen]', 'true');
    params.append('populate[combos-variaciones]', 'true');
    params.append('populate[wishlists]', 'true');

    const res = await fetch(`${BACKEND_URL}/api/combos/${id}?${params.toString()}`);
    if (!res.ok) throw new Error('No se pudo obtener el combo.');

    const data = await res.json();
    const item = data?.data ?? data;
    const attrs = item?.attributes ?? item;
    
    const variacionesRaw = 
      attrs?.['combos-variaciones']?.data ?? 
      attrs?.['combos-variaciones'] ?? 
      item?.['combos-variaciones']?.data ??
      item?.['combos-variaciones'] ?? 
      [];
    const variaciones = Array.isArray(variacionesRaw) ? variacionesRaw : [];
    
    const comboDocumentId = item?.documentId ?? attrs?.documentId ?? item?.id ?? attrs?.id;
    const items = [{
      id: item.id ?? attrs?.id,
      documentId: comboDocumentId,
      nombre: attrs?.nombre ?? '',
      precio: attrs?.precio ?? 0,
      imagen: getImageUrl(attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url) || '/assets/fallback.jpg',
      variaciones: variaciones.map(v => {
        const vAttrs = v?.attributes ?? v;
        return {
          id: v.id ?? vAttrs?.id,
          documentId: v.documentId ?? vAttrs?.documentId ?? null,
          talle: vAttrs?.talle ?? v?.talle ?? '',
          stock: Number(vAttrs?.stock ?? v?.stock ?? 0)
        };
      }),
      wishlists: attrs?.wishlists?.data ?? attrs?.wishlists ?? []
    }];
    
    const itemsConResenas = await adjuntarResenasCombos(items);
    const comboConResenas = itemsConResenas[0] ?? items[0];

    return {
      ...data,
      data: {
        ...comboConResenas,
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null
      }
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function existeComboPorNombre(nombre) {
  const res = await fetch(
    `${BACKEND_URL}/api/combos?filters[nombre][$eq]=${encodeURIComponent(nombre)}&pagination[pageSize]=1`
  );
  if (!res.ok) {
    throw new Error('No se pudo validar el nombre del combo.');
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

export async function crearCombo(payload) {
  const res = await fetch(`${BACKEND_URL}/api/combos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo crear el combo.');
  }

  return res.json();
}

export async function actualizarCombo(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/combos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar el combo.');
  }

  return res.json();
}

export async function crearComboVariacion(payload) {
  const res = await fetch(`${BACKEND_URL}/api/combos-variaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo crear una variación de combo.');
  }

  return res.json();
}

export async function actualizarComboVariacion(id, payload) {
  const res = await fetch(`${BACKEND_URL}/api/combos-variaciones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar una variación de combo.');
  }

  return res.json();
}
