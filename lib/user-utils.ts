import { createAdminClient } from "@/lib/supabase/admin";
import type { UserDetail } from "@/lib/types";

/**
 * Given an array of user IDs, fetches their details (nombre, email, telefono, role)
 * by checking auth.users, profiles, and mammas_autorizadas tables.
 * Returns a map of userId -> UserDetail.
 */
export async function getUserDetailsMap(
  userIds: string[]
): Promise<Record<string, UserDetail>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const map: Record<string, UserDetail> = {};

  try {
    const adminSupabase = createAdminClient();

    // 1. Fetch auth users
    const { data: authData } = await adminSupabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];

    // 2. Fetch profiles
    const { data: profiles } = await adminSupabase.from("profiles").select("*");

    // 3. Fetch mammas_autorizadas for telephone / name enrichment
    const { data: mammas } = await adminSupabase
      .from("mammas_autorizadas")
      .select("*");

    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const mammasByEmail = new Map(
      (mammas || []).map((m: any) => [m.email?.toLowerCase(), m])
    );

    for (const id of uniqueIds) {
      const authUser = authUsers.find((u) => u.id === id);
      const profile = profilesMap.get(id);

      const email = authUser?.email || profile?.email || "";
      const mamma = email ? mammasByEmail.get(email.toLowerCase()) : null;

      const nombre =
        authUser?.user_metadata?.nombre ||
        profile?.nombre ||
        mamma?.nombre ||
        (email ? email.split("@")[0] : "Usuario");

      const telefono =
        authUser?.user_metadata?.telefono ||
        mamma?.telefono ||
        authUser?.phone ||
        profile?.telefono ||
        null;

      const role = profile?.role || "user";

      map[id] = {
        id,
        nombre,
        email,
        telefono,
        role,
      };
    }
  } catch (error) {
    console.error("Error building user details map:", error);
  }

  return map;
}
