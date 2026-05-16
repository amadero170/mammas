export const EVENT_CATEGORIAS = [
  "Taller",
  "Ceremonia",
  "Curso",
  "Fiesta",
  "Charla",
  "Actividad al aire libre",
  "Mercado / Bazar",
  "Otro",
] as const;

// Reusar las mismas zonas de proveedores
export { PROVIDER_ZONAS as EVENT_ZONAS } from "./providers";
