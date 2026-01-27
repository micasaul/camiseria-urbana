const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getCombos(page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams();
    params.append('populate[0]', 'imagen');
    params.append('pagination[page]', page);
    params.append('pagination[pageSize]', pageSize);

    const res = await fetch(`${BACKEND_URL}/api/combos?${params.toString()}`);
    if (!res.ok) throw new Error('Error al obtener combos');

    const data = await res.json();
    const items = (data.data || []).map(item => {
      const attrs = item?.attributes ?? item;
      
      return {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        precio: attrs?.precio ?? 0,
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg'
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

export async function getComboPorId(id) {
  try {
    const params = new URLSearchParams();
    params.append('populate[imagen]', 'true');
    params.append('populate[combos-variaciones]', 'true');
    params.append('populate[wishlists]', 'true');
    params.append('populate[resenas][populate][0]', 'users_permissions_user');

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
    
    const resenasRaw = attrs?.resenas?.data ?? attrs?.resenas ?? item?.resenas ?? [];
    const resenas = Array.isArray(resenasRaw) ? resenasRaw : [];

    return {
      ...data,
      data: {
        id: item.id ?? attrs?.id,
        documentId: item.documentId ?? attrs?.documentId ?? null,
        nombre: attrs?.nombre ?? '',
        precio: attrs?.precio ?? 0,
        imagen: attrs?.imagen?.data?.attributes?.url || attrs?.imagen?.url || '/assets/fallback.jpg',
        variaciones: variaciones.map(v => {
          const vAttrs = v?.attributes ?? v;
          return {
            id: v.id ?? vAttrs?.id,
            documentId: v.documentId ?? vAttrs?.documentId ?? null,
            talle: vAttrs?.talle ?? v?.talle ?? '',
            stock: Number(vAttrs?.stock ?? v?.stock ?? 0)
          };
        }),
        wishlists: attrs?.wishlists?.data ?? attrs?.wishlists ?? [],
        resenas: resenas,
        valoraciones: resenas.map(r => {
          const rAttrs = r?.attributes ?? r;
          return Number(rAttrs?.valoracion ?? r?.valoracion ?? 0);
        })
      }
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
