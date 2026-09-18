import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

interface ScrapedProduct {
  title: string;
  category: string;
  price: number;
  image_url: string;
  source_url: string;
}

export async function GET() {
  try {
    const allScrapedProducts: ScrapedProduct[] = [];
    const maxPages = 6; // পেজ ১ থেকে পেজ ৬ পর্যন্ত সব প্রোডাক্ট স্ক্যান করবে

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl =
        page === 1
          ? "https://www-buysellvouchers-com.translate.goog/en/seller/info/BSV.Official.Store/?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en"
          : `https://www-buysellvouchers-com.translate.goog/en/seller/info/BSV.Official.Store/?page=${page}&_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en`;

      let html = "";
      try {
        const response = await fetch(pageUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          cache: "no-store",
        });

        if (response.ok) {
          html = await response.text();
        }
      } catch {
        continue;
      }

      if (!html) continue;

      const $ = cheerio.load(html);
      let pageProductCount = 0;

      // পেজের প্রতিটি প্রোডাক্ট স্ক্যান করা
      $("tr, .item, .product-item, .card, div[class*='product']").each((_, el) => {
        const container = $(el);

        // ১. টাইটেল
        const linkElem = container.find("a[href*='/products/'], a[href*='view'], a").first();
        const title =
          container.find(".title, h3, h4, .name, strong").first().text().trim() ||
          linkElem.text().trim() ||
          linkElem.attr("title");

        // ২. আসল লাইভ প্রাইস
        const priceText =
          container.find(".price, .cost, .val, td:contains('$')").first().text().trim() ||
          container.text();
        const priceMatch = priceText.match(/\$?\s*([0-9]+(?:\.[0-9]+)?)/);

        // ৩. BSV-এর আসল প্রোডাক্ট ইমেজ (Original Photo)
        let img =
          container.find("img").attr("src") ||
          linkElem.find("img").attr("src") ||
          "";

        if (img && !img.startsWith("http")) {
          img = `https://www.buysellvouchers.com${img.startsWith("/") ? "" : "/"}${img}`;
        }

        // ৪. সোর্স লিংক
        let href = linkElem.attr("href") || "";
        if (href && !href.startsWith("http")) {
          href = `https://www.buysellvouchers.com${href.startsWith("/") ? "" : "/"}${href}`;
        }

        // ৫. স্বয়ংক্রিয় ক্যাটাগরি
        let category = "Gift Cards";
        if (title) {
          const lower = title.toLowerCase();
          if (lower.includes("steam")) category = "Steam";
          else if (lower.includes("pubg")) category = "PUBG";
          else if (lower.includes("free fire")) category = "Free Fire";
          else if (lower.includes("razer")) category = "Razer Gold";
          else if (lower.includes("apple") || lower.includes("itunes")) category = "Apple";
          else if (lower.includes("playstation") || lower.includes("psn")) category = "PlayStation";
          else if (lower.includes("xbox")) category = "XBOX";
          else if (lower.includes("amazon")) category = "Amazon";
          else if (lower.includes("google play")) category = "Google Play";
          else if (lower.includes("netflix")) category = "Netflix";
          else if (lower.includes("discord")) category = "Discord";
          else if (lower.includes("roblox")) category = "Roblox";
        }

        if (title && priceMatch && parseFloat(priceMatch[1]) > 0) {
          const numericPrice = parseFloat(priceMatch[1]);
          // তাদের মূল দামের সাথে ৫% বৃদ্ধি
          const finalPrice = Math.round(numericPrice * 1.05 * 100) / 100;
          const sourceId = href || `bsv_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

          // ডুপ্লিকেট বাদ দিয়ে যোগ করা
          if (!allScrapedProducts.some((p) => p.title === title || p.source_url === sourceId)) {
            allScrapedProducts.push({
              title,
              category,
              price: finalPrice,
              image_url: img,
              source_url: sourceId,
            });
            pageProductCount++;
          }
        }
      });

      // পেজে আর কোনো প্রোডাক্ট না থাকলে লুপ ব্রেক করবে
      if (pageProductCount === 0 && page > 1) {
        break;
      }
    }

    if (allScrapedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No live products found across pages.",
      });
    }

    // স্বয়ংক্রিয় ক্যাটাগরি ডাটাবেজে তৈরি
    const uniqueCategories = Array.from(new Set(allScrapedProducts.map((p) => p.category)));
    for (const catName of uniqueCategories) {
      const { data: existingCat } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", catName)
        .maybeSingle();

      if (!existingCat) {
        const catImg = allScrapedProducts.find((p) => p.category === catName)?.image_url || null;
        await supabase.from("categories").insert([
          {
            name: catName,
            image_url: catImg,
          },
        ]);
      }
    }

    // ডাটাবেজ থেকে পূর্বের সমস্ত BSV প্রোডাক্ট লোড করা
    const { data: existingBsvProducts } = await supabase
      .from("products")
      .select("id, source_url, price, title")
      .not("source_url", "is", null);

    const existingMap = new Map((existingBsvProducts || []).map((p) => [p.source_url, p]));
    const currentScrapedUrls = new Set(allScrapedProducts.map((p) => p.source_url));

    let addedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // TypeScript TS18048 এরর পুরোপুরি ফিক্স করে আপডেট বা ইনসার্ট করা
    for (const item of allScrapedProducts) {
      const existing = existingMap.get(item.source_url);

      if (existing) {
        // দাম বা টাইটেল আপডেট করা
        if (existing.price !== item.price || existing.title !== item.title) {
          await supabase
            .from("products")
            .update({
              price: item.price,
              title: item.title,
              category: item.category,
              ...(item.image_url ? { image_url: item.image_url } : {}),
            })
            .eq("id", existing.id);
          updatedCount++;
        }
      } else {
        // নতুন প্রোডাক্ট যোগ করা
        await supabase.from("products").insert([
          {
            title: item.title,
            category: item.category,
            price: item.price,
            image_url: item.image_url || null,
            description: "Instant digital code delivery upon payment confirmation.",
            seller_name: "Official Store",
            source_url: item.source_url,
            views: 0,
            sold_count: 0,
            voucher_codes: "AUTO_DELIVERY_KEY_READY",
          },
        ]);
        addedCount++;
      }
    }

    // তাদের সাইট থেকে প্রোডাক্ট মুছে গেলে তোমার সাইট থেকেও ডিলিট হওয়া
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
        totalScraped: allScrapedProducts.length,
        categoriesCreated: uniqueCategories.length,
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}