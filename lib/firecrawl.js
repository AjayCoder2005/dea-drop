// ✅ FREE scraper — no Firecrawl credits needed.
// Uses native fetch with browser headers + HTML regex parsing.
// Supports: Amazon.in, Flipkart, Walmart, and generic fallback.

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function first(html, patterns) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function cleanPrice(raw) {
  if (!raw) return null;
  // Remove currency symbols, commas, spaces → keep digits and dot
  const cleaned = raw.replace(/[₹$€£,\s]/g, "").replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function detectCurrency(url, html) {
  if (url.includes("amazon.in") || url.includes("flipkart.com")) return "INR";
  if (url.includes("amazon.co.uk")) return "GBP";
  if (url.includes("amazon.de") || url.includes("amazon.fr")) return "EUR";
  const m = html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/);
  return m?.[1] || "USD";
}

// ── Site-specific extractors ───────────────────────────────────────────────

function extractAmazon(html) {
  const name = first(html, [
    /<span[^>]+id="productTitle"[^>]*>\s*([\s\S]{5,300}?)\s*<\/span>/,
    /"title"\s*:\s*"([^"]{5,200})"/,
  ]);

  const priceRaw = first(html, [
    // JSON-LD structured data (most reliable)
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    // DOM price spans
    /class="a-price-whole"[^>]*>([\d,]+)</,
    /priceblock_ourprice[^>]*>([\s\S]{1,30}?)</,
    /priceblock_dealprice[^>]*>([\s\S]{1,30}?)</,
    /corePriceDisplay[^>]*>[\s\S]{1,200}?class="a-offscreen"[^>]*>([\s\S]{1,30}?)</,
  ]);

  const imageUrl = first(html, [
    /"hiRes"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
    /"large"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
    /id="landingImage"[^>]+src="([^"]+)"/,
    /id="imgBlkFront"[^>]+src="([^"]+)"/,
  ]);

  return { name, priceRaw, imageUrl };
}

function extractFlipkart(html) {
  const name = first(html, [
    /<span[^>]+class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]{5,300}?)<\/span>/,
    /<h1[^>]+class="[^"]*yhB1nd[^"]*"[^>]*>([\s\S]{5,300}?)<\/h1>/,
    /"name"\s*:\s*"([^"]{5,200})"/,
  ]);

  const priceRaw = first(html, [
    // JSON-LD
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    // DOM classes (Flipkart changes these often)
    /class="[^"]*_30jeq3[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*_1vC4OE[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*Nx9bqj[^"]*"[^>]*>₹([\d,]+)/,
    /"price"\s*:\s*([\d]+)/,
  ]);

  const imageUrl = first(html, [
    /<img[^>]+class="[^"]*_396cs4[^"]*"[^>]+src="([^"]+)"/,
    /<img[^>]+class="[^"]*q6DClP[^"]*"[^>]+src="([^"]+)"/,
    /"image"\s*:\s*"(https:\/\/[^"]+)"/,
  ]);

  return { name, priceRaw, imageUrl };
}

function extractGeneric(html) {
  // JSON-LD structured data works on many sites
  const name = first(html, [
    /"name"\s*:\s*"([^"]{5,300})"/,
    /<meta[^>]+property="og:title"[^>]+content="([^"]{5,300})"/,
    /<title>([^<]{5,200})<\/title>/,
  ]);

  const priceRaw = first(html, [
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    /<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"/,
    /<meta[^>]+itemprop="price"[^>]+content="([\d.]+)"/,
  ]);

  const imageUrl = first(html, [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    /"image"\s*:\s*"(https:\/\/[^"]+)"/,
  ]);

  return { name, priceRaw, imageUrl };
}

// ── Main export ────────────────────────────────────────────────────────────

export async function scrapeProduct(url) {
  // Fetch HTML
  let html;
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000), // 10 s timeout
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    html = await res.text();
  } catch (err) {
    throw new Error(`Fetch failed: ${err.message}`);
  }

  // Pick extractor
  let extracted;
  if (url.includes("amazon.")) {
    extracted = extractAmazon(html);
  } else if (url.includes("flipkart.com")) {
    extracted = extractFlipkart(html);
  } else {
    extracted = extractGeneric(html);
  }

  const price = cleanPrice(extracted.priceRaw);

  if (!extracted.name || !price) {
    throw new Error(
      `Could not extract product details. name="${extracted.name}" price="${extracted.priceRaw}"`
    );
  }

  return {
    name:          extracted.name.replace(/\s+/g, " ").slice(0, 300),
    current_price: price,
    currency:      detectCurrency(url, html),
    image_url:     extracted.imageUrl || null,
  };
}