"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function LiveSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Hello! Welcome to Inskeys. How can I assist you today with digital licenses, order fulfillment, or account queries?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages = [...messages, { role: "user" as const, text: query }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: "ai",
          text:
            data.reply ||
            "Our support desk is always active. If you need further assistance, please contact contact@inskeys.com.",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          text:
            "We could not reach the support service at this moment. Please email our official desk at contact@inskeys.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Support Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200 transition-colors">
          
          {/* Header with Transparent Inskeys Logo */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0">
                <Image
                  src="/icon.png"
                  alt="Inskeys Live Support"
                  width={34}
                  height={34}
                  className="w-8 h-8 object-contain bg-transparent"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Inskeys Live Support</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Official Customer Concierge</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          {/* Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-xs rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-sky-500 text-white rounded-br-none shadow-xs"
                      : "bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 text-xs rounded-2xl rounded-bl-none p-3 font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping"></span>
                  Connecting to agent...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend("How does order delivery work on Inskeys?")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg shrink-0 transition cursor-pointer shadow-xs"
            >
              ⚡ Delivery Options
            </button>
            <button
              onClick={() => handleSend("How does 36-Hour Buyer Protection work?")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg shrink-0 transition cursor-pointer shadow-xs"
            >
              🛡️ 36h Buyer Protection
            </button>
            <button
              onClick={() => handleSend("What is your official contact email?")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg shrink-0 transition cursor-pointer shadow-xs"
            >
              📩 Official Desk
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about digital keys, orders, or support..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold flex items-center justify-center text-xs transition cursor-pointer shrink-0 shadow-xs"
            >
              →
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-500/20 dark:shadow-sky-950 flex items-center justify-center font-black transition transform active:scale-95 cursor-pointer relative"
        aria-label="Open Live Support"
      >
        {isOpen ? (
          <span className="text-base font-bold">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 dark:bg-emerald-400 border-2 border-white dark:border-slate-950 rounded-full"></span>
      </button>
    </div>
  );
}