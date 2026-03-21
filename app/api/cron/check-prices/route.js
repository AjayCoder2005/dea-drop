import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/resend";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

    // ✅ Env var diagnostic — shows in response so you can see what's missing
    const envCheck = {
      FIRECRAWL_API_KEY:        !!process.env.FIRECRAWL_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      RESEND_API_KEY:            !!process.env.RESEND_API_KEY,
    };

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    // Batch-fetch all user emails
    const emailMap = {};
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (!usersError && users?.users) {
      for (const u of users.users) {
        emailMap[u.id] = u.email;
      }
    }

    const results = {
      total:        products?.length || 0,
      updated:      0,
      skipped:      0,
      failed:       0,
      priceChanges: 0,
      alertsSent:   0,
      errors:       [], // ✅ Now captures actual error messages per product
    };

    for (const product of products || []) {
      try {
        const scraped = await scrapeProduct(product.url);

        if (!scraped.current_price) {
          results.failed++;
          results.errors.push({ productId: product.id, url: product.url, error: "No price extracted" });
          continue;
        }

        const newPrice = parseFloat(scraped.current_price);
        const oldPrice = parseFloat(product.current_price);
        const currency = scraped.currency || product.currency;

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency,
            name:       scraped.name      || product.name,
            image_url:  scraped.image_url || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        await supabase.from("price_history").insert({
          product_id: product.id,
          price:      newPrice,
          currency,
          checked_at: new Date().toISOString(),
        });

        if (newPrice !== oldPrice) {
          results.priceChanges++;
        } else {
          results.skipped++;
        }

        const userEmail = emailMap[product.user_id];
        if (!userEmail) {
          results.updated++;
          continue;
        }

        if (newPrice < oldPrice) {
          await sendPriceDropAlert(userEmail, product, oldPrice, newPrice);
          results.alertsSent++;
        }

        if (
          product.target_price &&
          newPrice <= parseFloat(product.target_price) &&
          oldPrice > parseFloat(product.target_price)
        ) {
          await sendPriceDropAlert(userEmail, product, oldPrice, newPrice);
          results.alertsSent++;
        }

        results.updated++;
      } catch (error) {
        // ✅ Log full error message + product URL so you know exactly what failed
        console.error(`❌ Failed for ${product.url}:`, error.message);
        results.failed++;
        results.errors.push({
          productId: product.id,
          url:       product.url,
          error:     error.message,
        });
      }
    }

    return NextResponse.json({
      success:   true,
      message:   "Price check completed",
      timestamp: new Date().toISOString(),
      envCheck,   // ✅ Shows which env vars are present (true/false, not the actual values)
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status:  "ok",
    message: "Price check endpoint is live. Use POST to trigger.",
  });
}