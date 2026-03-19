import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_KEY   = Deno.env.get("re_UF1286bi_7CV85Zp4c1Jg6Pr97Uv3a8KU");
const RESEND_FROM  = Deno.env.get("onboarding@resend.dev");
const SUPABASE_URL = Deno.env.get("https://ntpqriigbiuasxqpvccb.supabase.co");
const SERVICE_KEY  = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cHFyaWlnYml1YXN4cXB2Y2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjY2MzksImV4cCI6MjA4OTI0MjYzOX0.rZHZPCQ5W5107VDUh2BER935viQvO-p8yoZIgHQ6Thc");



serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!RESEND_KEY)  throw new Error("RESEND_API_KEY secret is not set");
    if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY secret is not set");

    const body     = await req.json();
    const products = body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no products passed" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];
    const errors  = [];

    for (const product of products) {
      if (
        !product.target_price ||
        !product.user_email   ||
        Number(product.current_price) > Number(product.target_price) ||
        product.notified === true
      ) {
        console.log(`Skipping ${product.id} — conditions not met`);
        continue;
      }

      try {
        const savings = Number(product.target_price) - Number(product.current_price);

        // 1. Send email
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({
            from:    RESEND_FROM,
            to:      product.user_email,
            subject: `🎯 Price dropped on ${product.name}!`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff">
                <div style="text-align:center;margin-bottom:24px">
                  <span style="font-size:40px">🎯</span>
                  <h1 style="color:#10b981;margin:8px 0 4px;font-size:22px">Target Price Reached!</h1>
                  <p style="color:#6b7280;margin:0;font-size:14px">Time to grab it before the price goes up</p>
                </div>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
                  <p style="font-weight:700;font-size:16px;margin:0 0 14px;color:#111827">${product.name}</p>
                  <table style="width:100%;border-collapse:collapse">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px">Current Price</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;font-size:20px;color:#10b981">
                        ₹${Number(product.current_price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px">Your Target</td>
                      <td style="padding:6px 0;text-align:right;font-size:14px;color:#374151">
                        ₹${Number(product.target_price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    ${savings > 0 ? `
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px">You Save</td>
                      <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;color:#f97316">
                        ₹${savings.toLocaleString("en-IN")} 🔥
                      </td>
                    </tr>` : ""}
                  </table>
                </div>
                <a href="${product.url}" style="display:block;text-align:center;padding:14px 24px;background:#f97316;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:16px">
                  Buy Now →
                </a>
                <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0">
                  You set this price alert on PriceTracker. Prices can change anytime — act fast!
                </p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          throw new Error(`Resend error (${emailRes.status}): ${errText}`);
        }

        // 2. Mark notified in Supabase
        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`,
          {
            method: "PATCH",
            headers: {
              "apikey":        SERVICE_KEY,
              "Authorization": `Bearer ${SERVICE_KEY}`,
              "Content-Type":  "application/json",
              "Prefer":        "return=minimal",
            },
            body: JSON.stringify({ notified: true }),
          }
        );

        if (!patchRes.ok) {
          const errText = await patchRes.text();
          throw new Error(`Supabase patch error (${patchRes.status}): ${errText}`);
        }

        results.push({ id: product.id, email: product.user_email, success: true });
        console.log(`Email sent + notified: ${product.id}`);

      } catch (productErr) {
        console.error(`Failed for ${product.id}:`, productErr.message);
        errors.push({ id: product.id, error: productErr.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, notified: results.length, failed: errors.length, results, errors }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Fatal error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});