import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import scrapeProduct from "@/lib/firecrawl"; // ✅ FIXED (default import)
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

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    const results = {
      total: products?.length || 0,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products || []) {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData?.current_price) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(productData.current_price);
        const oldPrice = parseFloat(product.current_price);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currency || product.currency,
            name: productData.name || product.name,
            image_url: productData.image_url || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        await supabase.from("price_history").insert({
          product_id: product.id,
          price: newPrice,
          currency: productData.currency || product.currency,
          checked_at: new Date().toISOString(),
        });

        if (oldPrice !== newPrice) {
          results.priceChanges++;
        }

        const targetPrice = parseFloat(product.target_price);

        if (
          product.target_price &&
          newPrice <= targetPrice &&
          oldPrice > targetPrice
        ) {
          const userEmail = product.user_email;

          if (userEmail) {
            const emailResult = await sendPriceDropAlert(
              userEmail,
              product,
              oldPrice,
              newPrice
            );

            if (emailResult?.success) {
              results.alertsSent++;
              console.log(`✅ Alert sent to ${userEmail}`);
            }
          }
        }

        results.updated++;
      } catch (error) {
        console.error(`Error processing ${product.id}:`, error.message);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}