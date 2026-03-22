import { supabase } from "./supabase";

// 🔄 GET
export async function fetchTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data;
}

// 💾 UPSERT (évite doublons)
export async function saveTransactions(transactions) {
  const { error } = await supabase.from("transactions").upsert(transactions, {
    onConflict: "id",
  });

  if (error) {
    console.error("Insert error:", error);
  }
}
