const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function detectCurrency(url) {
  if (url.includes("amazon.in") || url.includes("flipkart.com")) return "INR";
  if (url.includes("amazon.co.uk")) return "GBP";
  if (url.includes("amazon.de") || url.includes("amazon.fr")) return "EUR";
  return "USD";
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
  const n = parseFloat(String(raw).replace(/[₹$€£,\s]/g, "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? null : n;
}

// ✅ Validate extracted name — reject browser names, generic words
const INVALID_NAMES = ["firefox", "chrome", "safari", "edge", "opera", "browser", "google", "loading", "javascript", "404", "403", "error", "blocked"];

function isValidName(name) {
  if (!name || name.length < 5) return false;
  const lower = name.toLowerCase();
  // Reject if name is just a browser/generic word
  if (INVALID_NAMES.some(bad => lower === bad || lower.startsWith(bad + " ") && lower.length < 20)) return false;
  // Must contain at least one letter and not be all symbols
  if (!/[a-zA-Z]/.test(name)) return false;
  return true;
}

// ── Fetch strategies ─────────────────────────────────────────────────────────

async function fetchDirect(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": randomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Cache-Control": "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// ✅ Zenrows with js_render=true for Flipkart (renders JavaScript)
async function fetchViaZenrows(url, jsRender = false) {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) throw new Error("ZENROWS_API_KEY not set");

  const params = new URLSearchParams({
    apikey: apiKey,
    url: url,
    ...(jsRender && { js_render: "true" }),
  });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 35000);
  try {
    const res = await fetch(`https://api.zenrows.com/v1/?${params}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Zenrows ${res.status}: ${err.slice(0, 100)}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchViaScraperAPI(url) {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) throw new Error("SCRAPER_API_KEY not set");

  const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&country_code=in&render=true`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(scraperUrl, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`ScraperAPI ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// ── Extractors ───────────────────────────────────────────────────────────────

function extractAmazon(html) {
  return {
    name: first(html, [
      /<span[^>]+id="productTitle"[^>]*>\s*([\s\S]{5,300}?)\s*<\/span>/,
      /"title"\s*:\s*"([^"]{5,200})"/,
    ]),
    priceRaw: first(html, [
      /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
      /class="a-price-whole"[^>]*>([\d,]+)</,
      /corePriceDisplay[\s\S]{1,400}?class="a-offscreen"[^>]*>([\s\S]{1,30}?)</,
    ]),
    imageUrl: first(html, [
      /"hiRes"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
      /"large"\s*:\s*"(https:\/\/[^"]+\.jpg[^"]*)"/,
      /id="landingImage"[^>]+src="([^"]+)"/,
    ]),
  };
}

function extractFlipkart(html) {
  // Try JSON-LD structured data first — most reliable
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  let jsonName = null;
  let jsonPrice = null;
  let jsonImage = null;

  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const content = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
        const data = JSON.parse(content);
        const item = Array.isArray(data) ? data[0] : data;
        if (item?.name && item.name.length > 5) jsonName = item.name;
        if (item?.offers?.price) jsonPrice = String(item.offers.price);
        if (item?.image) jsonImage = Array.isArray(item.image) ? item.image[0] : item.image;
      } catch {}
    }
  }

  return {
    name: jsonName || first(html, [
      // Flipkart product title class patterns
      /class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]{10,300}?)<\/span>/,
      /class="[^"]*yhB1nd[^"]*"[^>]*>([\s\S]{10,300}?)<\/h1>/,
      // og:title is reliable — Flipkart sets it to the product name
      /<meta[^>]+property="og:title"[^>]+content="([^"]{10,200})"/,
      /<meta[^>]+name="title"[^>]+content="([^"]{10,200})"/,
      // Title tag — "Product Name - Buy Product Name Online..." format
      /<title>([^<]{10,150}?)(?:\s*[-|]\s*(?:Buy|Flipkart|Price|Online))/i,
    ]),
    priceRaw: jsonPrice || first(html, [
      /"selling_price"\s*:\s*"?([\d,]+)"/,
      /"finalPrice"\s*:\s*"?([\d,]+)"/,
      /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
      /class="[^"]*_30jeq3[^"]*"[^>]*>₹([\d,]+)/,
      /class="[^"]*Nx9bqj[^"]*"[^>]*>₹([\d,]+)/,
      /class="[^"]*_16Jk6d[^"]*"[^>]*>₹([\d,]+)/,
    ]),
    imageUrl: jsonImage || first(html, [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
      /"image"\s*:\s*"(https:\/\/[^"]+)"/,
    ]),
  };
}

function extractGeneric(html) {
  return {
    name: first(html, [
      /"name"\s*:\s*"([^"]{10,300})"/,
      /<meta[^>]+property="og:title"[^>]+content="([^"]{10,300})"/,
      /<title>([^<]{10,200})<\/title>/,
    ]),
    priceRaw: first(html, [
      /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
      /<meta[^>]+property="product:price:amount"[^>]+content="([\d.]+)"/,
      /<meta[^>]+itemprop="price"[^>]+content="([\d.]+)"/,
    ]),
    imageUrl: first(html, [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    ]),
  };
}

function parse(html, url) {
  let ex;
  if (url.includes("amazon."))           ex = extractAmazon(html);
  else if (url.includes("flipkart.com")) ex = extractFlipkart(html);
  else                                    ex = extractGeneric(html);

  // Generic fallback
  if (!isValidName(ex.name) || !cleanPrice(ex.priceRaw)) {
    const gen = extractGeneric(html);
    if (isValidName(gen.name))     ex.name     = isValidName(ex.name) ? ex.name : gen.name;
    if (!cleanPrice(ex.priceRaw))  ex.priceRaw = gen.priceRaw;
    ex.imageUrl = ex.imageUrl || gen.imageUrl;
  }

  return ex;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function scrapeProduct(url) {
  const isFlipkart = url.includes("flipkart.com");
  let html = null;
  const errors = [];

  // Strategy 1: Direct fetch (Amazon + others only)
  if (!isFlipkart) {
    try {
      html = await fetchDirect(url);
      const test = parse(html, url);
      // Reject if we got a bot-detection page
      if (!isValidName(test.name)) {
        html = null;
        errors.push("Direct: got bot-detection page");
      }
    } catch (e) {
      errors.push(`Direct: ${e.message}`);
    }
  }

  // Strategy 2: Zenrows without JS render (fast)
  if (!html) {
    try {
      html = await fetchViaZenrows(url, false);
      const test = parse(html, url);
      if (!isValidName(test.name)) {
        html = null;
        errors.push("Zenrows (no JS): got bot-detection page");
        // Try again WITH JS render for Flipkart
        if (isFlipkart) {
          try {
            html = await fetchViaZenrows(url, true);
          } catch (e2) {
            errors.push(`Zenrows (JS): ${e2.message}`);
            html = null;
          }
        }
      }
    } catch (e) {
      errors.push(`Zenrows: ${e.message}`);
    }
  }

  // Strategy 3: ScraperAPI
  if (!html || !isValidName(parse(html, url).name)) {
    try {
      html = await fetchViaScraperAPI(url);
    } catch (e) {
      errors.push(`ScraperAPI: ${e.message}`);
    }
  }

  if (!html) {
    throw new Error(
      isFlipkart
        ? "Flipkart is blocking requests right now. Please try again in a few minutes."
        : `Could not fetch the page. ${errors[0] || "Please try again."}`
    );
  }

  const ex    = parse(html, url);
  const price = cleanPrice(ex.priceRaw);

  if (!isValidName(ex.name) || !price) {
    throw new Error(
      "Could not extract product details. Make sure you're using a direct product page URL (not a search or category page)."
    );
  }

  return {
    name:          ex.name.replace(/\s+/g, " ").replace(/&amp;/g, "&").slice(0, 300),
    current_price: price,
    currency:      detectCurrency(url),
    image_url:     ex.imageUrl || null,
  };
}