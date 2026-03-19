"use server";

import { createClient } from "@/utils/supabase/server";
import { scrapeProduct } from "@/lib/firecrawl";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPriceDropAlert, sendTargetPriceAlert } from "@/lib/email";

// ================= ADD PRODUCT =================
export async function addProduct(formData) {
  const url         = formData.get("url");
  const targetPrice = formData.get("targetPrice");

  if (!url) return { error: "URL is required" };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Scrape product details via Firecrawl
    const productData = await scrapeProduct(url);

    if (!productData.name || !productData.current_price) {
      return { error: "Could not extract product info from this URL. Try a direct product page." };
    }

    const newPrice = parseFloat(productData.current_price);
    const currency = productData.currency || "INR";

    // Check if already tracking this URL
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, current_price, target_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .maybeSingle();

    const isUpdate = !!existingProduct;

    // Upsert product — preserve existing target_price unless a new one is provided
    const upsertData = {
      user_id:       user.id,
      url,
      name:          productData.name,
      current_price: newPrice,
      currency,
      image_url:     productData.image_url || null,
      updated_at:    new Date().toISOString(),
    };

    // Only set target_price if explicitly provided in the form
    if (targetPrice) {
      upsertData.target_price = parseFloat(targetPrice);
    }

    const { data: product, error } = await supabase
      .from("products")
      .upsert(upsertData, { onConflict: "user_id,url" })
      .select()
      .single();

    if (error) throw error;

    // Save price history entry
    await supabase.from("price_history").insert({
      product_id: product.id,
      price:      newPrice,
      currency,
      checked_at: new Date().toISOString(),
    });

    // ── Price drop alert ──────────────────────────────────────────────────
    if (isUpdate && existingProduct && newPrice < existingProduct.current_price) {
      try {
        await sendPriceDropAlert({
          to:       user.email,
          product,
          oldPrice: existingProduct.current_price,
          newPrice,
        });
      } catch (e) {
        console.error("Price drop email failed:", e.message);
      }
    }

    // ── Target price alert ────────────────────────────────────────────────
    const activeTarget = upsertData.target_price ?? existingProduct?.target_price;
    if (
      isUpdate &&
      existingProduct &&
      activeTarget &&
      newPrice <= activeTarget &&
      existingProduct.current_price > activeTarget
    ) {
      try {
        await sendTargetPriceAlert({
          to:          user.email,
          product:     { ...product, current_price: newPrice },
          targetPrice: activeTarget,
        });
      } catch (e) {
        console.error("Target price email failed:", e.message);
      }
    }

    revalidatePath("/");
    return {
      success: true,
      message: isUpdate
        ? `✅ Updated: ${product.name}`
        : `✅ Now tracking: ${product.name}`,
      product,
    };
  } catch (error) {
    console.error("addProduct error:", error);
    return { error: error.message || "Something went wrong. Please try again." };
  }
}

// ================= SET TARGET PRICE =================
export async function setTargetPrice(productId, targetPrice) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({
        target_price: targetPrice ? parseFloat(targetPrice) : null,
      })
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("setTargetPrice error:", error);
    return { error: error.message };
  }
}

// ================= DELETE PRODUCT =================
export async function deleteProduct(productId) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", user.id); // safety: only delete own products

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return { error: error.message };
  }
}

// ================= GET PRODUCTS =================
export async function getProducts() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getProducts error:", error);
    return [];
  }
}

// ================= GET PRICE HISTORY =================
export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getPriceHistory error:", error);
    return [];
  }
}

// ================= SIGN OUT =================
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}