// Tipos TypeScript para el proyecto Mammas Bahía

export interface User {
  id: string;
  email: string;
  // Agregar más campos según el esquema de Supabase
}

export type EstadoSolicitud = "pending" | "approved" | "rejected";

export interface SolicitudMamma {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string | null;
  estado: EstadoSolicitud;
  razon_rechazo: string | null;
  solicitado_at: string | null;
  revisado_at: string | null;
  revisado_por: string | null;
  invite_token_hash?: string | null;
  invite_expires_at?: string | null;
  invite_created_at?: string | null;
  invite_used_at?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: "admin" | "mamma" | "user" | null;
  created_at: string;
  updated_at: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  zona: string | null;
  telefono: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Campos adicionales para links
  sitio_web: string | null;
  facebook: string | null;
  instagram: string | null;
  direccion: string | null;
}

export interface CreateSolicitudData {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje?: string;
}
