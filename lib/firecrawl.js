// Free scraper with anti-bot bypass
// Supports: Amazon.in, Flipkart, Walmart, generic fallback

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

function getHeaders(url) {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const isFlipkart = url.includes("flipkart.com");

  return {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    // Flipkart needs these extra headers
    ...(isFlipkart && {
      "Referer": "https://www.flipkart.com/",
      "Origin": "https://www.flipkart.com",
    }),
  };
}

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
    /<title>([^<]{5,150}?) - Buy/,
  ]);
  const priceRaw = first(html, [
    /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
    /class="[^"]*_30jeq3[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*Nx9bqj[^"]*"[^>]*>₹([\d,]+)/,
    /class="[^"]*_16Jk6d[^"]*"[^>]*>₹([\d,]+)/,
    /"selling_price"\s*:\s*([\d]+)/,
    /"finalPrice"\s*:\s*([\d]+)/,
  ]);
  const imageUrl = first(html, [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    /"image"\s*:\s*"(https:\/\/[^"]+)"/,
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

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(url, {
        headers: getHeaders(url),
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // ✅ On 429/529 (rate limited), wait and retry
      if (res.status === 429 || res.status === 529) {
        if (attempt < retries) {
          console.log(`Rate limited (${res.status}), retrying in ${attempt * 2}s...`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        throw new Error(`Site blocked request after ${retries} attempts (HTTP ${res.status}). Try again in a few minutes.`);
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      return await res.text();

    } catch (err) {
      if (err.name === "AbortError") {
        if (attempt < retries) {
          console.log(`Timeout on attempt ${attempt}, retrying...`);
          continue;
        }
        throw new Error("Request timed out. The site took too long to respond.");
      }
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
}

export async function scrapeProduct(url) {
  const html = await fetchWithRetry(url);

  let extracted;
  if (url.includes("amazon."))          extracted = extractAmazon(html);
  else if (url.includes("flipkart.com")) extracted = extractFlipkart(html);
  else                                   extracted = extractGeneric(html);

  let price = cleanPrice(extracted.priceRaw);
  let name  = extracted.name;

  // Fallback to generic extractor if site-specific failed
  if (!name || !price) {
    const fallback = extractGeneric(html);
    name  = name  || fallback.name;
    price = price || cleanPrice(fallback.priceRaw);
    extracted.imageUrl = extracted.imageUrl || fallback.imageUrl;
  }

  if (!name || !price) {
    throw new Error("Could not extract product details. Try pasting the direct product page URL (not a search or category page).");
  }

  return {
    name:          name.replace(/\s+/g, " ").replace(/&amp;/g, "&").slice(0, 300),
    current_price: price,
    currency:      detectCurrency(url),
    image_url:     extracted.imageUrl || null,
  };
}