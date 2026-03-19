"use server";

import { createClient } from "@/utils/supabase/server";
import { scrapeProduct } from "@/lib/firecrawl";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPriceDropAlert } from "@/lib/resend";

// ================= ADD PRODUCT =================
export async function addProduct(formData) {
  const url = formData.get("url");

  if (!url) return { error: "URL is required" };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const productData = await scrapeProduct(url);

    if (!productData.productName || !productData.currentPrice) {
      return { error: "Could not extract product info" };
    }

    const newPrice = parseFloat(productData.currentPrice);
    const currency = productData.currencyCode || "INR";

    // 🔍 Check existing
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, current_price, target_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .maybeSingle();

    const isUpdate = !!existingProduct;

    // ✅ SAVE PRODUCT (DO NOT TOUCH TARGET PRICE HERE)
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          user_email: user.email,
          url,
          name: productData.productName,
          current_price: newPrice,
          currency,
          image_url: productData.productImageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,url" }
      )
      .select()
      .single();

    if (error) throw error;

    // ================= PRICE HISTORY =================
    await supabase.from("price_history").insert({
      product_id: product.id,
      price: newPrice,
      currency,
      checked_at: new Date().toISOString(),
    });

    // ================= 📉 PRICE DROP =================
    if (isUpdate && existingProduct) {
      if (newPrice < existingProduct.current_price) {
        await sendPriceDropAlert(
          user.email,
          product,
          existingProduct.current_price,
          newPrice
        );
      }
    }

    // ================= 🎯 TARGET ALERT =================
    if (isUpdate && existingProduct?.target_price) {
      if (
        newPrice <= existingProduct.target_price &&
        existingProduct.current_price > existingProduct.target_price
      ) {
        await sendPriceDropAlert(
          user.email,
          product,
          existingProduct.current_price,
          newPrice
        );
      }
    }

    revalidatePath("/");

    return {
      success: true,
      product,
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ================= SET TARGET PRICE =================
export async function setTargetPrice(productId, targetPrice) {
  try {
    const supabase = await createClient();

    // ✅ ONLY update target_price (IMPORTANT)
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
    return { error: error.message };
  }
}

// ================= DELETE =================
export async function deleteProduct(productId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ================= GET PRODUCTS =================
export async function getProducts() {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    return data || [];
  } catch {
    return [];
  }
}

// ================= PRICE HISTORY =================
export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    return data || [];
  } catch {
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