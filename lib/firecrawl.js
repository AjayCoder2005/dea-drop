import FirecrawlApp from "@mendable/firecrawl-js";

// ✅ Do NOT instantiate at module level — env vars are undefined at build time.
// Create the client lazily inside the function instead.

export async function scrapeProduct(url) {
  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["extract"],
      timeout: 8000,
      extract: {
        prompt:
          "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, INR, EUR, GBP, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available.",
        schema: {
          type: "object",
          properties: {
            productName:     { type: "string" },
            currentPrice:    { type: "number" },
            currencyCode:    { type: "string" },
            productImageUrl: { type: "string" },
          },
          required: ["productName", "currentPrice"],
        },
      },
    });

    const extracted = result.extract;

    if (!extracted || !extracted.productName || !extracted.currentPrice) {
      throw new Error("Could not extract product details.");
    }

    return {
      name:          extracted.productName,
      current_price: parseFloat(extracted.currentPrice),
      currency:      extracted.currencyCode || "INR",
      image_url:     extracted.productImageUrl || null,
    };
  } catch (error) {
    console.error("Firecrawl scrape error:", error);
    throw new Error(`Failed to scrape: ${error.message}`);
  }
}