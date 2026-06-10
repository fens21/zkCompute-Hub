import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { supabase } from "../lib/supabase";
import { ChatRoom } from "./ChatRoom";
import type { ChatRoom as ChatRoomType, ChatMessage } from "../types/chat";
import { colors, radii, fontSizes } from "../styles/tokens";
import { chatStore } from "../store/chatStore";
import { useIsMobile } from "../hooks/useIsMobile";
import { playMessageSound } from "../lib/notifySound";

export function ChatPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const isMobile = useIsMobile();
  const [rooms, setRooms] = useState<ChatRoomType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locationState = location.state as { posterAddress?: string; jobTitle?: string; workerAddress?: string; hasClaimed?: boolean } | null;

  const roomIdsRef = useRef<Set<string>>(new Set());
  const msgChannelSeqRef = useRef(0);
  const activeRoomIdRef = useRef<string | undefined>(undefined);
  const [, setTick] = useState(0);

  const activeRoom = rooms.find((r) => r.job_id === jobId && (!r.worker_address || r.worker_address === locationState?.workerAddress));
  activeRoomIdRef.current = activeRoom?.id;
  const posterAddress = locationState?.posterAddress || activeRoom?.poster_address;
  const jobTitle = locationState?.jobTitle || activeRoom?.job_title;
  const workerAddress = locationState?.workerAddress;
  const hasClaimed = locationState?.hasClaimed ?? false;

  const addr = address?.toLowerCase();

  const closeMobileSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (jobId) {
      chatStore.reset(activeRoom?.id || jobId);
      closeMobileSidebar();
    }
  }, [jobId, activeRoom?.id]);

  useEffect(() => {
    if (!addr) return;

    let msgChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchRooms = async () => {
      setRoomsLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("chat_rooms")
        .select("*")
        .filter("participants", "cs", `{${addr}}`)
        .order("created_at", { ascending: false });
      if (fetchErr) {
        console.error("Failed to fetch chat rooms:", fetchErr.message);
        setRoomsLoading(false);
        return;
      }
      if (data) {
        setRooms(data as ChatRoomType[]);
        roomIdsRef.current = new Set(data.map((r) => r.id));

        if (msgChannel) supabase.removeChannel(msgChannel);

        const roomIdList = data.map((r) => r.id);
        if (roomIdList.length > 0) {
          msgChannelSeqRef.current += 1;
          msgChannel = supabase
            .channel(`chatpage:messages:${msgChannelSeqRef.current}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `room_id=in.(${roomIdList.join(",")})`,
              },
              (payload) => {
                const msg = payload.new as ChatMessage;
                if (roomIdsRef.current.has(msg.room_id) && msg.room_id !== activeRoomIdRef.current) {
                  chatStore.increment(msg.room_id);
                  playMessageSound();
                }
              }
            )
            .subscribe();
        }
      }
      setRoomsLoading(false);
    };

    fetchRooms();

    const roomChannel = supabase
      .channel("chatpage:rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_rooms" },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      if (msgChannel) supabase.removeChannel(msgChannel);
    };
  }, [addr, jobId]);

  useEffect(() => {
    return chatStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const handleSelectRoom = (jid: string, room: ChatRoomType) => {
    chatStore.reset(room.id);
    closeMobileSidebar();
    const isPoster = addr === room.poster_address?.toLowerCase();
    navigate(`/chat/${jid}`, {
      replace: true,
      state: {
        posterAddress: room.poster_address,
        jobTitle: room.job_title,
        workerAddress: room.worker_address,
        hasClaimed: !isPoster,
      },
    });
  };

  const handleMarkUnread = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    chatStore.markUnread(roomId);
  };

  const sidebarContent = (
    <div
      style={{
        width: isMobile ? "100%" : 240,
        flexShrink: 0,
        borderRight: isMobile ? "none" : "1px solid #27272a",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        height: "100%",
      }}
    >
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #27272a" }}>
        <p style={{ fontSize: fontSizes.xs, fontWeight: 500, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
          Active rooms
        </p>
        <p style={{ fontSize: fontSizes.xs, color: "#52525b", margin: "2px 0 0 0" }}>
          {rooms.length} room{rooms.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {roomsLoading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 64 }}>
            <svg width="16" height="16" className="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#52525b" strokeWidth="4" />
              <path className="opacity-75" fill="#71717a" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {!roomsLoading && rooms.length === 0 && (
          <p style={{ fontSize: fontSizes.xs, color: "#52525b", textAlign: "center", padding: "24px 8px", margin: 0 }}>
            No active chat rooms yet.
          </p>
        )}

        {rooms.map((room) => {
          const isActive = room.job_id === jobId;
          const unread = chatStore.getUnread(room.id);
          const isClosed = room.status === "closed";
          return (
            <button
              key={room.id}
              onClick={() => handleSelectRoom(room.job_id, room)}
              onContextMenu={(e) => { e.preventDefault(); handleMarkUnread(e, room.id); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: radii.md,
                transition: "all 0.1s", cursor: "pointer", border: "1px solid",
                fontFamily: "inherit", opacity: isClosed ? 0.5 : 1,
                ...(isActive
                  ? { background: "#27272a", borderColor: colors.border }
                  : { background: "transparent", borderColor: "transparent" }),
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "#18181b"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: isClosed ? "#52525b" : "#10b981" }} />
                <span style={{ fontSize: fontSizes.sm, fontWeight: 500, color: isClosed ? "#52525b" : colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {room.job_title || `Job #${room.job_id.slice(0, 8)}`}{room.worker_address ? ` · ${room.worker_address.slice(0, 6)}…${room.worker_address.slice(-4)}` : ""}
                </span>
                {unread > 0 && !isClosed && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 5px", flexShrink: 0 }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
                {isClosed && (
                  <span style={{ background: "#27272a", color: "#71717a", fontSize: 9, fontWeight: 600, borderRadius: 99, padding: "1px 5px", flexShrink: 0 }}>
                    Closed
                  </span>
                )}
              </div>
              <p style={{ fontSize: fontSizes.xs, color: isClosed ? "#3f3f46" : "#71717a", margin: "2px 0 0 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {room.last_message || `${room.participants.length} participant${room.participants.length !== 1 ? "s" : ""}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#09090b",
        borderRadius: isMobile ? 0 : 16,
        overflow: "hidden",
        border: isMobile ? "none" : "1px solid #27272a",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          width: isMobile ? 44 : 28, height: isMobile ? 44 : 28, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.05)", border: "1px solid #3f3f46",
          color: "#a1a1aa", cursor: "pointer",
          transition: "all 0.15s",
        }}
        aria-label="Close chat"
      >
        <svg width={isMobile ? 18 : 14} height={isMobile ? 18 : 14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {isMobile ? (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            {jobId && addr ? (
              <ChatRoom
                jobId={jobId}
                jobTitle={jobTitle || activeRoom?.job_title || `Job #${jobId.slice(0, 8)}`}
                walletAddress={addr}
                posterAddress={posterAddress}
                workerAddress={workerAddress}
                hasClaimed={hasClaimed}
                mode="panel"
                onBack={() => setSidebarOpen(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: 24 }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <p style={{ fontSize: fontSizes.md, color: "#52525b", margin: 0 }}>Select a room to start chatting</p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    padding: "8px 16px", borderRadius: radii.md,
                    background: "rgba(247,206,62,0.1)", border: "1px solid rgba(247,206,62,0.2)",
                    color: colors.gold, cursor: "pointer", fontSize: fontSizes.sm, fontWeight: 500,
                  }}
                >
                  Open rooms
                </button>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 200,
                background: "rgba(0,0,0,0.6)",
              }}
              onClick={closeMobileSidebar}
            >
              <div
                style={{
                  position: "absolute", top: 0, left: 0, bottom: 0, width: 280,
                  background: "#000", borderRight: "1px solid #27272a",
                  animation: "slideInLeft 0.2s ease",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {sidebarContent}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {sidebarContent}
          <div style={{ flex: 1, minWidth: 0 }}>
            {jobId && addr ? (
              <ChatRoom
                jobId={jobId}
                jobTitle={jobTitle || activeRoom?.job_title || `Job #${jobId.slice(0, 8)}`}
                walletAddress={addr}
                posterAddress={posterAddress}
                workerAddress={workerAddress}
                hasClaimed={hasClaimed}
                mode="panel"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <p style={{ fontSize: fontSizes.md, color: "#52525b", margin: 0 }}>Select a room to start chatting</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ChatPage;
