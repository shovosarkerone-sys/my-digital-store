import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const BLOCKED_WORDS = [
  "about",
  "press",
  "terms",
  "privacy",
  "contact",
  "policy",
  "help",
  "login",
  "register",
  "review",
  "feedback",
  "legend",
  "seller",
  "rating",
  "dispute",
  "faq",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const bsvDirectUrl =
      page === 1
        ? "https://www.buysellvouchers.com/en/seller/info/BSV.Official.Store/"
        : `https://www.buysellvouchers.com/en/seller/info/BSV.Official.Store/?page=${page}`;

    let html = "";

    // ১. ডিরেক্ট ফেচ
    try {
      const directRes = await fetch(bsvDirectUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      if (directRes.ok) {
        const text = await directRes.text();
        if (!text.includes("Just a moment...") && text.includes("products/view")) {
          html = text;
        }
      }
    } catch {
      // Proxy fallback
    }

    // ২. প্রক্সি গেটওয়ে ফলব্যাক
    if (!html) {
      const googleProxy = `https://www-buysellvouchers-com.translate.goog/en/seller/info/BSV.Official.Store/${
        page > 1 ? `?page=${page}` : ""
      }?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en`;

      try {
        const proxyRes = await fetch(googleProxy, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          cache: "no-store",
        });

        if (proxyRes.ok) {
          const proxyText = await proxyRes.text();
          if (proxyText.includes("products/view")) {
            html = proxyText;
          }
        }
      } catch {
        // Fail silently
      }
    }

    if (!html) {
      return NextResponse.json({
        success: false,
        page,
        count: 0,
        message: `Cloudflare security blocked automated request for page ${page}.`,
      });
    }

    const $ = cheerio.load(html);
    const scrapedProducts: Array<{
      title: string;
      category: string;
      price: number;
      image_url: string;
      source_url: string;
    }> = [];

    // ৩. প্রোডাক্ট কার্ড পার্সিং
    $("a[href*='/products/view/']").each((_, el) => {
      let href = $(el).attr("href") || "";
      if (!href) return;

      href = href.replace(/https?:\/\/www-buysellvouchers-com\.translate\.goog/i, "https://www.buysellvouchers.com");
      if (!href.startsWith("http")) {
        href = `https://www.buysellvouchers.com${href.startsWith("/") ? "" : "/"}${href}`;
      }

      const card = $(el).closest("div, tr, li");
      const title =
        card.find("h3, h4, .title, .product-title, .name").first().text().trim() ||
        $(el).text().trim();

      if (!title || title.length < 3 || title.length > 90) return;

      const isBlocked = BLOCKED_WORDS.some((word) => title.toLowerCase().includes(word));
      if (isBlocked) return;

      const cardText = card.text();
      const dollarMatches = cardText.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/g);
      if (!dollarMatches || dollarMatches.length === 0) return;

      const numericValues = dollarMatches
        .map((d) => parseFloat(d.replace(/[^0-9.]/g, "")))
        .filter((n) => !isNaN(n) && n >= 0.05 && n <= 2000);

      if (numericValues.length === 0) return;
      const basePrice = Math.min(...numericValues);

      let img = $(el).find("img").attr("src") || card.find("img").attr("src") || "";
      if (img) {
        img = img.replace(/https?:\/\/www-buysellvouchers-com\.translate\.goog/i, "https://www.buysellvouchers.com");
        if (!img.startsWith("http")) {
          img = `https://www.buysellvouchers.com${img.startsWith("/") ? "" : "/"}${img}`;
        }
      }

      let category = "Gift Cards";
      const lower = title.toLowerCase();
      if (lower.includes("amazon")) category = "Amazon";
      else if (lower.includes("apple") || lower.includes("itunes")) category = "Apple";
      else if (lower.includes("razer")) category = "Razer Gold";
      else if (lower.includes("nintendo")) category = "Nintendo";
      else if (lower.includes("playstation") || lower.includes("psn")) category = "PlayStation";
      else if (lower.includes("pubg")) category = "PUBG";
      else if (lower.includes("free fire")) category = "Free Fire";
      else if (lower.includes("steam")) category = "Steam";
      else if (lower.includes("xbox")) category = "XBOX";
      else if (lower.includes("google play")) category = "Google Play";
      else if (lower.includes("netflix")) category = "Netflix";
      else if (lower.includes("roblox")) category = "Roblox";
      else if (lower.includes("discord")) category = "Discord";
      else {
        const firstWord = title.split(" ")[0];
        if (firstWord && firstWord.length > 2) category = firstWord;
      }

      const finalPrice = Math.round(basePrice * 1.05 * 100) / 100;
      const cleanUrl = href.split("?")[0];

      if (!scrapedProducts.some((p) => p.title === title || p.source_url === cleanUrl)) {
        scrapedProducts.push({
          title,
          category,
          price: finalPrice,
          image_url: img,
          source_url: cleanUrl,
        });
      }
    });

    if (scrapedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        page,
        count: 0,
        message: `No products found on page ${page}`,
      });
    }

    // ৪. ক্যাটাগরি তৈরি
    const uniqueCategories = Array.from(new Set(scrapedProducts.map((p) => p.category)));
    for (const catName of uniqueCategories) {
      const { data: existingCat } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", catName)
        .maybeSingle();

      if (!existingCat) {
        const catImg = scrapedProducts.find((p) => p.category === catName)?.image_url || null;
        await supabase.from("categories").insert([
          {
            name: catName,
            image_url: catImg,
          },
        ]);
      }
    }

    // ৫. প্রোডাক্ট ডাটাবেজ আপডেট (TypeScript Type-Safe Fix)
    const { data: existingBsvProducts } = await supabase
      .from("products")
      .select("id, source_url, price, title")
      .not("source_url", "is", null);

    const existingMap = new Map<string, { id: number; source_url: string; price: number; title: string }>(
      (existingBsvProducts || []).map((p) => [p.source_url, p])
    );

    let addedCount = 0;
    let updatedCount = 0;

    for (const item of scrapedProducts) {
      const existing = existingMap.get(item.source_url);

      // TypeScript TS18048 ফিক্স: existing আছে কি না নিশ্চিত করে কোড রান করানো
      if (existing && existing.id) {
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
        await supabase.from("products").insert([
          {
            title: item.title,
            category: item.category,
            price: item.price,
            image_url: item.image_url || null,
            description: "Instant digital key delivery upon payment confirmation. Official Store fulfillment.",
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

    return NextResponse.json({
      success: true,
      page,
      count: scrapedProducts.length,
      added: addedCount,
      updated: updatedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}