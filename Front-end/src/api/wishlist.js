const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function agregarAWishlist(productoDocumentId, comboDocumentId = null) {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      throw new Error('No se pudo obtener el usuario.');
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData.documentId;
    
    const body = {
      data: {
        users_permissions_user: userDocumentId
      }
    };
    
    if (productoDocumentId) {
      body.data.producto = productoDocumentId;
    }
    if (comboDocumentId) {
      body.data.combo = comboDocumentId;
    }
    
    const res = await fetch(`${BACKEND_URL}/api/wishlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo agregar a la wishlist.');
    }

    return res.json();
  } catch (error) {
    console.error('Error al agregar a wishlist:', error);
    throw error;
  }
}

export async function eliminarDeWishlist(wishlistDocumentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wishlists/${wishlistDocumentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      throw new Error('No se pudo eliminar de la wishlist.')
    }

    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error('Error al eliminar de wishlist:', error)
    throw error
  }
}

/**
 * @returns {Promise<Array>} 
 */
export async function obtenerWishlistCompleta() {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      throw new Error('No se pudo obtener el usuario.');
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData.documentId;
    
    const res = await fetch(
      `${BACKEND_URL}/api/wishlists?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=producto&populate[1]=producto.imagen&populate[2]=combo&populate[3]=combo.imagen`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );

    if (!res.ok) {
      throw new Error('No se pudo obtener la wishlist.');
    }

    const data = await res.json();
    const wishlists = data?.data ?? [];
    
    return wishlists.map((wishlist) => {
      const wishlistAttrs = wishlist?.attributes ?? wishlist;
      const producto = wishlistAttrs?.producto?.data ?? wishlistAttrs?.producto;
      const productoAttrs = producto?.attributes ?? producto;
      const combo = wishlistAttrs?.combo?.data ?? wishlistAttrs?.combo;
      const comboAttrs = combo?.attributes ?? combo;
      
      // Determinar si es producto o combo
      const esCombo = !!combo;
      const item = esCombo ? comboAttrs : productoAttrs;
      
      let imagenUrl = '/assets/fallback.jpg'
      if (item?.imagen) {
        if (item.imagen?.data?.attributes?.url) {
          imagenUrl = item.imagen.data.attributes.url
        } else if (item.imagen?.url) {
          imagenUrl = item.imagen.url
        } else if (typeof item.imagen === 'string') {
          imagenUrl = item.imagen
        }
      }
      
      if (!imagenUrl.startsWith('http')) {
        imagenUrl = `${BACKEND_URL}${imagenUrl}`
      }
      
      const precioBase = Number(item?.precio ?? 0)
      const itemId = esCombo 
        ? (combo?.documentId ?? comboAttrs?.documentId ?? combo?.id ?? comboAttrs?.id)
        : (producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id)

      return {
        id: wishlist.id ?? wishlistAttrs?.id,
        documentId: wishlist.documentId ?? wishlistAttrs?.documentId ?? wishlist.id ?? wishlistAttrs?.id,
        productoDocumentId: esCombo ? null : (itemId ?? null),
        productoId: esCombo ? null : (itemId ?? null),
        comboDocumentId: esCombo ? (itemId ?? null) : null,
        comboId: esCombo ? (itemId ?? null) : null,
        imageSrc: imagenUrl,
        name: item?.nombre ?? '',
        priceValue: precioBase,
        price: `$${precioBase.toFixed(2)}`
      };
    });
  } catch (error) {
    console.error('Error al obtener wishlist completa:', error);
    return [];
  }
}

/**
 * @param {string} 
 * @param {string} 
 * @returns {Promise<string|false>} 
 */
export async function estaEnWishlist(productoDocumentId, comboDocumentId = null) {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    if (!userRes.ok) {
      return false;
    }
    
    const userData = await userRes.json();
    const userDocumentId = userData.documentId;
    
    let url = `${BACKEND_URL}/api/wishlists?filters[users_permissions_user][documentId][$eq]=${userDocumentId}`;
    if (productoDocumentId) {
      url += `&filters[producto][documentId][$eq]=${productoDocumentId}`;
    }
    if (comboDocumentId) {
      url += `&filters[combo][documentId][$eq]=${comboDocumentId}`;
    }
    
    const res = await fetch(url, {
      headers: {
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    const items = data?.data ?? []
    if (items.length === 0) return false
    const wishlist = items[0]
    const attrs = wishlist?.attributes ?? wishlist
    return wishlist?.documentId ?? attrs?.documentId ?? wishlist?.id ?? attrs?.id ?? false
  } catch (error) {
    console.error('Error al verificar wishlist:', error);
    return false;
  }
}
