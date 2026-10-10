export type UserStatus = 'online' | 'mining' | 'away' | 'offline';

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'audio';

export interface UserProfile {
  id: string;
  username: string;
  callsign: string;
  email: string;
  avatar_url: string;
  bio: string;
  mining_rank: string;
  ore_balance: number;
  status: UserStatus;
  status_message?: string;
  last_seen: string;
}

export interface MessageMedia {
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: UserProfile;
}

export interface MessageReply {
  id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  sender_name: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  media?: MessageMedia;
  media_url?: string | null;
  media_metadata?: Record<string, unknown> | null;
  reply_to_id?: string;
  reply_to?: MessageReply;
  is_edited: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
  reactions: MessageReaction[];
  read_by: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string;
  description?: string;
  avatar_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
  is_muted?: boolean;
  other_user?: UserProfile;
}

export interface TypingIndicatorState {
  userId: string;
  username: string;
  avatarUrl: string;
  conversationId: string;
  timestamp: number;
  isTyping?: boolean;
}