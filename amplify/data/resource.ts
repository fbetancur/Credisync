import { type ClientSchema, a, defineData } from "@aws-amplify/backend";


const schema = a.schema({
  // ========================================
  // 1. EMPRESA (Multi-tenant base)
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
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 2. USUARIO
  // ========================================
  Usuario: a
    .model({
      empresaId: a.id().required(),
      nombre: a.string().required(),
      email: a.string().required(),
      telefono: a.string(),
      rol: a.enum(["admin", "supervisor", "cobrador"]),
      activo: a.boolean(),
      
      // Relación inversa
      empresa: a.belongsTo("Empresa", "empresaId"),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // ========================================
  // 3. CLIENTE
  // ========================================
  Cliente: a
    .model({
      empresaId: a.id().required(),
      nombre: a.string().required(),
      documento: a.string().required(),
      telefono: a.string(),
      direccion: a.string(),
      barrio: a.string(),
      referencia: a.string(),
      
      // Ubicación GPS
      latitud: a.float(),
      longitud: a.float(),
      
      estado: a.enum(["ACTIVO", "INACTIVO", "VETADO"]),
      observaciones: a.string(),
      
      // Relación inversa
      empresa: a.belongsTo("Empresa", "empresaId"),
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