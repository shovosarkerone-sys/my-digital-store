"use client";

import { useState, useRef, useEffect } from "react";

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Hello! I am your ShovoStore AI Assistant. Ask me anything about vouchers, instant delivery, or buyer escrow protection!",
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
          text: data.reply || "For urgent queries, please email shovosarkerone@gmail.com.",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          text: "Support desk is reachable anytime at shovosarkerone@gmail.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* চ্যাটবট উইন্ডো */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* হেডার */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-sky-500/30">
                AI
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>ShovoStore Support AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h3>
                <span className="text-[10px] text-slate-400">Instant Automated Answers</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          {/* মেসেজ তালিকা */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-xs rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-sky-500 text-white rounded-br-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 text-sky-400 text-xs rounded-2xl rounded-bl-none p-3 font-mono">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* কুইক সাজেশনের চিপস */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend("How does instant delivery work?")}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 px-2 py-1 rounded-lg shrink-0 transition"
            >
              ⚡ Instant Delivery?
            </button>
            <button
              onClick={() => handleSend("What is escrow protection?")}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 px-2 py-1 rounded-lg shrink-0 transition"
            >
              🛡️ Escrow Hold?
            </button>
            <button
              onClick={() => handleSend("How do I contact support?")}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 px-2 py-1 rounded-lg shrink-0 transition"
            >
              📩 Email Support
            </button>
          </div>

          {/* ইনপুট বক্স */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. delivery, escrow)..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold flex items-center justify-center text-xs transition cursor-pointer shrink-0"
            >
              →
            </button>
          </form>
        </div>
      )}

      {/* ভাসমান টগল বাটন */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-950 flex items-center justify-center font-black transition transform active:scale-95 cursor-pointer relative"
        aria-label="Open AI Chatbot"
      >
        {isOpen ? (
          <span className="text-base font-bold">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full"></span>
      </button>
    </div>
  );
}