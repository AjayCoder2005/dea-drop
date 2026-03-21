import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const proxyImage = (url) =>
  url ? `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=200&h=200&fit=contain` : null;

export async function sendPriceDropAlert(userEmail, product, oldPrice, newPrice) {
  try {
    const priceDrop = oldPrice - newPrice;
    const percentageDrop = ((priceDrop / oldPrice) * 100).toFixed(1);
    const proxiedImage = proxyImage(product.image_url);
    const currencySymbol = product.currency === "INR" ? "₹" : product.currency;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: userEmail,
      subject: `🎉 Price Drop! ${product.name?.substring(0, 50)}...`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#FA5D19,#FF8C42);padding:32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🎉</div>
              <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">Price Drop Alert!</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">DealDrop found a better price for you</p>
            </div>

            <!-- Product -->
            <div style="padding:32px;">

              ${proxiedImage ? `
              <div style="text-align:center;margin-bottom:24px;">
                <img src="${proxiedImage}" alt="${product.name}" 
                     style="max-width:160px;max-height:160px;object-fit:contain;border-radius:12px;border:1px solid #e5e7eb;" />
              </div>` : ""}

              <h2 style="color:#111827;margin:0 0 24px;font-size:16px;line-height:1.5;text-align:center;">
                ${product.name?.substring(0, 100)}${product.name?.length > 100 ? "..." : ""}
              </h2>

              <!-- Price Comparison -->
              <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="text-align:center;flex:1;">
                    <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Was</div>
                    <div style="font-size:20px;color:#9ca3af;text-decoration:line-through;font-weight:600;">
                      ${currencySymbol}${Number(oldPrice).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style="font-size:24px;color:#FA5D19;">→</div>
                  <div style="text-align:center;flex:1;">
                    <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Now</div>
                    <div style="font-size:28px;color:#FA5D19;font-weight:700;">
                      ${currencySymbol}${Number(newPrice).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div style="background:#dcfce7;border-radius:8px;padding:12px;text-align:center;">
                  <span style="color:#16a34a;font-weight:700;font-size:16px;">
                    🎯 You Save ${currencySymbol}${Number(priceDrop).toLocaleString("en-IN")} (${percentageDrop}% off!)
                  </span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0;">
                <a href="${product.url}" 
                   style="display:inline-block;background:#FA5D19;color:white;padding:16px 40px;text-decoration:none;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.5px;">
                  Buy Now →
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;color:#9ca3af;font-size:12px;">
                <p style="margin:0 0 8px;">You're tracking this on DealDrop 🛒</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dea-drop.vercel.app"}" 
                   style="color:#FA5D19;text-decoration:none;font-weight:600;">
                  View all tracked products →
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    return { error: error.message };
  }
}