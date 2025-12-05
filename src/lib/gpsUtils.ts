/**
 * Utilidades para cálculo de distancias GPS y ordenamiento de rutas
 */

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @returns Distancia en metros
 */
export function calcularDistancia(
  punto1: Coordenadas,
  punto2: Coordenadas
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (punto1.latitud * Math.PI) / 180;
  const φ2 = (punto2.latitud * Math.PI) / 180;
  const Δφ = ((punto2.latitud - punto1.latitud) * Math.PI) / 180;
  const Δλ = ((punto2.longitud - punto1.longitud) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Formatea la distancia para mostrar
 */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)}m`;
  }
  return `${(metros / 1000).toFixed(1)}km`;
}

/**
 * Obtiene la ubicación actual del usuario
 */
export async function obtenerUbicacionActual(): Promise<Coordenadas | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // 30 segundos
        maximumAge: 60000, // Acepta ubicación de hasta 1 minuto
      }
    );
  });
}

/**
 * Ordena una lista de cuotas por distancia desde un punto de origen
 * Usa el algoritmo del vecino más cercano (Greedy Nearest Neighbor)
 */
export function ordenarPorDistancia<T extends { latitud?: number; longitud?: number }>(
  items: T[],
  origen: Coordenadas
): T[] {
  // Filtrar items sin coordenadas
  const itemsConGPS = items.filter(
    (item) => item.latitud !== undefined && item.longitud !== undefined
  );
  const itemsSinGPS = items.filter(
    (item) => item.latitud === undefined || item.longitud === undefined
  );

  if (itemsConGPS.length === 0) {
    return items; // Si no hay GPS, devolver orden original
  }

  const ordenados: T[] = [];
  const pendientes = [...itemsConGPS];
  let puntoActual = origen;

  // Algoritmo del vecino más cercano
  while (pendientes.length > 0) {
    let indiceMasCercano = 0;
    let distanciaMinima = Infinity;

    // Encontrar el punto más cercano al actual
    pendientes.forEach((item, index) => {
      const distancia = calcularDistancia(puntoActual, {
        latitud: item.latitud!,
        longitud: item.longitud!,
      });

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        indiceMasCercano = index;
      }
    });

    // Agregar el más cercano a la ruta
    const masCercano = pendientes.splice(indiceMasCercano, 1)[0];
    ordenados.push(masCercano);

    // Actualizar punto actual
    puntoActual = {
      latitud: masCercano.latitud!,
      longitud: masCercano.longitud!,
    };
  }

  // Agregar items sin GPS al final
  return [...ordenados, ...itemsSinGPS];
}

/**
 * Calcula la distancia total de una ruta
 */
export function calcularDistanciaTotal<T extends { latitud?: number; longitud?: number }>(
  items: T[],
  origen?: Coordenadas
): number {
  let distanciaTotal = 0;
  let puntoActual = origen;

  for (const item of items) {
    if (!item.latitud || !item.longitud) continue;

    if (puntoActual) {
      distanciaTotal += calcularDistancia(puntoActual, {
        latitud: item.latitud,
        longitud: item.longitud,
      });
    }

    puntoActual = {
      latitud: item.latitud,
      longitud: item.longitud,
    };
  }

  return distanciaTotal;
}

/**
 * Calcula el tiempo estimado de recorrido
 * Asume velocidad promedio de 20 km/h en ciudad + 5 min por parada
 */
export function calcularTiempoEstimado(distanciaMetros: number, numeroParadas: number): string {
  const velocidadPromedio = 20; // km/h
  const tiempoPorParada = 5; // minutos

  const tiempoViaje = (distanciaMetros / 1000 / velocidadPromedio) * 60; // minutos
  const tiempoParadas = numeroParadas * tiempoPorParada;
  const tiempoTotal = Math.round(tiempoViaje + tiempoParadas);

  const horas = Math.floor(tiempoTotal / 60);
  const minutos = tiempoTotal % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }
  return `${minutos}min`;
}
