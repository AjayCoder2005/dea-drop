import { Resend } from "resend";

export async function GET() {
  try {
    // ✅ Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // ✅ Send email
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // ✅ use this for testing
      to: "a22937541@gmail.com",     // ✅ MUST be your Resend account email
      subject: "Test Email 🚀",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="background: linear-gradient(135deg, #FA5D19 0%, #FF8C42 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Price Drop Alert!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              
              ${
                product.image_url
                  ? `
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="${product.image_url}" alt="${product.name}" style="max-width: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;">
                </div>
              `
                  : ""
              }
              
              <h2 style="color: #1f2937; margin-top: 0;">${product.name}</h2>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Price dropped by ${percentageDrop}%!</strong>
                </p>
              </div>
              
              <table style="width: 100%; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; background: #f9fafb; border-radius: 4px;">
                    <div style="font-size: 14px; color: #6b7280;">Previous Price</div>
                    <div style="font-size: 20px; color: #9ca3af; text-decoration: line-through;">
                      ${product.currency} ${oldPrice.toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px;">
                    <div style="font-size: 14px; color: #6b7280;">Current Price</div>
                    <div style="font-size: 32px; color: #FA5D19; font-weight: bold;">
                      ${product.currency} ${newPrice.toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; background: #dcfce7; border-radius: 4px;">
                    <div style="font-size: 14px; color: #166534;">You Save</div>
                    <div style="font-size: 24px; color: #16a34a; font-weight: bold;">
                      ${product.currency} ${priceDrop.toFixed(2)}
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${product.url}" 
                   style="display: inline-block; background: #FA5D19; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Product →
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>You're receiving this email because you're tracking this product on Price Tracker.</p>
                <p style="margin-top: 10px;">
                  <a href="${
                    process.env.NEXT_PUBLIC_APP_URL
                  }" style="color: #FA5D19; text-decoration: none;">
                    View All Tracked Products
                  </a>
                </p>
              </div>
            </div>
            
          </body>
        </html>
      `,
    });

    // ❌ If error
    if (error) {
      console.error("Resend Error:", error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500 }
      );
    }

    // ✅ Success
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Catch Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: "No products found" }, { status: 404 });
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