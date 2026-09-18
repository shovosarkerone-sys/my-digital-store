import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const targetUrl = "https://www.buysellvouchers.com/en/seller/info/BSV.Official.Store/";

    // ১. BuySellVouchers পেজ ফেচ করা
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch BSV page" }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const scrapedProducts: Array<{
      title: string;
      category: string;
      price: number;
      image_url: string;
      source_url: string;
    }> = [];

    // ২. পেজের প্রতিটি প্রোডাক্ট কার্ড স্ক্যান করা
    $(".seller-product-item, .product-item, .item").each((_, el) => {
      const title = $(el).find(".title, .product-title, h3, a.name").first().text().trim();
      const rawPriceText = $(el).find(".price, .cost, .val").first().text().trim();
      const rawImg = $(el).find("img").first().attr("src");
      const relativeLink = $(el).find("a").first().attr("href");

      // ক্লিন প্রাইস সংখ্যায় কনভার্ট
      const numericPrice = parseFloat(rawPriceText.replace(/[^0-9.]/g, ""));

      if (title && numericPrice && !isNaN(numericPrice)) {
        // তাদের মূল দামের সাথে ৫% বৃদ্ধি
        const finalPrice = Math.round(numericPrice * 1.05 * 100) / 100;

        let fullImgUrl = rawImg || "";
        if (rawImg && !rawImg.startsWith("http")) {
          fullImgUrl = `https://www.buysellvouchers.com${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;
        }

        const sourceId = relativeLink || title;

        scrapedProducts.push({
          title,
          category: "Gift Cards",
          price: finalPrice,
          image_url: fullImgUrl,
          source_url: sourceId,
        });
      }
    });

    // কোনো প্রোডাক্ট না পাওয়া গেলে অ্যালার্ট
    if (scrapedProducts.length === 0) {
      return NextResponse.json({
        message: "No live items detected or structure changed. Check scraper selector.",
      });
    }

    // ৩. ডাটাবেজ থেকে পূর্বের সমস্ত BSV প্রোডাক্ট লোড করা
    const { data: existingBsvProducts } = await supabase
      .from("products")
      .select("id, source_url, price, title")
      .not("source_url", "is", null);

    const existingMap = new Map((existingBsvProducts || []).map((p) => [p.source_url, p]));
    const currentScrapedUrls = new Set(scrapedProducts.map((p) => p.source_url));

    let addedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // ৪. নতুন প্রোডাক্ট অ্যাড করা এবং দাম আপডেট করা (+৫% সহ)
    for (const item of scrapedProducts) {
      if (existingMap.has(item.source_url)) {
        const existing = existingMap.get(item.source_url);
        // দাম বা নাম পরিবর্তন হলে আপডেট হবে
        if (existing.price !== item.price || existing.title !== item.title) {
          await supabase
            .from("products")
            .update({
              price: item.price,
              title: item.title,
              image_url: item.image_url,
            })
            .eq("id", existing.id);
          updatedCount++;
        }
      } else {
        // নতুন প্রোডাক্ট সরাসরি Official Store হিসেবে যুক্ত করা
        await supabase.from("products").insert([
          {
            title: item.title,
            category: item.category,
            price: item.price,
            image_url: item.image_url,
            description: "Instant delivery upon payment confirmation. Powered by BSV Official.",
            seller_name: "Official Store",
            source_url: item.source_url,
            views: 0,
            sold_count: 0,
            voucher_codes: "AUTO_DELIVERY_KEY",
          },
        ]);
        addedCount++;
      }
    }

    // ৫. তাদের সাইট থেকে যেসব প্রোডাক্ট স্টক আউট বা মুছে গেছে, সেগুলো তোমার সাইট থেকেও স্বয়ংক্রিয়ভাবে মুছে ফেলা
    if (existingBsvProducts && existingBsvProducts.length > 0) {
      for (const oldProd of existingBsvProducts) {
        if (!currentScrapedUrls.has(oldProd.source_url)) {
          await supabase.from("products").delete().eq("id", oldProd.id);
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalScraped: scrapedProducts.length,
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}