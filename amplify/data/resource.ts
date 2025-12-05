import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // ========================================
  // 1. EMPRESA
  // ========================================
  Empresa: a
    .model({
      nombre: a.string().required(),
      nit: a.string().required(),
      telefono: a.string(),
      direccion: a.string(),
      activa: a.boolean(),
      
      // Relaciones
      usuarios: a.hasMany("Usuario", "empresaId"),
      clientes: a.hasMany("Cliente", "empresaId"),
      rutas: a.hasMany("Ruta", "empresaId"),
      productos: a.hasMany("ProductoCredito", "empresaId"),
      creditos: a.hasMany("Credito", "empresaId"),
      cuotas: a.hasMany("Cuota", "empresaId"),
      pagos: a.hasMany("Pago", "empresaId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 2. RUTA
  // ========================================
  Ruta: a
    .model({
      empresaId: a.id().required(),
      nombre: a.string().required(),
      color: a.string(),
      activa: a.boolean(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      usuarios: a.hasMany("Usuario", "rutaAsignadaId"),
      clientes: a.hasMany("Cliente", "rutaId"),
      cuotas: a.hasMany("Cuota", "rutaId"),
      pagos: a.hasMany("Pago", "rutaId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 3. USUARIO
  // ========================================
  Usuario: a
    .model({
      empresaId: a.id().required(),
      nombre: a.string().required(),
      email: a.string().required(),
      telefono: a.string(),
      rol: a.enum(["admin", "supervisor", "cobrador"]),
      activo: a.boolean(),
      rutaAsignadaId: a.id(),
      metaDiaria: a.float(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      rutaAsignada: a.belongsTo("Ruta", "rutaAsignadaId"),
      creditosDesembolsados: a.hasMany("Credito", "cobradorId"),
      pagosRecibidos: a.hasMany("Pago", "cobradorId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 4. PRODUCTO CREDITO
  // ========================================
  ProductoCredito: a
    .model({
      empresaId: a.id().required(),
      nombre: a.string().required(),
      interesPorcentaje: a.float().required(),
      numeroCuotas: a.integer().required(),
      frecuencia: a.enum(["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"]),
      excluirDomingos: a.boolean(),
      montoMinimo: a.float(),
      montoMaximo: a.float(),
      requiereAprobacion: a.boolean(),
      activo: a.boolean(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      creditos: a.hasMany("Credito", "productoCreditoId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 5. CLIENTE
  // ========================================
  Cliente: a
    .model({
      empresaId: a.id().required(),
      rutaId: a.id(),
      nombre: a.string().required(),
      documento: a.string().required(),
      telefono: a.string(),
      direccion: a.string(),
      barrio: a.string(),
      referencia: a.string(),
      
      // Ubicación GPS
      latitud: a.float(),
      longitud: a.float(),
      
      // Fiador
      fiadorNombre: a.string(),
      fiadorTelefono: a.string(),
      fiadorDireccion: a.string(),
      
      estado: a.enum(["ACTIVO", "INACTIVO", "VETADO"]),
      observaciones: a.string(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      ruta: a.belongsTo("Ruta", "rutaId"),
      creditos: a.hasMany("Credito", "clienteId"),
      cuotas: a.hasMany("Cuota", "clienteId"),
      pagos: a.hasMany("Pago", "clienteId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 6. CREDITO
  // ========================================
  Credito: a
    .model({
      empresaId: a.id().required(),
      clienteId: a.id().required(),
      productoCreditoId: a.id().required(),
      cobradorId: a.id().required(),
      
      montoOriginal: a.float().required(),
      interesPorcentaje: a.float().required(),
      totalAPagar: a.float().required(),
      numeroCuotas: a.integer().required(),
      valorCuota: a.float().required(),
      
      fechaDesembolso: a.date().required(),
      fechaPrimeraCuota: a.date().required(),
      fechaUltimaCuota: a.date().required(),
      
      estado: a.enum(["ACTIVO", "CANCELADO", "CASTIGADO", "RENOVADO"]),
      saldoPendiente: a.float(),
      cuotasPagadas: a.integer(),
      cuotasPendientes: a.integer(),
      diasAtraso: a.integer(),
      
      aprobadoPor: a.id(),
      observaciones: a.string(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
      producto: a.belongsTo("ProductoCredito", "productoCreditoId"),
      cobrador: a.belongsTo("Usuario", "cobradorId"),
      cuotas: a.hasMany("Cuota", "creditoId"),
      pagos: a.hasMany("Pago", "creditoId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 7. CUOTA
  // ========================================
  Cuota: a
    .model({
      empresaId: a.id().required(),
      creditoId: a.id().required(),
      clienteId: a.id().required(),
      rutaId: a.id().required(),
      
      numero: a.integer().required(),
      fechaProgramada: a.date().required(),
      montoProgramado: a.float().required(),
      
      estado: a.enum(["PENDIENTE", "PAGADA", "PARCIAL", "ATRASADA"]),
      montoPagado: a.float(),
      saldoPendiente: a.float(),
      
      fechaPago: a.date(),
      diasAtraso: a.integer(),
      
      ordenRuta: a.integer(),
      visitada: a.boolean(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      credito: a.belongsTo("Credito", "creditoId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
      ruta: a.belongsTo("Ruta", "rutaId"),
      pagos: a.hasMany("Pago", "cuotaId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 8. PAGO
  // ========================================
  Pago: a
    .model({
      empresaId: a.id().required(),
      creditoId: a.id().required(),
      cuotaId: a.id().required(),
      clienteId: a.id().required(),
      cobradorId: a.id().required(),
      rutaId: a.id().required(),
      
      monto: a.float().required(),
      tipo: a.enum(["CUOTA_NORMAL", "PAGO_PARCIAL", "ABONO_EXTRA", "PAGO_ANTICIPADO"]),
      
      fecha: a.datetime().required(),
      latitud: a.float(),
      longitud: a.float(),
      
      observaciones: a.string(),
      sincronizado: a.boolean(),
      
      // Relaciones
      empresa: a.belongsTo("Empresa", "empresaId"),
      credito: a.belongsTo("Credito", "creditoId"),
      cuota: a.belongsTo("Cuota", "cuotaId"),
      cliente: a.belongsTo("Cliente", "clienteId"),
      cobrador: a.belongsTo("Usuario", "cobradorId"),
      ruta: a.belongsTo("Ruta", "rutaId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});