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
  user_id: string;
  role: "admin" | "user" | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSolicitudData {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje?: string;
}
