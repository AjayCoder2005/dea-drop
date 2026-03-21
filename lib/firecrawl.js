// Free scraper — no API credits needed
// Supports: Amazon.in, Flipkart, Walmart, generic fallback

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

function first(html, patterns) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function cleanPrice(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[₹$€£,\s]/g, "").replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function detectCurrency(url) {
  if (url.includes("amazon.in") || url.includes("flipkart.com")) return "INR";
  if (url.includes("amazon.co.uk")) return "GBP";
  if (url.includes("amazon.de") || url.includes("amazon.fr")) return "EUR";
  return "USD";
}

function extractAmazon(html) {
  const name = first(html, [
    /<span[^>]+id="productTitle"[^>]*>\s*([\s\S]{5,300}?)\s*<\/span>/,
    /"title"\s*:\s*"([^"]{5,200})"/,
    /<meta[^>]+name="title"[^>]+content="([^"]{5,200})"/,
  ]);

  const priceRaw = first(html, [
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    /class="a-price-whole"[^>]*>([\d,]+)</,
    /corePriceDisplay[^>]*>[\s\S]{1,300}?class="a-offscreen"[^>]*>([\s\S]{1,30}?)</,
    /priceblock_ourprice[^>]*>([\s\S]{1,30}?)</,
    /priceblock_dealprice[^>]*>([\s\S]{1,30}?)</,
  ]);

  const imageUrl = first(html, [
    /"hiRes"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
    /"large"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
    /id="landingImage"[^>]+src="([^"]+)"/,
  ]);

  return { name, priceRaw, imageUrl };
}

function extractFlipkart(html) {
  const name = first(html, [
    /<span[^>]+class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]{5,300}?)<\/span>/,
    /<h1[^>]+class="[^"]*yhB1nd[^"]*"[^>]*>([\s\S]{5,300}?)<\/h1>/,
    /"name"\s*:\s*"([^"]{5,200})"/,
    /<meta[^>]+property="og:title"[^>]+content="([^"]{5,200})"/,
  ]);

  const priceRaw = first(html, [
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    /class="[^"]*_30jeq3[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*Nx9bqj[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*_16Jk6d[^"]*"[^>]*>₹([\d,]+)/,
    /"price"\s*:\s*([\d]+)/,
  ]);

  const imageUrl = first(html, [
    /"image"\s*:\s*"(https:\/\/[^"]+)"/,
    /<img[^>]+class="[^"]*_396cs4[^"]*"[^>]+src="([^"]+)"/,
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
  ]);

  return { name, priceRaw, imageUrl };
}

function extractGeneric(html) {
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

export async function scrapeProduct(url) {
  let html;
  try {
    // ✅ 25 second timeout — enough for slow Flipkart/Amazon pages
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    html = await res.text();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The site took too long to respond.");
    }
    throw new Error(`Fetch failed: ${err.message}`);
  }

  let extracted;
  if (url.includes("amazon."))      extracted = extractAmazon(html);
  else if (url.includes("flipkart.com")) extracted = extractFlipkart(html);
  else                               extracted = extractGeneric(html);

  const price = cleanPrice(extracted.priceRaw);

  if (!extracted.name || !price) {
    // Try generic as fallback
    const fallback = extractGeneric(html);
    const fallbackPrice = cleanPrice(fallback.priceRaw);
    if (fallback.name && fallbackPrice) {
      return {
        name:          fallback.name.replace(/\s+/g, " ").slice(0, 300),
        current_price: fallbackPrice,
        currency:      detectCurrency(url),
        image_url:     fallback.imageUrl || null,
      };
    }
    throw new Error("Could not extract product details. Try the direct product page URL.");
  }

  return {
    name:          extracted.name.replace(/\s+/g, " ").slice(0, 300),
    current_price: price,
    currency:      detectCurrency(url),
    image_url:     extracted.imageUrl || null,
  };
}