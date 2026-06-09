import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { ChatMessage, ChatRoom, ParticipantRole } from "../types/chat";
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";

function deriveRole(
  address: string,
  room: ChatRoom | null,
  posterAddress?: string
): ParticipantRole {
  if (!room || !address) return "unknown";
  if (address.toLowerCase() === posterAddress?.toLowerCase()) return "poster";
  if (room.participants.includes(address.toLowerCase())) return "worker";
  return "unknown";
}

interface UseChatOptions {
  jobId: string;
  jobTitle?: string;
  walletAddress: string;
  posterAddress?: string;
  workerAddress?: string;
  hasClaimed?: boolean;
}

interface UseChatReturn {
  room: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  myRole: ParticipantRole;
  typingUsers: string[];
  onlineUsers: string[];
  sendMessage: (content: string, replyTo?: string, replyPreview?: string, attachment?: { url: string; type: string; name: string }) => Promise<void>;
  uploadAttachment: (file: File) => Promise<string | null>;
  broadcastTyping: () => void;
  requestClose: () => Promise<void>;
  approveClose: () => Promise<void>;
  rejectClose: () => Promise<void>;
}

export function useChat({
  jobId,
  jobTitle = "Compute Job",
  walletAddress,
  posterAddress,
  workerAddress,
  hasClaimed = false,
}: UseChatOptions): UseChatReturn {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);

  const addr = walletAddress?.toLowerCase();

  messagesRef.current = messages;

  useEffect(() => {
    if (!jobId || !addr) return;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const workerAddr = hasClaimed ? addr : (workerAddress || undefined);

        let existing: ChatRoom | null = null;
        if (workerAddr && workerAddr !== posterAddress?.toLowerCase()) {
          const { data } = await supabase
            .from("chat_rooms")
            .select("*")
            .eq("job_id", jobId)
            .eq("worker_address", workerAddr)
            .maybeSingle();
          existing = data || null;
        }
        if (!existing) {
          const { data } = await supabase
            .from("chat_rooms")
            .select("*")
            .eq("job_id", jobId)
            .filter("participants", "cs", `{${addr}}`)
            .maybeSingle();
          existing = data || null;
        }

        if (existing) {
          if (!existing.participants.includes(addr)) {
            const isPoster = posterAddress && addr === posterAddress.toLowerCase();
            if (isPoster || hasClaimed) {
              const { data: updated, error: updErr } = await supabase
                .from("chat_rooms")
                .update({ participants: [...existing.participants, addr] })
                .eq("id", existing.id)
                .select()
                .single();
              if (updErr) throw updErr;
              setRoom(updated);
            } else {
              setError("Only the poster and claimed workers can access this chat room.");
            }
          } else {
            setRoom(existing);
          }
        } else if (!hasClaimed && posterAddress && addr !== posterAddress.toLowerCase()) {
          setError("Only the poster and claimed workers can access this chat room.");
          setLoading(false);
          return;
        } else {
          const { data: created, error: createErr } = await supabase
            .from("chat_rooms")
            .insert({
              job_id: jobId,
              job_title: jobTitle,
              ...(workerAddr && workerAddr !== posterAddress?.toLowerCase() ? { worker_address: workerAddr } : {}),
              participants: [addr],
              poster_address: posterAddress?.toLowerCase(),
            })
            .select()
            .single();
          if (createErr) throw createErr;
          setRoom(created);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to init chat room");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [jobId, addr, jobTitle, posterAddress, workerAddress, hasClaimed]);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;

    supabase
      .from("messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); return; }
        if (data) {
          setMessages(data as ChatMessage[]);
          markMessagesAsRead(data as ChatMessage[]);
        }
      });

    return () => { cancelled = true; };
  }, [room?.id]);

  const markMessagesAsRead = useCallback(async (msgs: ChatMessage[]) => {
    if (!addr) return;
    const unreadFromOthers = msgs.filter(
      (m) => m.sender_address.toLowerCase() !== addr && !m.read_at
    );
    if (unreadFromOthers.length === 0) return;

    const ids = unreadFromOthers.map((m) => m.id);
    const now = new Date().toISOString();
    await supabase
      .from("messages")
      .update({ read_at: now })
      .in("id", ids);

    setMessages((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, read_at: now } : m))
    );
  }, [addr]);

  useEffect(() => {
    if (!room?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    setTypingUsers([]);
    setOnlineUsers([]);
    typingTimersRef.current.forEach(clearTimeout);
    typingTimersRef.current.clear();

    const channel = supabase.channel(`chat:${room.id}`, {
      config: { presence: { key: addr } },
    })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const online: string[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as { user_address?: string }[];
          for (const p of presences) {
            if (p.user_address && !online.includes(p.user_address)) {
              online.push(p.user_address);
            }
          }
        }
        if (addr && !online.includes(addr)) online.push(addr);
        setOnlineUsers(online);
      })
      .on("presence", { event: "join" }, ({ key }: { key: string }) => {
        setOnlineUsers((prev) => {
          const next = prev.includes(key) ? prev : [...prev, key];
          return addr && !next.includes(addr) ? [...next, addr] : next;
        });
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        setOnlineUsers((prev) => {
          const next = prev.filter((u) => u !== key);
          return addr && !next.includes(addr) ? [...next, addr] : next;
        });
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender_address.toLowerCase() !== addr) {
            markMessagesAsRead([msg]);
          }
          setMessages((prev) => {
            const exists = prev.some(
              (m) => m.id === msg.id || (m.id.startsWith("opt-") && m.sender_address === msg.sender_address && m.content === msg.content)
            );
            if (exists) {
              return prev.map((m) =>
                m.id.startsWith("opt-") && m.sender_address === msg.sender_address && m.content === msg.content ? msg : m
              );
            }
            return [...prev, msg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updated = payload.new as ChatRoom;
          setRoom(updated);
        }
      )
      .on(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: "typing" },
        (payload: any) => {
          const sender = payload.sender_address?.toLowerCase();
          if (!sender || sender === addr) return;

          setTypingUsers((prev) => {
            if (prev.includes(sender)) return prev;
            return [...prev, sender];
          });

          const timer = setTimeout(() => {
            typingTimersRef.current.delete(timer);
            setTypingUsers((prev) => prev.filter((a) => a !== sender));
          }, 2500);
          typingTimersRef.current.add(timer);
        }
      )
      .on(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: "presence" },
        (payload: any) => {
          const sender = payload.user_address?.toLowerCase();
          if (!sender || sender === addr) return;
          setOnlineUsers((prev) => prev.includes(sender) ? prev : [...prev, sender]);
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && addr) {
          await channel.track({ user_address: addr });
          channel.send({ type: "broadcast", event: "presence", payload: { user_address: addr, ts: Date.now() } });
        }
      });

    channelRef.current = channel;

    const heartbeat = setInterval(() => {
      if (addr) {
        channel.send({ type: "broadcast", event: "presence", payload: { user_address: addr, ts: Date.now() } });
      }
    }, 15000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
      typingTimersRef.current.forEach(clearTimeout);
      typingTimersRef.current.clear();
    };
  }, [room?.id, addr]);

  const sendMessage = useCallback(
    async (content: string, replyTo?: string, replyPreview?: string, attachment?: { url: string; type: string; name: string }) => {
      if (!room) return;
      if (!content.trim() && !attachment) return;

      const trimmed = content.trim();
      const contentToSend = attachment && !trimmed
        ? (attachment.type.startsWith("image/") ? `[Image: ${attachment.name}]` : `[File: ${attachment.name}]`)
        : trimmed;

      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        room_id: room.id,
        sender_address: addr,
        content: contentToSend,
        is_system: false,
        created_at: new Date().toISOString(),
        reply_to: replyTo,
        reply_preview: replyPreview,
        ...(attachment ? { attachment_url: attachment.url, attachment_type: attachment.type, attachment_name: attachment.name } : {}),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { error: err } = await supabase.from("messages").insert({
        room_id: room.id,
        sender_address: addr,
        content: contentToSend,
        is_system: false,
        reply_to: replyTo || null,
        reply_preview: replyPreview || null,
        ...(attachment ? { attachment_url: attachment.url, attachment_type: attachment.type, attachment_name: attachment.name } : {}),
      });

      if (!err) {
        await supabase
          .from("chat_rooms")
          .update({
            last_message: contentToSend,
            last_message_at: new Date().toISOString(),
            last_sender: addr,
          })
          .eq("id", room.id);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setError(err.message);
      }
    },
    [room, addr]
  );

  const uploadAttachment = useCallback(
    async (file: File): Promise<string | null> => {
      if (!room) return null;
      const ext = file.name.split(".").pop() || "bin";
      const path = `${room.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        setError(`Upload gagal: ${uploadErr.message}. Pastikan bucket "chat-attachments" sudah dibuat.`);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(path);

      const url = urlData?.publicUrl;
      if (!url) {
        setError("Upload gagal: tidak bisa mendapatkan URL publik");
        return null;
      }

      return url;
    },
    [room, addr]
  );

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !addr) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { sender_address: addr },
    });
  }, [addr]);

  const syncRoom = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", room.id)
      .single();
    if (data) setRoom(data as ChatRoom);
  }, [room?.id]);

  const requestClose = useCallback(async () => {
    if (!room || !addr) return;
    const now = new Date().toISOString();
    await supabase
      .from("chat_rooms")
      .update({ status: "closing_requested", closing_requested_by: addr })
      .eq("id", room.id);
    await supabase.from("messages").insert({
      room_id: room.id,
      sender_address: "SYSTEM",
      content: `${
        addr === posterAddress?.toLowerCase() ? "Poster" : "Worker"
      } has requested to end this chat. Waiting for the other party to approve.`,
      is_system: true,
      created_at: now,
    });
    await syncRoom();
  }, [room, addr, posterAddress, syncRoom]);

  const approveClose = useCallback(async () => {
    if (!room || !addr) return;
    const now = new Date().toISOString();
    await supabase
      .from("chat_rooms")
      .update({ status: "closed", closed_at: now })
      .eq("id", room.id);
    await supabase.from("messages").insert({
      room_id: room.id,
      sender_address: "SYSTEM",
      content: "Chat has been ended by mutual agreement.",
      is_system: true,
      created_at: now,
    });
    await syncRoom();
  }, [room, addr, syncRoom]);

  const rejectClose = useCallback(async () => {
    if (!room || !addr) return;
    const now = new Date().toISOString();
    await supabase
      .from("chat_rooms")
      .update({ status: "active", closing_requested_by: null })
      .eq("id", room.id);
    await supabase.from("messages").insert({
      room_id: room.id,
      sender_address: "SYSTEM",
      content: `${
        addr === posterAddress?.toLowerCase() ? "Poster" : "Worker"
      } has declined the request to end the chat.`,
      is_system: true,
      created_at: now,
    });
    await syncRoom();
  }, [room, addr, posterAddress, syncRoom]);

  const myRole = deriveRole(addr, room, posterAddress);

  return {
    room,
    messages,
    loading,
    error,
    myRole,
    typingUsers,
    onlineUsers,
    sendMessage,
    uploadAttachment,
    broadcastTyping,
    requestClose,
    approveClose,
    rejectClose,
  };
}
