import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert, sendTargetPriceAlert } from "@/lib/email";

export async function POST(request) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Service role client (bypasses RLS) ────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ── Fetch all tracked products ────────────────────────────────────────
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) {
      console.error("Products fetch error:", productsError);
      throw productsError;
    }

    console.log(`🔍 Checking prices for ${products?.length || 0} products`);

    const results = {
      total:        products?.length || 0,
      updated:      0,
      skipped:      0,
      failed:       0,
      priceChanges: 0,
      alertsSent:   0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);
    
        // ✅ FIXED - use correct field names from firecrawl.js
        if (!productData.current_price) {
          results.failed++;
          continue;
        }
    
        const newPrice = parseFloat(productData.current_price);  // ✅ was currentPrice
        const oldPrice = parseFloat(product.current_price);
    
        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currency || product.currency,        // ✅ was currencyCode
            name: productData.name || product.name,                    // ✅ was productName
            image_url: productData.image_url || product.image_url,     // ✅ was productImageUrl
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        // ── Always record price history ─────────────────────────────────
        await supabase.from("price_history").insert({
          product_id: product.id,
          price:      newPrice,
          currency,
          checked_at: new Date().toISOString(),
        });

        if (newPrice !== oldPrice) {
          results.priceChanges++;
          console.log(`💱 Price changed for "${product.name}": ${oldPrice} → ${newPrice}`);
        } else {
          results.skipped++;
        }

        // ── Get user email ──────────────────────────────────────────────
        // We store user_email on the product row to avoid auth.admin calls
        const userEmail = product.user_email;

        if (!userEmail) {
          console.warn(`⚠️  No user_email on product ${product.id} — skipping alerts`);
          results.updated++;
          continue;
        }

        // ── Price drop alert ────────────────────────────────────────────
        if (newPrice < oldPrice) {
          try {
            await sendPriceDropAlert({
              to:       userEmail,
              product:  { ...product, url: product.url },
              oldPrice,
              newPrice,
            });
            results.alertsSent++;
            console.log(`📧 Price drop alert sent to ${userEmail}`);
          } catch (e) {
            console.error(`❌ Price drop email failed for ${product.id}:`, e.message);
          }
        }

        // ── Target price alert ──────────────────────────────────────────
        if (
          product.target_price &&
          newPrice <= parseFloat(product.target_price) &&
          oldPrice > parseFloat(product.target_price)
        ) {
          try {
            await sendTargetPriceAlert({
              to:          userEmail,
              product:     { ...product, current_price: newPrice },
              targetPrice: product.target_price,
            });
            results.alertsSent++;
            console.log(`🎯 Target price alert sent to ${userEmail}`);
          } catch (e) {
            console.error(`❌ Target price email failed for ${product.id}:`, e.message);
          }
        }

        results.updated++;
      } catch (error) {
        console.error(`❌ Error processing product ${product.id}:`, error.message);
        results.failed++;
      }
    }

    console.log("✅ Cron complete:", results);

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Price check endpoint is live. Use POST with Authorization header to trigger.",
    usage: "POST /api/cron/check-prices with Authorization: Bearer <CRON_SECRET>",
  });
}