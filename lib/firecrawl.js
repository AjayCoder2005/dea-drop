import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWLER_API_KEY,
});

export async function scrapeProduct(url) {
  try {
    // ✅ Add timeout of 8 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scrape timeout")), 8000)
    );

    const scrapePromise = firecrawl.scrapeUrl(url, {
      formats: ["extract"],
      extract: {
        prompt: "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, INR, EUR, GBP) as 'currencyCode', and product image URL as 'productImageUrl'.",
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

    const result = await Promise.race([scrapePromise, timeoutPromise]);
    const extracted = result.extract;

    if (!extracted || !extracted.productName || !extracted.currentPrice) {
      throw new Error("Could not extract product details");
    }

    return {
      name:          extracted.productName,
      current_price: parseFloat(extracted.currentPrice),
      currency:      extracted.currencyCode || "INR",
      image_url:     extracted.productImageUrl || null,
    };
  } catch (error) {
    console.error("Firecrawl error:", error.message);
    throw new Error(`Scrape failed: ${error.message}`);
  }
}