"use client";

import { useState } from "react";

export default function CryptoPayButton({
  productId,
  price,
}: {
  productId: string | number;
  price: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    const email = window.prompt("Enter your email address to receive order delivery:");
    if (!email || !email.includes("@")) {
      alert("A valid email is required to receive your product.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/checkout/cryptomus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerEmail: email }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Payment session failed to load");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong connecting to gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 text-center text-sm shadow-lg shadow-sky-950 cursor-pointer"
    >
      <span>⚡ {loading ? "Creating Invoice..." : `Pay with Crypto / Binance ($${price})`}</span>
    </button>
  );
}