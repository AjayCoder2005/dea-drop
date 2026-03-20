// app/api/cron/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/resend";

export async function POST(request) {
  try {
    // 🔐 Auth check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🗄️ Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 📦 Get products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;

    const results = {
      total: products?.length || 0,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products || []) {
      try {
        const data = await scrapeProduct(product.url);

        if (!data.current_price) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(data.current_price);
        const oldPrice = parseFloat(product.current_price);

        if (isNaN(newPrice)) {
          results.failed++;
          continue;
        }

        const currency = data.currency || product.currency;

        // ✅ Update product
        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency,
            name: data.name || product.name,
            image_url: data.image_url || product.image_url,
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
        }

        const userEmail = product.user_email;
        const targetPrice = parseFloat(product.target_price);

        // 🔥 Price drop alert
        if (userEmail && newPrice < oldPrice) {
          try {
            const res = await sendPriceDropAlert({
              to: userEmail,
              productName: product.name,
              productUrl: product.url,
              oldPrice,
              newPrice,
              currency,
              targetPrice,
            });

            if (res?.id) results.alertsSent++;
          } catch (e) {
            console.error("Email error:", e.message);
          }
        }

        // 🎯 Target alert
        if (
          userEmail &&
          product.target_price &&
          newPrice <= targetPrice &&
          oldPrice > targetPrice
        ) {
          try {
            const res = await sendPriceDropAlert({
              to: userEmail,
              productName: product.name,
              productUrl: product.url,
              oldPrice,
              newPrice,
              currency,
              targetPrice,
            });

            if (res?.id) results.alertsSent++;
          } catch (e) {
            console.error("Target email error:", e.message);
          }
        }

        results.updated++;
      } catch (err) {
        console.error(`❌ Product ${product.id}:`, err.message);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("❌ Cron error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Cron endpoint ready. Use POST.",
  });
}