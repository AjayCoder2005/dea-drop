import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request, { params }) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_history")
      .select("price, currency, checked_at")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("price-history API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}