import { addDays, isSunday, isSaturday, format } from 'date-fns';

/**
 * Utilidades para manejo de calendario y días hábiles
 */

// Días festivos de Colombia (puedes personalizarlo por país/región)
const DIAS_FESTIVOS_2024 = [
  '2024-01-01', // Año Nuevo
  '2024-01-08', // Reyes Magos
  '2024-03-25', // San José
  '2024-03-28', // Jueves Santo
  '2024-03-29', // Viernes Santo
  '2024-05-01', // Día del Trabajo
  '2024-05-13', // Ascensión
  '2024-06-03', // Corpus Christi
  '2024-06-10', // Sagrado Corazón
  '2024-07-01', // San Pedro y San Pablo
  '2024-07-20', // Independencia
  '2024-08-07', // Batalla de Boyacá
  '2024-08-19', // Asunción
  '2024-10-14', // Día de la Raza
  '2024-11-04', // Todos los Santos
  '2024-11-11', // Independencia de Cartagena
  '2024-12-08', // Inmaculada Concepción
  '2024-12-25', // Navidad
];

const DIAS_FESTIVOS_2025 = [
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes Magos
  '2025-03-24', // San José
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajo
  '2025-06-02', // Ascensión
  '2025-06-23', // Corpus Christi
  '2025-06-30', // Sagrado Corazón
  '2025-07-07', // San Pedro y San Pablo (trasladado)
  '2025-07-20', // Independencia
  '2025-08-07', // Batalla de Boyacá
  '2025-08-18', // Asunción (trasladado)
  '2025-10-13', // Día de la Raza (trasladado)
  '2025-11-03', // Todos los Santos (trasladado)
  '2025-11-17', // Independencia de Cartagena (trasladado)
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad
];

const TODOS_FESTIVOS = [...DIAS_FESTIVOS_2024, ...DIAS_FESTIVOS_2025];

/**
 * Verifica si una fecha es día festivo
 */
export const esDiaFestivo = (fecha: Date): boolean => {
  const fechaStr = format(fecha, 'yyyy-MM-dd');
  return TODOS_FESTIVOS.includes(fechaStr);
};

/**
 * Verifica si una fecha es día hábil
 */
export const esDiaHabil = (fecha: Date, excluirDomingos: boolean = true, excluirSabados: boolean = false): boolean => {
  if (excluirDomingos && isSunday(fecha)) return false;
  if (excluirSabados && isSaturday(fecha)) return false;
  if (esDiaFestivo(fecha)) return false;
  return true;
};

/**
 * Obtiene el siguiente día hábil
 */
export const siguienteDiaHabil = (
  fecha: Date,
  excluirDomingos: boolean = true,
  excluirSabados: boolean = false,
  excluirFestivos: boolean = true
): Date => {
  let siguiente = addDays(fecha, 1);
  
  while (true) {
    if (excluirDomingos && isSunday(siguiente)) {
      siguiente = addDays(siguiente, 1);
      continue;
    }
    
    if (excluirSabados && isSaturday(siguiente)) {
      siguiente = addDays(siguiente, 1);
      continue;
    }
    
    if (excluirFestivos && esDiaFestivo(siguiente)) {
      siguiente = addDays(siguiente, 1);
      continue;
    }
    
    break;
  }
  
  return siguiente;
};

/**
 * Calcula fechas de cuotas considerando días hábiles
 */
export const calcularFechasCuotas = (
  fechaInicio: Date,
  numeroCuotas: number,
  frecuencia: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
  opciones: {
    excluirDomingos?: boolean;
    excluirSabados?: boolean;
    excluirFestivos?: boolean;
  } = {}
): Date[] => {
  const {
    excluirDomingos = true,
    excluirSabados = false,
    excluirFestivos = true,
  } = opciones;

  const fechas: Date[] = [];
  let fechaActual = new Date(fechaInicio);

  for (let i = 0; i < numeroCuotas; i++) {
    // Calcular siguiente fecha según frecuencia
    switch (frecuencia) {
      case 'DIARIO':
        fechaActual = siguienteDiaHabil(fechaActual, excluirDomingos, excluirSabados, excluirFestivos);
        break;

      case 'SEMANAL':
        fechaActual = addDays(fechaActual, 7);
        // Ajustar si cae en día no hábil
        if (!esDiaHabil(fechaActual, excluirDomingos, excluirSabados) && excluirFestivos) {
          fechaActual = siguienteDiaHabil(fechaActual, excluirDomingos, excluirSabados, excluirFestivos);
        }
        break;

      case 'QUINCENAL':
        fechaActual = addDays(fechaActual, 15);
        // Ajustar si cae en día no hábil
        if (!esDiaHabil(fechaActual, excluirDomingos, excluirSabados) && excluirFestivos) {
          fechaActual = siguienteDiaHabil(fechaActual, excluirDomingos, excluirSabados, excluirFestivos);
        }
        break;

      case 'MENSUAL':
        fechaActual = addDays(fechaActual, 30);
        // Ajustar si cae en día no hábil
        if (!esDiaHabil(fechaActual, excluirDomingos, excluirSabados) && excluirFestivos) {
          fechaActual = siguienteDiaHabil(fechaActual, excluirDomingos, excluirSabados, excluirFestivos);
        }
        break;
    }

    fechas.push(new Date(fechaActual));
  }

  return fechas;
};

/**
 * Calcula días de atraso considerando solo días hábiles
 */
export const calcularDiasAtraso = (
  fechaProgramada: Date,
  fechaActual: Date = new Date(),
  soloHabiles: boolean = false
): number => {
  if (fechaActual <= fechaProgramada) {
    return 0;
  }

  if (!soloHabiles) {
    // Cálculo simple de días calendario
    return Math.floor((fechaActual.getTime() - fechaProgramada.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Contar solo días hábiles
  let dias = 0;
  let fecha = new Date(fechaProgramada);
  fecha.setHours(0, 0, 0, 0);
  
  const actual = new Date(fechaActual);
  actual.setHours(0, 0, 0, 0);

  while (fecha < actual) {
    fecha = addDays(fecha, 1);
    if (esDiaHabil(fecha)) {
      dias++;
    }
  }

  return dias;
};

/**
 * Obtiene información del día
 */
export const obtenerInfoDia = (fecha: Date): {
  esDomingo: boolean;
  esSabado: boolean;
  esFestivo: boolean;
  esHabil: boolean;
  nombreFestivo?: string;
} => {
  const esDomingo = isSunday(fecha);
  const esSabado = isSaturday(fecha);
  const esFestivo = esDiaFestivo(fecha);
  const esHabil = esDiaHabil(fecha);

  return {
    esDomingo,
    esSabado,
    esFestivo,
    esHabil,
    nombreFestivo: esFestivo ? 'Día festivo' : undefined,
  };
};
