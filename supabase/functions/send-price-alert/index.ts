// ✅ Correct Supabase Edge Function
// Path: supabase/functions/send-price-alert/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ✅ Remove this line entirely:
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";


// ✅ Deno.env.get() takes the KEY NAME as string, not the actual value
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM  = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SERVICE_ROLE_KEY")!;



const sym = (c: string) =>
  ({ USD: "$", INR: "₹", EUR: "€", GBP: "£" }[c] ?? c + " ");

// ✅ Use Deno.serve() directly — no import needed
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!RESEND_KEY)   throw new Error("RESEND_API_KEY secret is not set");
    if (!SERVICE_KEY)  throw new Error("SUPABASE_SERVICE_ROLE_KEY secret is not set");

    const { record } = await req.json();
    // record = newly inserted row from price_history table

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch the product using the product_id from the inserted price_history row
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", record.product_id)
      .single();

    if (error || !product) {
      return new Response(JSON.stringify({ skipped: "Product not found" }), { status: 200 });
    }

    const newPrice  = parseFloat(record.price);
    const oldPrice  = parseFloat(product.current_price);
    const userEmail = product.user_email;

    // Skip if no email or price didn't drop
    if (!userEmail) {
      return new Response(JSON.stringify({ skipped: "No user_email" }), { status: 200 });
    }
    if (newPrice >= oldPrice) {
      return new Response(JSON.stringify({ skipped: "No price drop" }), { status: 200 });
    }

    const s      = sym(product.currency);
    const saving = (oldPrice - newPrice).toFixed(2);
    const pct    = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(1);

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    RESEND_FROM,
        to:      userEmail,
        subject: `📉 Price dropped ${pct}% — ${product.name}`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111118;border:1px solid #222230;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:24px 32px;border-bottom:1px solid #222230;">
    <table width="100%"><tr>
      <td><span style="font-size:18px;font-weight:700;color:#f0f0f5;">💰 DealDrop</span></td>
      <td align="right"><span style="font-size:11px;color:#22c55e;background:rgba(34,197,94,0.1);padding:4px 10px;border-radius:20px;">Price Alert</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px;">
    <h1 style="font-size:22px;color:#f0f0f5;margin:0 0 6px;">Price dropped ${pct}%! 🎉</h1>
    <p style="font-size:14px;color:#888899;margin:0 0 24px;">Grab it before the price goes back up.</p>
    <table width="100%" style="background:#18181f;border:1px solid #2a2a3a;border-radius:12px;margin-bottom:20px;">
      <tr>
        ${product.image_url ? `<td width="88" style="padding:16px 0 16px 16px;"><img src="${product.image_url}" width="64" height="64" style="border-radius:8px;object-fit:cover;" alt=""/></td>` : ""}
        <td style="padding:16px;">
          <p style="font-size:13px;color:#f0f0f5;margin:0 0 10px;">${product.name}</p>
          <span style="font-size:14px;color:#555566;text-decoration:line-through;">${s}${oldPrice.toFixed(2)}</span>
          &nbsp;→&nbsp;
          <span style="font-size:22px;font-weight:700;color:#22c55e;">${s}${newPrice.toFixed(2)}</span>
          &nbsp;
          <span style="background:rgba(34,197,94,0.12);color:#22c55e;font-size:11px;padding:3px 10px;border-radius:20px;">
            Save ${s}${saving}
          </span>
        </td>
      </tr>
    </table>
    <table width="100%"><tr><td align="center">
      <a href="${product.url}" style="display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:13px 36px;border-radius:10px;font-size:14px;font-weight:600;">
        View Deal →
      </a>
    </td></tr></table>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend error: ${JSON.stringify(err)}`);
    }

    // Update product: new price + mark notified
    await supabase
      .from("products")
      .update({ current_price: newPrice, notified: true, updated_at: new Date().toISOString() })
      .eq("id", product.id);

    return new Response(
      JSON.stringify({ success: true, sentTo: userEmail }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});