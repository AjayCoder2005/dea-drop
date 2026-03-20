import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import scrapeProduct from "@/lib/firecrawl"; // ✅ FIXED
import { sendPriceDropAlert } from "@/lib/resend";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;

    const results = {
      total: products?.length || 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products || []) {
      try {
        const scraped = await scrapeProduct(product.url);

        if (!scraped?.current_price) {
          results.failed++;
          continue;
        }

        const newPrice = Number(scraped.current_price);
        const oldPrice = Number(product.current_price);
        const currency = scraped.currency || product.currency;

        // ✅ Update product
        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency,
            name: scraped.name || product.name,
            image_url: scraped.image_url || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        // ✅ Insert history
        await supabase.from("price_history").insert({
          product_id: product.id,
          price: newPrice,
          currency,
          checked_at: new Date().toISOString(),
        });

        if (newPrice !== oldPrice) {
          results.priceChanges++;
        } else {
          results.skipped++;
        }

        const userEmail = product.user_email;
        if (!userEmail) {
          results.updated++;
          continue;
        }

        // ✅ Price drop alert
        if (newPrice < oldPrice) {
          await sendPriceDropAlert({
            to: userEmail,
            productName: product.name,
            productUrl: product.url,
            oldPrice,
            newPrice,
            currency,
          });

          results.alertsSent++;
        }

        // ✅ Target price alert
        if (
          product.target_price &&
          newPrice <= Number(product.target_price) &&
          oldPrice > Number(product.target_price)
        ) {
          await sendPriceDropAlert({
            to: userEmail,
            productName: product.name,
            productUrl: product.url,
            oldPrice,
            newPrice,
            currency,
            targetPrice: product.target_price,
          });

          results.alertsSent++;
        }

        results.updated++;
      } catch (err) {
        console.error(`❌ Error for ${product.id}:`, err.message);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Use POST to trigger cron",
  });
}