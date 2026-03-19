import { createClient } from "@/utils/supabase/server";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";

export async function runPriceCheck() {
  const supabase = await createClient();

  // Get all products
  const { data: products } = await supabase
    .from("products")
    .select("*");

  for (const product of products) {
    try {
      const productData = await scrapeProduct(product.url);

      const newPrice = parseFloat(productData.currentPrice);

      // Insert into history
      await supabase.from("price_history").insert({
        product_id: product.id,
        price: newPrice,
        currency: product.currency,
        checked_at: new Date().toISOString(),
      });

      // 🔥 PRICE DROP
      if (newPrice < product.current_price) {
        console.log("📉 Price dropped");

        await sendPriceDropAlert(
          product.user_email,
          product,
          product.current_price,
          newPrice
        );
      }

      // 🔥 TARGET HIT
      if (
        product.target_price &&
        newPrice <= product.target_price
      ) {
        console.log("🎯 Target reached");

        await sendPriceDropAlert(
          product.user_email,
          product,
          product.current_price,
          newPrice
        );
      }

      // Update latest price
      await supabase
        .from("products")
        .update({ current_price: newPrice })
        .eq("id", product.id);

    } catch (err) {
      console.error("Error checking product:", err);
    }
  }
}