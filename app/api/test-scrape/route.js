import { NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/firecrawl";

export async function GET() {
  try {
    const result = await scrapeProduct(
      "https://www.amazon.in/dp/B0BF4YBLPX"
    );
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}