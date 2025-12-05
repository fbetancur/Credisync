import Dexie, { Table } from 'dexie';

// ========================================
// INTERFACES (mismas del schema GraphQL)
// ========================================

export interface Empresa {
  id: string;
  nombre: string;
  nit: string;
  telefono?: string;
  direccion?: string;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Para sincronización
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Usuario {
  id: string;
  empresaId: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol?: 'admin' | 'supervisor' | 'cobrador';
  activo?: boolean;
  rutaAsignadaId?: string;
  metaDiaria?: number;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Ruta {
  id: string;
  empresaId: string;
  nombre: string;
  color?: string;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Cliente {
  id: string;
  empresaId: string;
  rutaId?: string;
  nombre: string;
  documento: string;
  telefono?: string;
  direccion?: string;
  barrio?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  fiadorNombre?: string;
  fiadorTelefono?: string;
  fiadorDireccion?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | 'VETADO';
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface ProductoCredito {
  id: string;
  empresaId: string;
  nombre: string;
  interesPorcentaje: number;
  numeroCuotas: number;
  frecuencia?: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  excluirDomingos?: boolean;
  montoMinimo?: number;
  montoMaximo?: number;
  requiereAprobacion?: boolean;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Credito {
  id: string;
  empresaId: string;
  clienteId: string;
  productoCreditoId: string;
  cobradorId: string;
  montoOriginal: number;
  interesPorcentaje: number;
  totalAPagar: number;
  numeroCuotas: number;
  valorCuota: number;
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
  fechaUltimaCuota: string;
  estado?: 'ACTIVO' | 'CANCELADO' | 'CASTIGADO' | 'RENOVADO';
  saldoPendiente?: number;
  cuotasPagadas?: number;
  cuotasPendientes?: number;
  diasAtraso?: number;
  aprobadoPor?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Cuota {
  id: string;
  empresaId: string;
  creditoId: string;
  clienteId: string;
  rutaId: string;
  numero: number;
  fechaProgramada: string;
  montoProgramado: number;
  estado?: 'PENDIENTE' | 'PAGADA' | 'PARCIAL' | 'ATRASADA';
  montoPagado?: number;
  saldoPendiente?: number;
  fechaPago?: string;
  diasAtraso?: number;
  ordenRuta?: number;
  visitada?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

export interface Pago {
  id: string;
  empresaId: string;
  creditoId: string;
  cuotaId: string;
  clienteId: string;
  cobradorId: string;
  rutaId: string;
  monto: number;
  tipo?: 'CUOTA_NORMAL' | 'PAGO_PARCIAL' | 'ABONO_EXTRA' | 'PAGO_ANTICIPADO';
  fecha: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  sincronizado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _lastSync?: string;
  _pendingSync?: boolean;
}

// Cola de sincronización
export interface SyncQueue {
  id: string;
  empresaId: string;
  usuarioId: string;
  entidad: 'Empresa' | 'Usuario' | 'Ruta' | 'Cliente' | 'ProductoCredito' | 'Credito' | 'Cuota' | 'Pago';
  operacion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidadId: string;
  datosJson: string;
  timestamp: string;
  intentos: number;
  ultimoIntento?: string;
  error?: string;
  sincronizado: boolean;
  sincronizadoAt?: string;
}

// Movimiento de caja
export interface MovimientoCaja {
  id: string;
  tipo: 'ENTRADA' | 'GASTO';
  detalle: string;
  valor: number;
  fecha: string;
}

// Cierre de caja
export interface CierreCaja {
  id: string;
  fecha: string;
  cajaBase: number;
  totalCobrado: number;
  totalCreditos: number;
  totalEntradas: number;
  totalGastos: number;
  totalCaja: number;
  cerrado: boolean;
  movimientos: MovimientoCaja[];
  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// CLASE DEXIE DATABASE
// ========================================

export class CrediSyncDB extends Dexie {
  // Tablas
  empresas!: Table<Empresa, string>;
  usuarios!: Table<Usuario, string>;
  rutas!: Table<Ruta, string>;
  clientes!: Table<Cliente, string>;
  productos!: Table<ProductoCredito, string>;
  creditos!: Table<Credito, string>;
  cuotas!: Table<Cuota, string>;
  pagos!: Table<Pago, string>;
  syncQueue!: Table<SyncQueue, string>;
  cierresCaja!: Table<CierreCaja, string>;

  constructor() {
    super('CrediSyncDB');
    
    this.version(1).stores({
      empresas: 'id, nit, nombre',
      usuarios: 'id, empresaId, email, rol, rutaAsignadaId',
      rutas: 'id, empresaId, activa',
      clientes: 'id, empresaId, rutaId, documento, nombre, estado',
      productos: 'id, empresaId, activo',
      creditos: 'id, empresaId, clienteId, productoCreditoId, cobradorId, estado, fechaDesembolso',
      cuotas: 'id, empresaId, creditoId, clienteId, rutaId, fechaProgramada, estado, numero',
      pagos: 'id, empresaId, creditoId, cuotaId, clienteId, cobradorId, rutaId, fecha, sincronizado',
      syncQueue: 'id, empresaId, usuarioId, entidad, sincronizado, timestamp',
      cierresCaja: 'id, fecha, cerrado',
    });
  }
}

// Instancia única (singleton)
export const db = new CrediSyncDB();

// ========================================
// FUNCIONES HELPER
// ========================================

/**
 * Limpia toda la base de datos local (útil para testing o logout)
 */
export async function clearDatabase() {
  await db.empresas.clear();
  await db.usuarios.clear();
  await db.rutas.clear();
  await db.clientes.clear();
  await db.productos.clear();
  await db.creditos.clear();
  await db.cuotas.clear();
  await db.pagos.clear();
  await db.syncQueue.clear();
  await db.cierresCaja.clear();
}

/**
 * Obtiene estadísticas de la base de datos local
 */
export async function getDatabaseStats() {
  return {
    empresas: await db.empresas.count(),
    usuarios: await db.usuarios.count(),
    rutas: await db.rutas.count(),
    clientes: await db.clientes.count(),
    productos: await db.productos.count(),
    creditos: await db.creditos.count(),
    cuotas: await db.cuotas.count(),
    pagos: await db.pagos.count(),
    cierresCaja: await db.cierresCaja.count(),
    pendientesSync: await db.syncQueue.filter(item => !item.sincronizado).count(),
  };
}