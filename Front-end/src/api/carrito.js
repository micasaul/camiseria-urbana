const BACKEND_URL = import.meta.env.BACKEND_URL ?? 'http://localhost:1337';

const getAuthHeaders = () => {
  const token = window.localStorage.getItem('strapiToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @returns {Promise<Object|null>}
 */
export async function obtenerCarritoUsuario() {
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
      `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=detalle_carritos`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );
    
    if (!res.ok) {
      throw new Error('No se pudo obtener el carrito.');
    }
    
    const data = await res.json();
    const carritos = data?.data ?? [];
    
    if (carritos.length === 0) {
      return await crearCarrito();
    }
    
    const carrito = carritos[0];
    const carritoAttrs = carrito?.attributes ?? carrito;
    return {
      id: carrito.id ?? carritoAttrs?.id,
      documentId: carrito.documentId ?? carritoAttrs?.documentId ?? carrito.id ?? carritoAttrs?.id
    };
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    throw error;
  }
}

/**
 * @returns {Promise<Object>} 
 */
export async function crearCarrito() {
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
    
    const res = await fetch(`${BACKEND_URL}/api/carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          fecha: new Date().toISOString(),
          users_permissions_user: { connect: [{ documentId: userDocumentId }] }
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo crear el carrito.');
    }

    const data = await res.json();
    const item = data.data ?? data;
    const attrs = item?.attributes ?? item;
    return {
      id: item.id ?? attrs?.id,
      documentId: item.documentId ?? attrs?.documentId ?? item.id ?? attrs?.id
    };
  } catch (error) {
    console.error('Error al crear carrito:', error);
    throw error;
  }
}

/**
 * @returns {Promise<Array>} 
 */
export async function obtenerCarritoCompleto() {
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
      `${BACKEND_URL}/api/carritos?filters[users_permissions_user][documentId][$eq]=${userDocumentId}&populate[0]=detalle_carritos&populate[1]=detalle_carritos.variacion&populate[2]=detalle_carritos.variacion.producto&populate[3]=detalle_carritos.variacion.producto.imagen`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );
    
    if (!res.ok) {
      throw new Error('No se pudo obtener el carrito.');
    }
    
    const data = await res.json();
    const carritos = data?.data ?? [];
    
    if (carritos.length === 0) {
      return []
    }
    
    const carrito = carritos[0];
    const carritoAttrs = carrito?.attributes ?? carrito;
    const detalles = carritoAttrs?.detalle_carritos?.data ?? carritoAttrs?.detalle_carritos ?? [];
    
    return detalles.map((detalle) => {
      const detalleAttrs = detalle?.attributes ?? detalle;
      const variacion = detalleAttrs?.variacion?.data ?? detalleAttrs?.variacion;
      const variacionAttrs = variacion?.attributes ?? variacion;
      const producto = variacionAttrs?.producto?.data ?? variacionAttrs?.producto;
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

      const precioBase = Number(productoAttrs?.precio ?? 0)
      const productoId = producto?.documentId ?? productoAttrs?.documentId ?? producto?.id ?? productoAttrs?.id
      
      return {
        id: detalle.id ?? detalleAttrs?.id,
        documentId: detalle.documentId ?? detalleAttrs?.documentId ?? detalle.id ?? detalleAttrs?.id,
        productoId: productoId ?? null,
        imageSrc: imagenUrl,
        name: productoAttrs?.nombre ?? '',
        size: variacionAttrs?.talle ?? '',
        color: variacionAttrs?.color ?? '',
        priceValue: precioBase,
        price: `$${precioBase.toFixed(2)}`,
        quantity: detalleAttrs?.cantidad ?? 1,
        stock: variacionAttrs?.stock ?? 0
      };
    });
  } catch (error) {
    console.error('Error al obtener carrito completo:', error);
    return [];
  }
}

/**
 * @param {string} 
 * @param {string} 
 * @param {number} 
 * @returns {Promise<Object>} 
 */
export async function agregarAlCarrito(carritoDocumentId, variacionDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: cantidad,
          carrito: carritoDocumentId,
          variacion: variacionDocumentId
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('No se pudo agregar al carrito.');
    }

    return res.json();
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    throw error;
  }
}

/**
 * @param {string}
 * @param {number}
 * @returns {Promise<Object>}
 */
export async function actualizarDetalleCarrito(detalleDocumentId, cantidad) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos/${detalleDocumentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        data: {
          cantidad: cantidad
        }
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      throw new Error('No se pudo actualizar el detalle del carrito.')
    }

    window.dispatchEvent(new CustomEvent('cart:updated'));

    return res.json()
  } catch (error) {
    console.error('Error al actualizar detalle del carrito:', error)
    throw error
  }
}

/**
 * @param {string}
 * @returns {Promise<Object|null>}
 */
export async function eliminarDetalleCarrito(detalleDocumentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/detalles-carritos/${detalleDocumentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      throw new Error('No se pudo eliminar el detalle del carrito.')
    }

    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error('Error al eliminar detalle del carrito:', error)
    throw error
  }
}
