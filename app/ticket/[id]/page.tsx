"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: "user" | "admin";
  sender_name: string;
  message: string;
  created_at: string;
}

export default function TicketChatPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id;

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setCurrentUser(user);

      if (!ticketId) return;

      // টিকিট ডাটা লোড
      const { data: tData } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();

      if (tData) setTicket(tData);

      // মেসেজ হিস্ট্রি লোড
      const { data: mData } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (mData) setMessages(mData);
      setLoading(false);
    }

    initChat();

    // রিয়েলটাইম মেসেজ সাবস্ক্রিপশন
    const channel = supabase
      .channel(`ticket_chat_${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !ticket || ticket.status === "resolved") return;

    setSending(true);
    const content = typedMessage.trim();
    setTypedMessage("");

    try {
      const { error } = await supabase.from("support_messages").insert([
        {
          ticket_id: ticket.id,
          sender_id: currentUser?.id,
          sender_type: "user",
          sender_name: currentUser?.user_metadata?.full_name || ticket.user_name || "User",
          message: content,
        },
      ]);

      if (error) throw error;

      // ব্যবহারকারী মেসেজ পাঠালে টিকিট স্ট্যাটাস আবার 'open' করা
      if (ticket.status !== "open") {
        await supabase
          .from("support_tickets")
          .update({ status: "open" })
          .eq("id", ticket.id);
        setTicket((prev: any) => ({ ...prev, status: "open" }));
      }
    } catch (err: any) {
      alert(`Message delivery failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ticket Not Found</h2>
        <Link href="/dashboard" className="text-xs text-sky-500 underline mt-2">← Back to Dashboard</Link>
      </div>
    );
  }

  const isResolved = ticket.status === "resolved";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-sky-500 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[200px] sm:max-w-md truncate">
              #{ticket.id} - {ticket.subject}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isResolved 
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>
      </header>

      {/* Chat Thread Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
          {/* শুরুর সমস্যা বিবরণী (Original Ticket Body) */}
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[70%] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                {ticket.user_name || "You"} (Ticket Initiated)
              </span>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
              <span className="text-[9px] text-slate-400 block text-right font-mono">
                {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* থ্রেডের বাকি সব মেসেজ */}
          {messages.map((m) => {
            const isAdmin = m.sender_type === "admin";
            return (
              <div key={m.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAdmin
                      ? "bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 rounded-bl-none shadow-sm"
                      : "bg-sky-500 text-white rounded-br-none shadow-md"
                  }`}
                >
                  <span className={`text-[10px] font-bold block mb-1 ${isAdmin ? "text-sky-600 dark:text-sky-400" : "text-sky-100"}`}>
                    {isAdmin ? "🛡️ Official Support Desk" : m.sender_name || "You"}
                  </span>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <span className={`text-[9px] block text-right font-mono mt-1 ${isAdmin ? "text-sky-700/60 dark:text-sky-300/60" : "text-sky-100/70"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* নিচের ইনপুট বার / ক্লোজড নোটিশ */}
        <div className="pt-2">
          {isResolved ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                🔒 This ticket has been marked as Resolved
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You cannot reply to this thread anymore. If you need further help, please create a new support ticket.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-lg">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type your message to support..."
                className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !typedMessage.trim()}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}