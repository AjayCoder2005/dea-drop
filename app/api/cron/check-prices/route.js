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

    // ✅ Service role key required to query auth.users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    // ✅ Fixed: batch-fetch all user emails from auth.users in one call
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
    };

    for (const product of products || []) {
      try {
        const scraped = await scrapeProduct(product.url);

        if (!scraped.current_price) {
          results.failed++;
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

        // ✅ Fixed: look up email from the map (products table has user_id, not user_email)
        const userEmail = emailMap[product.user_id];
        if (!userEmail) {
          results.updated++;
          continue;
        }

        // Price drop alert
        if (newPrice < oldPrice) {
          await sendPriceDropAlert(userEmail, product, oldPrice, newPrice);
          results.alertsSent++;
        }

        // Target price alert — only fires when price first crosses the threshold
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
        console.error(`❌ Failed for product ${product.id}:`, error.message);
        results.failed++;
      }
    }

    return NextResponse.json({
      success:   true,
      message:   "Price check completed",
      timestamp: new Date().toISOString(),
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