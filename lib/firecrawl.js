import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWLER_API_KEY,
});

export async function scrapeProduct(url) {
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["extract"],
      extract: {
        prompt:
          "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, INR, EUR, GBP, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available.",
        schema: {
          type: "object",
          properties: {
            productName:      { type: "string" },
            currentPrice:     { type: "number" },
            currencyCode:     { type: "string" },
            productImageUrl:  { type: "string" },
          },
          required: ["productName", "currentPrice"],
        },
      },
    });

    const extracted = result.extract;

    if (!extracted || !extracted.productName || !extracted.currentPrice) {
      throw new Error("Could not extract product details from this URL. Try a direct product page.");
    }

    // ── Normalize to standard field names used across the app ────────────
    return {
      name:          extracted.productName,
      current_price: parseFloat(extracted.currentPrice),
      currency:      extracted.currencyCode || "INR",
      image_url:     extracted.productImageUrl || null,
    };
  } catch (error) {
    console.error("Firecrawl scrape error:", error);
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}