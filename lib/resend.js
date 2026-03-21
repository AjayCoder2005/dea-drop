import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPriceDropAlert(userEmail, product, oldPrice, newPrice) {
  try {
    const priceDrop = oldPrice - newPrice;
    const percentageDrop = ((priceDrop / oldPrice) * 100).toFixed(1);

    // ✅ Resend free plan only allows sending to your own verified email.
    // Once you verify a domain at resend.com/domains, remove this line
    // and emails will go to the actual user's address.
    const toEmail = process.env.RESEND_VERIFIED_EMAIL || userEmail;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: toEmail,
      subject: `🎉 Price Drop Alert: ${product.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <div style="background: linear-gradient(135deg, #00e87a 0%, #00b4d8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Price Drop Alert!</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">DealDrop spotted a deal for you</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              
              ${product.image_url ? `
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="${product.image_url}" alt="${product.name}" style="max-width: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;">
                </div>
              ` : ""}
              
              <h2 style="color: #1f2937; margin-top: 0; font-size: 18px; line-height: 1.4;">${product.name}</h2>
              
              <div style="background: #dcfce7; border-left: 4px solid #00e87a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 600;">
                  💰 Price dropped by ${percentageDrop}%!
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 12px; background: #f9fafb; border-radius: 6px 6px 0 0; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Previous Price</div>
                    <div style="font-size: 22px; color: #9ca3af; text-decoration: line-through; font-weight: 600;">
                      ${product.currency} ${Number(oldPrice).toFixed(2)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background: #f0fdf4; border-radius: 0 0 6px 6px;">
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Current Price</div>
                    <div style="font-size: 32px; color: #16a34a; font-weight: 800;">
                      ${product.currency} ${Number(newPrice).toFixed(2)}
                    </div>
                    <div style="font-size: 14px; color: #16a34a; margin-top: 4px;">
                      You save ${product.currency} ${Number(priceDrop).toFixed(2)}
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${product.url}" style="display: inline-block; background: #00e87a; color: #07080d; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                  Buy Now →
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0 0 8px;">You're receiving this because you're tracking this product on DealDrop.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #00e87a; text-decoration: none; font-weight: 500;">
                  View All Tracked Products →
                </a>
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