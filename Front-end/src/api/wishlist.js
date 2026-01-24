const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function agregarAWishlist(productoDocumentId) {
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
    const userId = userData.id;
    
    const res = await fetch(`${BACKEND_URL}/api/wishlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          fecha: new Date().toISOString(),
          users_permissions_user: userId,
          producto: { connect: [{ documentId: productoDocumentId }] }
        }
      })
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
    const userId = userData.id;
    
    const res = await fetch(
      `${BACKEND_URL}/api/wishlists?filters[users_permissions_user][id][$eq]=${userId}&populate[0]=producto`,
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
      
      let imagenUrl = '/assets/fallback.jpg'
      if (productoAttrs?.imagen) {
        if (productoAttrs.imagen?.data?.attributes?.url) {
          imagenUrl = productoAttrs.imagen.data.attributes.url
        } else if (productoAttrs.imagen?.url) {
          imagenUrl = productoAttrs.imagen.url
        } else if (typeof productoAttrs.imagen === 'string') {
          imagenUrl = productoAttrs.imagen
        }
      }
      
      if (!imagenUrl.startsWith('http')) {
        imagenUrl = `${BACKEND_URL}${imagenUrl}`
      }
      
      return {
        id: wishlist.id ?? wishlistAttrs?.id,
        documentId: wishlist.documentId ?? wishlistAttrs?.documentId ?? wishlist.id ?? wishlistAttrs?.id,
        productoDocumentId: producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id,
        imageSrc: imagenUrl,
        name: productoAttrs?.nombre ?? '',
        price: `$${Number(productoAttrs?.precio ?? 0).toFixed(2)}`
      };
    });
  } catch (error) {
    console.error('Error al obtener wishlist completa:', error);
    return [];
  }
}

/**
 * @param {string} 
 * @returns {Promise<boolean>} 
 */
export async function estaEnWishlist(productoDocumentId) {
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
    const userId = userData.id;
    
    const res = await fetch(
      `${BACKEND_URL}/api/wishlists?filters[users_permissions_user][id][$eq]=${userId}&filters[producto][documentId][$eq]=${productoDocumentId}`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return (data?.data ?? []).length > 0;
  } catch (error) {
    console.error('Error al verificar wishlist:', error);
    return false;
  }
}
