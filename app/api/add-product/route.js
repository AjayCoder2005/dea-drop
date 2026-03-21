import { NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";

// ── Tell Vercel this route can run up to 60 seconds ───────────────────────────
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ── Auth check ────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Scrape with a generous client-side timeout ────────────────────────────
    const scraped = await scrapeProduct(url);

    if (!scraped?.current_price) {
      return NextResponse.json(
        { error: "Could not extract price from this URL. Try a direct product page link." },
        { status: 422 }
      );
    }

    // ── Check for duplicate ───────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You're already tracking this product." },
        { status: 409 }
      );
    }

    // ── Insert product ────────────────────────────────────────────────────────
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id:       user.id,
        user_email:    user.email,
        url,
        name:          scraped.name,
        current_price: parseFloat(scraped.current_price),
        currency:      scraped.currency || "INR",
        image_url:     scraped.image_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    // ── Seed first price history entry ────────────────────────────────────────
    await supabase.from("price_history").insert({
      product_id: product.id,
      price:      parseFloat(scraped.current_price),
      currency:   scraped.currency || "INR",
      checked_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add product" },
      { status: 500 }
    );
  }
}