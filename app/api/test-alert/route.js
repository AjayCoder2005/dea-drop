import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPriceDropAlert } from "@/lib/resend";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .not("target_price", "is", null)
      .not("user_email", "is", null);

    const alerts = [];

    for (const product of products) {
      if (product.current_price <= product.target_price) {
        const result = await sendPriceDropAlert(
          product.user_email,
          product,
          product.current_price + 2000,
          product.current_price
        );
        alerts.push({
          product: product.name,
          email: product.user_email,
          sent: result.success || false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: products?.length,
      alerts,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}