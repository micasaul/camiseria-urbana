import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook para manejar errores y redirigir a la página de error
 */
export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = useCallback((error, message = 'Algo salió mal') => {
    console.error(message, error);
    // Redirigir a la página de error
    navigate('/error', { replace: true });
  }, [navigate]);

  return { handleError };
};
