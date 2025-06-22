import { useState, useEffect } from 'react';

/**
 * Hook que retrasa la actualización de un valor hasta que ha pasado un tiempo específico
 * sin que ese valor haya cambiado. Útil para evitar peticiones de API excesivas
 * en campos de búsqueda.
 * @param value El valor a "debouncear".
 * @param delay El tiempo de espera en milisegundos.
 * @returns El valor "debounceado".
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Actualiza el valor debounceado después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpia el temporizador si el valor cambia (por ejemplo, el usuario sigue escribiendo)
    // o si el componente se desmonta.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el delay cambian

  return debouncedValue;
} 