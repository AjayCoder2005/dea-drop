import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a price drop alert email to the user.
 *
 * @param {Object} opts
 * @param {string} opts.to          - recipient email
 * @param {string} opts.productName - product display name
 * @param {string} opts.productUrl  - link to the product page
 * @param {number} opts.oldPrice    - price before the drop
 * @param {number} opts.newPrice    - current (dropped) price
 * @param {string} [opts.currency]  - currency code e.g. "INR"
 * @param {number|null} [opts.targetPrice] - user's target price, if set
 */
export async function sendPriceDropAlert({
  to,
  productName,
  productUrl,
  oldPrice,
  newPrice,
  currency = "INR",
  targetPrice = null,
}) {
  const symbols   = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const sym       = symbols[currency] || "₹";
  const drop      = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(1);
  const targetMet = targetPrice && newPrice <= targetPrice;

  const subject = targetMet
    ? `🎯 Target price reached — ${productName}`
    : `🔥 Price dropped ${drop}% — ${productName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;color:#f0f0f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0e0e14;border:1px solid #1e1e2a;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff22,#ff658422);border-bottom:1px solid #1e1e2a;padding:28px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6c63ff,#ff6584);border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;">
                    💰
                  </td>
                  <td style="padding-left:12px;font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#f0f0f5;">
                    DealDrop
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <!-- Badge -->
              <div style="display:inline-block;background:${targetMet ? "rgba(34,197,94,0.12)" : "rgba(108,99,255,0.12)"};border:1px solid ${targetMet ? "rgba(34,197,94,0.3)" : "rgba(108,99,255,0.3)"};color:${targetMet ? "#22c55e" : "#a78bfa"};font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;margin-bottom:20px;">
                ${targetMet ? "🎯 Target Price Reached!" : `🔥 Price dropped ${drop}%`}
              </div>

              <!-- Product name -->
              <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#f0f0f5;line-height:1.4;">
                ${productName}
              </h2>

              <!-- Price comparison -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131a;border:1px solid #1e1e2a;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <div style="font-size:11px;color:#555566;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Was</div>
                    <div style="font-size:22px;font-weight:700;color:#555566;text-decoration:line-through;">${sym}${oldPrice.toLocaleString("en-IN")}</div>
                  </td>
                  <td align="center" style="font-size:24px;color:#6c63ff;padding:0 4px;">→</td>
                  <td align="center" style="padding:0 12px;">
                    <div style="font-size:11px;color:#22c55e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Now</div>
                    <div style="font-size:28px;font-weight:700;color:#22c55e;">${sym}${newPrice.toLocaleString("en-IN")}</div>
                  </td>
                </tr>
              </table>

              ${targetMet ? `
              <!-- Target met note -->
              <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#22c55e;">
                ✓ The price is now at or below your target of <strong>${sym}${Number(targetPrice).toLocaleString("en-IN")}</strong>
              </div>
              ` : ""}

              <!-- CTA -->
              <a href="${productUrl}"
                style="display:block;text-align:center;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;font-size:15px;font-weight:600;padding:14px 24px;border-radius:10px;text-decoration:none;margin-bottom:20px;">
                View Deal →
              </a>

              <p style="margin:0;font-size:12px;color:#333340;text-align:center;line-height:1.6;">
                You're receiving this because you set up a price alert on DealDrop.<br/>
                Prices may change — act fast!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #1a1a24;padding:16px 32px;text-align:center;font-size:11px;color:#222230;">
              DealDrop · Smart Price Tracking
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return resend.emails.send({
    from:    "DealDrop <alerts@yourdomain.com>", // ← change to your verified Resend sender
    to:      [to],
    subject,
    html,
  });
}