"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Rate a provider (upsert — insert or update existing rating).
 * Only mamás and admins can rate.
 */
export async function rateProvider(
  providerId: string,
  score: number
): Promise<{ success: true } | { success: false; error: string }> {
  if (!providerId) return { success: false, error: "Provider ID requerido" };
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { success: false, error: "La calificación debe ser entre 1 y 5" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mamma" && profile?.role !== "admin") {
    return { success: false, error: "Solo mamás pueden calificar" };
  }

  // Upsert: insert or update if the user already rated this provider
  const { error } = await supabase
    .from("ratings")
    .upsert(
      {
        provider_id: providerId,
        user_id: user.id,
        score,
      },
      { onConflict: "provider_id,user_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete the current user's rating for a provider.
 */
export async function deleteMyRating(
  providerId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("provider_id", providerId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type RatingSummary = {
  avg_rating: number;
  total_ratings: number;
};

/**
 * Get rating summaries (average + count) for a list of provider IDs.
 */
export async function getProviderRatingsSummary(
  providerIds: string[]
): Promise<Record<string, RatingSummary>> {
  if (!providerIds.length) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("provider_id, score")
    .in("provider_id", providerIds);

  if (error || !data) return {};

  // Aggregate in JS (Supabase doesn't support GROUP BY via the client)
  const map: Record<string, { total: number; sum: number }> = {};
  for (const row of data) {
    if (!map[row.provider_id]) {
      map[row.provider_id] = { total: 0, sum: 0 };
    }
    map[row.provider_id].total += 1;
    map[row.provider_id].sum += row.score;
  }

  const result: Record<string, RatingSummary> = {};
  for (const [pid, agg] of Object.entries(map)) {
    result[pid] = {
      avg_rating: Math.round((agg.sum / agg.total) * 10) / 10, // 1 decimal
      total_ratings: agg.total,
    };
  }
  return result;
}

/**
 * Get the current user's ratings for a list of provider IDs.
 * Returns a map of providerId → score.
 */
export async function getMyRatings(
  providerIds: string[]
): Promise<Record<string, number>> {
  if (!providerIds.length) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return {};

  const { data, error } = await supabase
    .from("ratings")
    .select("provider_id, score")
    .eq("user_id", user.id)
    .in("provider_id", providerIds);

  if (error || !data) return {};

  const result: Record<string, number> = {};
  for (const row of data) {
    result[row.provider_id] = row.score;
  }
  return result;
}
