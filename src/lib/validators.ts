/**
 * Sistema de validaciones robusto para prevenir errores
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validaciones para clientes
 */
export const validarCliente = (datos: any): void => {
  if (!datos.nombre || datos.nombre.trim().length < 3) {
    throw new ValidationError('El nombre debe tener al menos 3 caracteres');
  }

  if (!datos.documento || datos.documento.trim().length < 5) {
    throw new ValidationError('El documento debe tener al menos 5 caracteres');
  }

  if (datos.telefono && !/^\d{7,15}$/.test(datos.telefono.replace(/[\s\-\(\)]/g, ''))) {
    throw new ValidationError('El teléfono debe tener entre 7 y 15 dígitos');
  }

  if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
    throw new ValidationError('El email no es válido');
  }

  if (!datos.latitud || !datos.longitud) {
    throw new ValidationError('Debes capturar la ubicación GPS del cliente');
  }

  if (Math.abs(datos.latitud) > 90 || Math.abs(datos.longitud) > 180) {
    throw new ValidationError('Las coordenadas GPS no son válidas');
  }
};

/**
 * Validaciones para productos de crédito
 */
export const validarProductoCredito = (datos: any): void => {
  if (!datos.nombre || datos.nombre.trim().length < 3) {
    throw new ValidationError('El nombre debe tener al menos 3 caracteres');
  }

  if (datos.interesPorcentaje === undefined || datos.interesPorcentaje < 0 || datos.interesPorcentaje > 100) {
    throw new ValidationError('El interés debe estar entre 0% y 100%');
  }

  if (!datos.numeroCuotas || datos.numeroCuotas < 1 || datos.numeroCuotas > 365) {
    throw new ValidationError('El número de cuotas debe estar entre 1 y 365');
  }

  if (!['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'].includes(datos.frecuencia)) {
    throw new ValidationError('Frecuencia no válida');
  }

  if (datos.montoMinimo && datos.montoMaximo && datos.montoMinimo > datos.montoMaximo) {
    throw new ValidationError('El monto mínimo no puede ser mayor al máximo');
  }

  if (datos.montoMinimo && datos.montoMinimo < 0) {
    throw new ValidationError('El monto mínimo no puede ser negativo');
  }
};

/**
 * Validaciones para créditos
 */
export const validarCredito = (datos: any): void => {
  if (!datos.clienteId) {
    throw new ValidationError('Debes seleccionar un cliente');
  }

  if (!datos.productoCreditoId) {
    throw new ValidationError('Debes seleccionar un producto de crédito');
  }

  if (!datos.montoOriginal || datos.montoOriginal <= 0) {
    throw new ValidationError('El monto debe ser mayor a 0');
  }

  if (datos.montoOriginal > 100000000) {
    throw new ValidationError('El monto es demasiado alto (máximo: $100,000,000)');
  }

  if (!datos.fechaDesembolso) {
    throw new ValidationError('Debes especificar la fecha de desembolso');
  }

  const fechaDesembolso = new Date(datos.fechaDesembolso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaDesembolso < hoy) {
    throw new ValidationError('La fecha de desembolso no puede ser anterior a hoy');
  }

  const unAñoAdelante = new Date();
  unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);

  if (fechaDesembolso > unAñoAdelante) {
    throw new ValidationError('La fecha de desembolso no puede ser mayor a un año');
  }
};

/**
 * Validaciones para pagos
 */
export const validarPago = (datos: any, cuota: any): void => {
  if (!datos.monto || datos.monto <= 0) {
    throw new ValidationError('El monto debe ser mayor a 0');
  }

  const saldoPendiente = cuota.saldoPendiente || cuota.montoProgramado;
  
  if (datos.monto > saldoPendiente * 1.5) {
    throw new ValidationError(
      `El monto es muy alto. Saldo pendiente: $${saldoPendiente.toLocaleString()}`
    );
  }

  if (datos.monto > 100000000) {
    throw new ValidationError('El monto es demasiado alto (máximo: $100,000,000)');
  }

  if (!datos.creditoId || !datos.cuotaId || !datos.clienteId) {
    throw new ValidationError('Datos incompletos del pago');
  }
};

/**
 * Validaciones para rutas
 */
export const validarRuta = (datos: any): void => {
  if (!datos.nombre || datos.nombre.trim().length < 3) {
    throw new ValidationError('El nombre debe tener al menos 3 caracteres');
  }

  if (datos.color && !/^#[0-9A-F]{6}$/i.test(datos.color)) {
    throw new ValidationError('El color debe ser un código hexadecimal válido');
  }
};

/**
 * Sanitiza strings para prevenir inyecciones
 */
export const sanitizarString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .substring(0, 500); // Limitar longitud
};

/**
 * Valida y sanitiza números
 */
export const sanitizarNumero = (num: any, min: number = 0, max: number = Infinity): number => {
  const parsed = parseFloat(num);
  
  if (isNaN(parsed)) {
    throw new ValidationError('Valor numérico inválido');
  }

  if (parsed < min || parsed > max) {
    throw new ValidationError(`El valor debe estar entre ${min} y ${max}`);
  }

  return parsed;
};

/**
 * Valida formato de fecha
 */
export const validarFecha = (fecha: string): Date => {
  const parsed = new Date(fecha);
  
  if (isNaN(parsed.getTime())) {
    throw new ValidationError('Fecha inválida');
  }

  return parsed;
};
