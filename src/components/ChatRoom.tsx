import { useState, useRef, useEffect, useCallback, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { useChat } from "../hooks/useChat";
import type { ChatMessage, ParticipantRole } from "../types/chat";
import { colors, radii, fontSizes } from "../styles/tokens";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function Identicon({ address, size = 28, avatarUrl }: { address: string; size?: number; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  const hash = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [210, 160, 40, 280, 320, 180];
  const hue = hues[hash % hues.length];
  const initials = address.startsWith("0x")
    ? address.slice(2, 4).toUpperCase()
    : address.slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue}, 55%, 42%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
        fontFamily: "monospace",
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: ParticipantRole }) {
  const styles: Record<ParticipantRole, { label: string; bg: string; color: string; border: string }> = {
    poster: { label: "POSTER", bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "rgba(234,179,8,0.35)" },
    worker: { label: "WORKER", bg: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "rgba(59,130,246,0.35)" },
    unknown:{ label: "USER",   bg: "rgba(113,113,122,0.1)", color: "#a1a1aa", border: "rgba(113,113,122,0.2)" },
  };
  const s = styles[role];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 4,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        letterSpacing: "0.3px",
      }}
    >
      {s.label}
    </span>
  );
}

function SystemMessage({ content }: { content: string }) {
  const cs = content.toLowerCase();
  const isJobComplete = cs.includes("completed") || cs.includes("complete");
  const isPayment = cs.includes("payment") || cs.includes("released");

  const variant = isJobComplete
    ? { icon: "\u2705", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#34d399", label: "Job completed" }
    : isPayment
    ? { icon: "\u{1F4B0}", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", color: "#fbbf24", label: "Payment" }
    : null;

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <span
        style={{
          fontSize: fontSizes.xs,
          color: "#71717a",
          background: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 999,
          padding: "4px 12px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {variant?.icon && <span>{variant.icon}</span>}
        {content}
      </span>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === now.toDateString()) {
    label = "Today";
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#27272a" }} />
      <span style={{ fontSize: 10, color: "#52525b", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#27272a" }} />
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", padding: "10px 12px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#a1a1aa",
            animation: "blink 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({
  msg, isSelf, senderRole, avatarMap,
}: {
  msg: ChatMessage; isSelf: boolean; senderRole: ParticipantRole; avatarMap: Record<string, string>;
}) {
  const bubbleBg = isSelf ? "rgba(247,206,62,0.1)" : colors.bgCard;
  const bubbleBorder = isSelf ? "rgba(247,206,62,0.2)" : colors.border;

  const shortAddr = `${msg.sender_address.slice(0, 6)}…${msg.sender_address.slice(-4)}`;
  const timeStr = new Date(msg.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  const hasAttachment = !!msg.attachment_url;
  const isImage = msg.attachment_type?.startsWith("image/");

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isSelf ? "row-reverse" : "row" }}>
      {!isSelf && <Identicon address={msg.sender_address} size={26} avatarUrl={avatarMap[msg.sender_address.toLowerCase()]} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "72%", alignItems: isSelf ? "flex-end" : "flex-start" }}>
        {!isSelf && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
            <span style={{ fontSize: fontSizes.xs, color: colors.textDim, fontFamily: "monospace" }}>{shortAddr}</span>
            <RoleBadge role={senderRole} />
          </div>
        )}
        {msg.reply_preview && (
          <div
            style={{
              fontSize: 10,
              color: "#71717a",
              padding: "3px 8px",
              borderLeft: "2px solid #52525b",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "4px 4px 4px 4px",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {msg.reply_preview}
          </div>
        )}
        <div
          style={{
            padding: "8px 12px",
            border: `1px solid ${bubbleBorder}`,
            background: bubbleBg,
            color: colors.textPrimary,
            fontSize: fontSizes.base,
            lineHeight: 1.5,
            borderRadius: isSelf ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            wordBreak: "break-word",
          }}
        >
          {hasAttachment && isImage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <img
                src={msg.attachment_url}
                alt={msg.attachment_name || "attachment"}
                style={{ maxWidth: 240, maxHeight: 200, borderRadius: 8, cursor: "pointer" }}
                onClick={() => window.open(msg.attachment_url, "_blank")}
              />
              {msg.content && msg.content !== `[Image: ${msg.attachment_name}]` && (
                <span>{msg.content}</span>
              )}
            </div>
          ) : hasAttachment ? (
            <a
              href={msg.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#60a5fa",
                textDecoration: "underline",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {msg.attachment_name || "Attachment"}
            </a>
          ) : (
            msg.content
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 4px" }}>
          <span style={{ fontSize: fontSizes.xs, color: colors.textDim }}>{timeStr}</span>
          {isSelf && (
            <span style={{ fontSize: 10, color: msg.read_at ? "#34d399" : "#52525b" }}>
              {msg.read_at ? "\u2713\u2713" : msg.id.startsWith("opt-") ? "\u23F3" : "\u2713"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatRoomProps {
  jobId: string;
  jobTitle?: string;
  walletAddress: string;
  posterAddress?: string;
  workerAddress?: string;
  hasClaimed?: boolean;
  mode?: "panel" | "floating";
  className?: string;
  onBack?: () => void;
  hideHeader?: boolean;
}

export function ChatRoom({
  jobId,
  jobTitle = "Compute Job",
  walletAddress,
  posterAddress,
  workerAddress,
  hasClaimed,
  mode = "panel",
  className = "",
  onBack,
  hideHeader = false,
}: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMsgCount = useRef(-1);
  const inputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const {
    room, messages, loading, error, myRole,
    typingUsers, onlineUsers, sendMessage, uploadAttachment, broadcastTyping,
    requestClose, approveClose, rejectClose,
  } = useChat({ jobId, jobTitle, walletAddress, posterAddress, workerAddress, hasClaimed });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    if (mode === "floating" && !isOpen && prevMsgCount.current !== -1 && messages.length > prevMsgCount.current) {
      setUnread((u) => u + (messages.length - prevMsgCount.current));
    }
    prevMsgCount.current = messages.length;
  }, [messages, mode, isOpen, userScrolledUp]);

  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (!room || !SUPABASE_URL) return;
    const addresses = [...new Set(room.participants.map((a) => a.toLowerCase()))];
    const cached = localStorage.getItem("zkcompute_profiles_cache");
    let cachedMap: Record<string, { avatarUrl?: string }> = {};
    try { if (cached) cachedMap = JSON.parse(cached); } catch {}
    const result: Record<string, string> = {};
    const missing: string[] = [];
    for (const a of addresses) {
      const p = cachedMap[a];
      if (p?.avatarUrl) result[a] = p.avatarUrl;
      else missing.push(a);
    }
    if (missing.length > 0) {
      fetch(`${SUPABASE_URL}/rest/v1/profiles?worker=in.(${missing.map(a => a.toLowerCase()).join(",")})&select=worker,avatar_url`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            for (const row of data) {
              if (row.avatar_url) result[row.worker.toLowerCase()] = row.avatar_url;
            }
            setAvatarMap((prev) => ({ ...prev, ...result }));
          }
        })
        .catch(() => {});
    } else {
      setAvatarMap((prev) => ({ ...prev, ...result }));
    }
  }, [room?.id]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
    setUserScrolledUp(distFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    setUserScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || !walletAddress || !room) return;
    setInput("");
    await sendMessage(text, replyTo?.id, replyTo ? replyTo.content.slice(0, 100) : undefined, pendingFile || undefined);
    setReplyTo(null);
    setPendingFile(null);
    setUserScrolledUp(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyTo) {
      setReplyTo(null);
    }
  };

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (value.trim()) {
      broadcastTyping();
      if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = setTimeout(() => {
        broadcastTyping();
      }, 3000);
    }
  }, [broadcastTyping]);

  const handleContextMenu = (e: ReactMouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    if (msg.is_system || msg.sender_address === "SYSTEM") return;
    setContextMenu({ msg, x: e.clientX, y: e.clientY });
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }
    setUploading(true);
    const url = await uploadAttachment(file);
    if (url) {
      setPendingFile({ url, type: file.type, name: file.name });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resolveRole = (senderAddr: string): ParticipantRole => {
    if (senderAddr === "SYSTEM") return "unknown";
    if (senderAddr.toLowerCase() === walletAddress?.toLowerCase()) return myRole;
    if (senderAddr.toLowerCase() === posterAddress?.toLowerCase()) return "poster";
    return "worker";
  };

  const getTypingName = (addr: string): string => {
    if (addr.toLowerCase() === posterAddress?.toLowerCase()) return "Poster";
    if (onlineUsers.length > 0 && onlineUsers.includes(addr)) return "Worker";
    const s = addr.slice(0, 6);
    return `${s}…`;
  };

  const isPoster = posterAddress && walletAddress?.toLowerCase() === posterAddress.toLowerCase();
  const isParticipant = room && walletAddress && room.participants.includes(walletAddress.toLowerCase());
  const canChat = isPoster || hasClaimed || !!isParticipant;

  const roomStatus = room?.status || "active";
  const isClosed = roomStatus === "closed";
  const isClosingRequested = roomStatus === "closing_requested";

  const closeRequestMsg = [...messages].reverse().find(
    (m) => m.is_system && m.content.includes("has requested to end this chat")
  );
  const closeRequesterIsPoster = closeRequestMsg?.content.startsWith("Poster");
  const closeRequesterIsWorker = closeRequestMsg?.content.startsWith("Worker");
  const iAmPoster = posterAddress && walletAddress?.toLowerCase() === posterAddress.toLowerCase();
  const requestedByMe = isClosingRequested && (
    (closeRequesterIsPoster && iAmPoster) ||
    (closeRequesterIsWorker && !iAmPoster)
  );
  const canApproveReject = isClosingRequested && !requestedByMe;

  const typingOtherUsers = typingUsers.filter((u) => u !== walletAddress?.toLowerCase());
  const typingNames = typingOtherUsers.map(getTypingName);

  const showTypingBubble = typingOtherUsers.length > 0 && typingOtherUsers.every(
    (u) => !messages.some((m) => m.sender_address.toLowerCase() === u && !m.id.startsWith("opt-"))
  );

  const groupedWithDates = (() => {
    const groups: { date: string; msgs: ChatMessage[] }[] = [];
    for (const msg of messages) {
      const dateKey = new Date(msg.created_at).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.msgs.push(msg);
      } else {
        groups.push({ date: dateKey, msgs: [msg] });
      }
    }
    return groups;
  })();

  const content = !canChat ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: 24, textAlign: "center" }}>
      {error ? (
        <>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p style={{ fontSize: fontSizes.base, color: "#f87171", margin: 0 }}>{error}</p>
        </>
      ) : (
        <>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p style={{ fontSize: fontSizes.base, color: colors.textDim, margin: 0 }}>Claim this job to access the chat</p>
          <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: 0 }}>Communicate with the poster and team after claiming</p>
        </>
      )}
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#09090b", position: "relative" }}>
      {!hideHeader && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #27272a", background: "#000" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{ color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", padding: 4, marginRight: 4, display: "flex" }}
              aria-label="Back"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: onlineUsers.length > 1 ? "#22c55e" : "#10b981", boxShadow: onlineUsers.length > 1 ? "0 0 6px #22c55e" : "0 0 6px #10b981", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: fontSizes.md, fontWeight: 500, color: colors.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jobTitle}</p>
            <p style={{ fontSize: fontSizes.xs, color: "#71717a", margin: "2px 0 0 0" }}>
              {isPoster ? (
                <span style={{ color: "#eab308", fontWeight: 600 }}>Poster</span>
              ) : (
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>Worker</span>
              )}
              {" · "}{room?.participants.length ?? 0} participant{(room?.participants.length ?? 0) !== 1 ? "s" : ""}
              {onlineUsers.length > 0 && ` · ${onlineUsers.length} online`}
              {typingNames.length > 0 && ` · ${typingNames.join(", ")} typing\u2026`}
            </p>
          </div>

          {!isClosed && !isClosingRequested && (
            <button
              onClick={requestClose}
              style={{
                color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
                cursor: "pointer", padding: "4px 10px", borderRadius: radii.md, fontSize: fontSizes.xs,
                fontWeight: 500, transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.2)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
              aria-label="Request to end chat"
            >
              End Chat
            </button>
          )}
          {mode === "floating" && (
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 4, marginLeft: 4 }}
              aria-label="Close chat"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {canApproveReject && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.04)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span style={{ flex: 1, fontSize: fontSizes.sm, color: "#fbbf24" }}>
            {closeRequesterIsPoster ? "Poster" : "Worker"} wants to end this chat.
          </span>
          <button
            onClick={approveClose}
            style={{ color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", cursor: "pointer", padding: "5px 12px", borderRadius: radii.md, fontSize: fontSizes.xs, fontWeight: 600, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,0.22)"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(52,211,153,0.12)"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.25)"; }}
          >
            Approve
          </button>
          <button
            onClick={rejectClose}
            style={{ color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", cursor: "pointer", padding: "5px 12px", borderRadius: radii.md, fontSize: fontSizes.xs, fontWeight: 600, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(251,191,36,0.2)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(251,191,36,0.1)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.2)"; }}
          >
            Reject
          </button>
        </div>
      )}

      {isClosingRequested && requestedByMe && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(251,191,36,0.1)", background: "rgba(251,191,36,0.03)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ fontSize: fontSizes.sm, color: "#fbbf24" }}>
            You requested to end this chat. Waiting for the other party to approve\u2026
          </span>
        </div>
      )}

      {isClosed && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(113,113,122,0.15)", background: "rgba(113,113,122,0.04)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ fontSize: fontSizes.sm, color: "#a1a1aa" }}>
            This chat has been ended.
          </span>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
            <svg className="animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#52525b" strokeWidth="4" />
              <path className="opacity-75" fill="#71717a" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {error && (
          <div style={{ fontSize: fontSizes.sm, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: radii.md, padding: "8px 12px" }}>
            {error}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 96, gap: 8 }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p style={{ fontSize: fontSizes.sm, color: "#52525b", margin: 0 }}>No messages yet. Start the conversation.</p>
          </div>
        )}

        {groupedWithDates.map((group) => (
          <div key={group.date} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <DateSeparator date={group.date} />
            {group.msgs.map((msg) => {
              if (msg.is_system || msg.sender_address === "SYSTEM") {
                if (msg.content.toLowerCase().includes("admin")) return null;
                return <SystemMessage key={msg.id} content={msg.content} />;
              }
              const isSelf = msg.sender_address.toLowerCase() === walletAddress?.toLowerCase();
              return (
                <div
                  key={msg.id}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  style={{ cursor: "context-menu" }}
                >
                  <MessageBubble
                    msg={msg}
                    isSelf={isSelf}
                    senderRole={resolveRole(msg.sender_address)}
                    avatarMap={avatarMap}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {showTypingBubble && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", paddingBottom: 4 }}>
            <Identicon address={typingOtherUsers[0]} size={26} avatarUrl={avatarMap[typingOtherUsers[0]?.toLowerCase()]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
                <span style={{ fontSize: fontSizes.xs, color: colors.textDim, fontFamily: "monospace" }}>
                  {typingOtherUsers.length === 1 ? typingNames[0] : `${typingNames.length} users`}
                </span>
              </div>
              <div
                style={{
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px 16px 16px 4px",
                }}
              >
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          style={{
            position: "absolute", bottom: 72, right: 16, zIndex: 5,
            width: 32, height: 32, borderRadius: "50%",
            background: "#27272a", border: "1px solid #3f3f46", color: "#a1a1aa",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 80),
            zIndex: 1000,
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: radii.md,
            padding: 4,
            minWidth: 140,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(contextMenu.msg)}
            style={{
              width: "100%", textAlign: "left", padding: "8px 12px",
              background: "transparent", border: "none", borderRadius: 6,
              color: colors.textPrimary, fontSize: fontSizes.sm, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#27272a"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(contextMenu.msg.content); setContextMenu(null); }}
            style={{
              width: "100%", textAlign: "left", padding: "8px 12px",
              background: "transparent", border: "none", borderRadius: 6,
              color: colors.textPrimary, fontSize: fontSizes.sm, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#27272a"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy text
          </button>
        </div>
      )}

      {pendingFile && (
        <div
          style={{
            padding: "6px 12px", borderTop: "1px solid #27272a", background: "#000",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {pendingFile.type.startsWith("image/") ? (
            <img src={pendingFile.url} alt={pendingFile.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#71717a" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
          <span style={{ flex: 1, fontSize: fontSizes.xs, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pendingFile.name}
          </span>
          <button
            onClick={() => setPendingFile(null)}
            style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 2 }}
            aria-label="Remove file"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {replyTo && (
        <div
          style={{
            padding: "6px 12px", borderTop: "1px solid #27272a", background: "#000",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#71717a" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span style={{ flex: 1, fontSize: fontSizes.xs, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Replying to: {replyTo.content.slice(0, 80)}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            style={{ color: "#71717a", background: "none", border: "none", cursor: "pointer", padding: 2 }}
            aria-label="Cancel reply"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {isClosed && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid #27272a", background: "#000", textAlign: "center" }}>
          <span style={{ fontSize: fontSizes.sm, color: "#71717a" }}>
            This chat has been ended.
          </span>
        </div>
      )}
      <div style={{ padding: "12px 12px", borderTop: "1px solid #27272a", background: "#000" }}>
        {isClosed ? (
          <p style={{ fontSize: fontSizes.sm, color: "#52525b", textAlign: "center", margin: "4px 0" }}>Chat ended. No new messages can be sent.</p>
        ) : !walletAddress ? (
          <p style={{ fontSize: fontSizes.sm, color: "#71717a", textAlign: "center", margin: "4px 0" }}>Connect wallet to send messages</p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Identicon address={walletAddress} size={24} avatarUrl={avatarMap[walletAddress?.toLowerCase()]} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: "0 12px", transition: "border-color 0.15s" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={replyTo ? "Reply to message\u2026" : "Send a message\u2026"}
                style={{
                  flex: 1, background: "transparent", padding: "10px 0", fontSize: fontSizes.base,
                  color: colors.textPrimary, border: "none", outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: "none", border: "none", color: "#71717a", cursor: "pointer",
                  padding: 4, display: "flex", alignItems: "center",
                  opacity: uploading ? 0.4 : 1,
                }}
                aria-label="Attach file"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() && !pendingFile}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
                borderRadius: radii.md, whiteSpace: "nowrap",
                background: input.trim() || pendingFile ? "rgba(247,206,62,0.15)" : "transparent",
                border: `1px solid ${input.trim() || pendingFile ? "rgba(247,206,62,0.3)" : colors.border}`,
                color: input.trim() || pendingFile ? colors.gold : colors.textDim,
                cursor: input.trim() || pendingFile ? "pointer" : "not-allowed",
                opacity: input.trim() || pendingFile ? 1 : 0.4,
                fontSize: fontSizes.sm, fontWeight: 500,
                transition: "all 0.15s",
              }}
              aria-label="Send message"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === "floating") {
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setUnread(0); }}
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 50,
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(247,206,62,0.2)", border: "1px solid rgba(247,206,62,0.3)", color: colors.gold,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)", transition: "all 0.2s",
            }}
            aria-label="Open chat"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            {unread > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%",
                background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        )}

        {isOpen && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50, width: 360, height: 480,
            borderRadius: 16, overflow: "hidden", border: "1px solid #27272a", boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          }}>
            {content}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #27272a", height: "100%" }} className={className}>
      {content}
    </div>
  );
}

export default ChatRoom;
