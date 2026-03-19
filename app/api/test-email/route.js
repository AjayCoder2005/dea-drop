import { NextResponse } from "next/server";
import { sendPriceDropAlert } from "@/lib/resend";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found" },
        { status: 404 }
      );
    }

    const product = products[0];
    const oldPrice = product.current_price + 2000;
    const newPrice = product.current_price;

    const result = await sendPriceDropAlert(
      "a22937541@gmail.com",
      product,
      oldPrice,
      newPrice
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sentTo: "a22937541@gmail.com",
      product: product.name,
      oldPrice,
      newPrice,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}