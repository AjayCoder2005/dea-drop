import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const currencySymbol = (currency) => {
  const map = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
  return map[currency] || currency + " ";
};

// ── Shared dark-themed HTML email builder ─────────────────────────────────────
function buildEmailHtml({ headline, subtext, product, oldPrice, newPrice, badgeText, ctaText }) {
  const symbol  = currencySymbol(product.currency);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#111118;border:1px solid #222230;border-radius:16px;overflow:hidden;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #222230;background:#111118;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#f0f0f5;letter-spacing:-0.5px;">
                    💰 DealDrop
                  </span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#22c55e;background:rgba(34,197,94,0.1);padding:4px 10px;border-radius:20px;font-weight:500;">
                    Price Alert
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:32px;">

            <!-- Headline -->
            <h1 style="font-size:22px;font-weight:600;color:#f0f0f5;margin:0 0 8px;line-height:1.3;">
              ${headline}
            </h1>
            <p style="font-size:14px;color:#888899;margin:0 0 28px;line-height:1.6;">
              ${subtext}
            </p>

            <!-- Product card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#18181f;border:1px solid #2a2a3a;border-radius:12px;margin-bottom:24px;">
              <tr>
                <!-- Image or emoji -->
                <td width="88" style="padding:16px 0 16px 16px;vertical-align:middle;">
                  ${product.image_url
                    ? `<img src="${product.image_url}" width="64" height="64"
                          style="border-radius:8px;object-fit:cover;display:block;" alt=""/>`
                    : `<div style="width:64px;height:64px;background:#0a0a0f;border-radius:8px;font-size:28px;text-align:center;line-height:64px;">🛍️</div>`
                  }
                </td>
                <!-- Info -->
                <td style="padding:16px;vertical-align:top;">
                  <p style="font-size:13px;font-weight:500;color:#f0f0f5;margin:0 0 12px;line-height:1.4;">
                    ${product.name}
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- Old price -->
                      <td style="padding-right:10px;vertical-align:middle;">
                        <span style="font-size:13px;color:#555566;text-decoration:line-through;font-family:monospace;">
                          ${symbol}${parseFloat(oldPrice).toFixed(2)}
                        </span>
                      </td>
                      <!-- New price -->
                      <td style="padding-right:10px;vertical-align:middle;">
                        <span style="font-size:22px;font-weight:700;color:#22c55e;font-family:monospace;">
                          ${symbol}${parseFloat(newPrice).toFixed(2)}
                        </span>
                      </td>
                      <!-- Badge -->
                      <td style="vertical-align:middle;">
                        <span style="background:rgba(34,197,94,0.12);color:#22c55e;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;white-space:nowrap;">
                          ${badgeText}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Savings highlight bar -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size:12px;color:#888899;">Previous price</span><br/>
                        <span style="font-size:16px;color:#555566;text-decoration:line-through;font-family:monospace;">
                          ${symbol}${parseFloat(oldPrice).toFixed(2)}
                        </span>
                      </td>
                      <td align="center" style="font-size:20px;color:#333340;">→</td>
                      <td align="right">
                        <span style="font-size:12px;color:#888899;">Current price</span><br/>
                        <span style="font-size:24px;font-weight:700;color:#22c55e;font-family:monospace;">
                          ${symbol}${parseFloat(newPrice).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${product.url}"
                    style="display:inline-block;background:#6c63ff;color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                    ${ctaText}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-top:1px solid #222230;padding-top:20px;">
              <tr>
                <td style="padding-top:16px;text-align:center;">
                  <p style="font-size:11px;color:#555566;margin:0 0 6px;line-height:1.6;">
                    You're receiving this because you track this product on DealDrop.
                  </p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || '/'}"
                    style="font-size:11px;color:#6c63ff;text-decoration:none;">
                    View all tracked products →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Price drop alert ──────────────────────────────────────────────────────────
// Called with: sendPriceDropAlert({ to, product, oldPrice, newPrice })
export async function sendPriceDropAlert({ to, product, oldPrice, newPrice }) {
  try {
    const pct    = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(1);
    const symbol = currencySymbol(product.currency);
    const saving = (parseFloat(oldPrice) - parseFloat(newPrice)).toFixed(2);

    const { data, error } = await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to,
      subject: `📉 Price dropped ${pct}% — ${product.name}`,
      html: buildEmailHtml({
        headline:  `Price just dropped ${pct}% on your tracked item`,
        subtext:   `${product.name} hit a new low. Grab it before the price goes back up.`,
        product,
        oldPrice,
        newPrice,
        badgeText: `Save ${symbol}${saving}`,
        ctaText:   "View Deal →",
      }),
    });

    if (error) {
      console.error("Resend error (price drop):", error);
      return { error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("sendPriceDropAlert error:", error);
    return { error: error.message };
  }
}

// ── Target price alert ────────────────────────────────────────────────────────
// Called with: sendTargetPriceAlert({ to, product, targetPrice })
export async function sendTargetPriceAlert({ to, product, targetPrice }) {
  try {
    const symbol  = currencySymbol(product.currency);
    const current = parseFloat(product.current_price);
    const target  = parseFloat(targetPrice);
    const saving  = (target - current).toFixed(2);

    const { data, error } = await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to,
      subject: `🎯 Target price reached — ${product.name}`,
      html: buildEmailHtml({
        headline:  `Your target price has been reached!`,
        subtext:   `${product.name} is now at or below your target of ${symbol}${target.toFixed(2)}.`,
        product,
        oldPrice:  target,
        newPrice:  current,
        badgeText: `${symbol}${saving} below target`,
        ctaText:   "Buy Now →",
      }),
    });

    if (error) {
      console.error("Resend error (target):", error);
      return { error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("sendTargetPriceAlert error:", error);
    return { error: error.message };
  }
}