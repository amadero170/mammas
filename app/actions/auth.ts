"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function login(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Mapear códigos de error de Supabase a mensajes amigables
    let errorMessage = "Error al iniciar sesión";

    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email o contraseña incorrectos";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Por favor confirma tu email primero";
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.log("[AUTH] Login error:", errorMessage);
    return { success: false, error: errorMessage };
  }
  console.log("[AUTH] Login successful, user ID:", data.user.id);
  // Si es exitoso, determinar a dónde redirigir según el rol del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  console.log("[AUTH] Profile query result:", { profile });
  // Retornar la ruta de redirección para que el cliente maneje la redirección
  const redirectPath = profile?.role === "admin" ? "/admin/solicitudes" : "/";
  console.log("[AUTH] Redirect path:", redirectPath);
  return { success: true, redirectTo: redirectPath };
}

// Funciones OAuth preparadas para implementación futura
// Estas funciones usarán signInWithOAuth() de Supabase
// y funcionan con redirects automáticos

/**
 * Login con Google OAuth
 * Requiere configuración en Supabase Dashboard > Authentication > Providers
 *
 * @example
 * const { data } = await loginWithGoogle();
 * if (data?.url) {
 *   redirect(data.url); // Redirige a Google para autenticación
 * }
 */
export async function loginWithGoogle() {
  // TODO: Implementar cuando se configure Google OAuth
  // const supabase = await createClient();
  // const { data, error } = await supabase.auth.signInWithOAuth({
  //   provider: "google",
  //   options: {
  //     redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  //   },
  // });
  // return { success: !error, data, error: error?.message };
}

/**
 * Login con Facebook OAuth
 * Requiere configuración en Supabase Dashboard > Authentication > Providers
 *
 * @example
 * const { data } = await loginWithFacebook();
 * if (data?.url) {
 *   redirect(data.url); // Redirige a Facebook para autenticación
 * }
 */
export async function loginWithFacebook() {
  // TODO: Implementar cuando se configure Facebook OAuth
  // const supabase = await createClient();
  // const { data, error } = await supabase.auth.signInWithOAuth({
  //   provider: "facebook",
  //   options: {
  //     redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  //   },
  // });
  // return { success: !error, data, error: error?.message };
}
