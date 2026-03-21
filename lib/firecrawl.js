// Smart scraper with proxy fallback for Flipkart 403 blocks

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
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

// ── Fetch strategies ────────────────────────────────────────────────────────

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

// ✅ Flipkart mobile site — much less anti-bot protection than desktop
async function fetchFlipkartMobile(url) {
  const mobileUrl = url.replace("www.flipkart.com", "m.flipkart.com");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(mobileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
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

// ✅ Free proxy fallback — works when direct fetch is blocked
async function fetchViaProxy(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(proxyUrl, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    const json = await res.json();
    if (!json.contents) throw new Error("Proxy returned empty content");
    return json.contents;
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
  return {
    name: first(html, [
      /<span[^>]+class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]{5,300}?)<\/span>/,
      /<h1[^>]+class="[^"]*yhB1nd[^"]*"[^>]*>([\s\S]{5,300}?)<\/h1>/,
      /"name"\s*:\s*"([^"]{5,200})"/,
      /<meta[^>]+property="og:title"[^>]+content="([^"]{5,200})"/,
      /<title>([^<]{5,150}?) - Buy/,
      /<title>([^<]{5,150}?)<\/title>/,
    ]),
    priceRaw: first(html, [
      /"price"\s*:\s*"?([\d,]+\.?\d*)"/,
      /"selling_price"\s*:\s*([\d]+)/,
      /"finalPrice"\s*:\s*([\d]+)/,
      /class="[^"]*_30jeq3[^"]*"[^>]*>₹([\d,]+)/,
      /class="[^"]*Nx9bqj[^"]*"[^>]*>₹([\d,]+)/,
      /₹\s*([\d,]+)/,
    ]),
    imageUrl: first(html, [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
      /"image"\s*:\s*"(https:\/\/[^"]+)"/,
    ]),
  };
}

function extractGeneric(html) {
  return {
    name: first(html, [
      /"name"\s*:\s*"([^"]{5,300})"/,
      /<meta[^>]+property="og:title"[^>]+content="([^"]{5,300})"/,
      /<title>([^<]{5,200})<\/title>/,
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
  if (!ex.name || !cleanPrice(ex.priceRaw)) {
    const gen = extractGeneric(html);
    ex.name     = ex.name     || gen.name;
    ex.priceRaw = ex.priceRaw || gen.priceRaw;
    ex.imageUrl = ex.imageUrl || gen.imageUrl;
  }

  return ex;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function scrapeProduct(url) {
  const isFlipkart = url.includes("flipkart.com");
  let html = null;
  let lastError = null;

  // Strategy 1: Mobile site (Flipkart only — bypasses most blocks)
  if (isFlipkart) {
    try {
      console.log("Trying Flipkart mobile...");
      html = await fetchFlipkartMobile(url);
    } catch (e) {
      console.log("Mobile failed:", e.message);
      lastError = e;
    }
  }

  // Strategy 2: Direct fetch
  if (!html) {
    try {
      console.log("Trying direct fetch...");
      html = await fetchDirect(url);
    } catch (e) {
      console.log("Direct failed:", e.message);
      lastError = e;
    }
  }

  // Strategy 3: Free proxy (last resort)
  if (!html) {
    try {
      console.log("Trying proxy...");
      html = await fetchViaProxy(url);
    } catch (e) {
      console.log("Proxy failed:", e.message);
      lastError = e;
    }
  }

  if (!html) {
    throw new Error(
      `Could not fetch the page. ${isFlipkart ? "Flipkart is blocking automated requests. Try a shorter URL without tracking parameters." : lastError?.message || "Please try again."}`
    );
  }

  const ex    = parse(html, url);
  const price = cleanPrice(ex.priceRaw);

  if (!ex.name || !price) {
    throw new Error("Could not extract product details. Make sure you're using a direct product page URL.");
  }

  return {
    name:          ex.name.replace(/\s+/g, " ").replace(/&amp;/g, "&").slice(0, 300),
    current_price: price,
    currency:      detectCurrency(url),
    image_url:     ex.imageUrl || null,
  };
}