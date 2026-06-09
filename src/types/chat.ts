export interface ChatMessage {
  id: string;
  room_id: string;
  sender_address: string;
  content: string;
  is_system: boolean;
  created_at: string;
  read_at?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  reply_to?: string;
  reply_preview?: string;
}

export interface ChatRoom {
  id: string;
  job_id: string;
  job_title: string;
  worker_address?: string;
  participants: string[];
  created_at: string;
  poster_address?: string;
  last_message?: string;
  last_message_at?: string;
  last_sender?: string;
}

export type ParticipantRole = "poster" | "worker" | "unknown";
