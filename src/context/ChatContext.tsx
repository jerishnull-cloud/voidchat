import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  Conversation,
  Message,
  MessageMedia,
  MessageType,
  TypingIndicatorState,
} from '../types/chat';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/seedData';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  activeMessages: Message[];
  allMessages: Record<string, Message[]>;
  typingUsers: TypingIndicatorState[];
  searchQuery: string;
  isSearchActive: boolean;
  pinnedMessages: Message[];
  setActiveConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchActive: (active: boolean) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType,
    media?: MessageMedia,
    replyToId?: string
  ) => Promise<Message>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  createGroup: (title: string, description: string, avatarUrl: string, memberIds: string[]) => Promise<string>;
  createDirectChat: (targetUserId: string) => Promise<string>;
  toggleMuteConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  uploadAttachment: (file: File) => Promise<{ url: string; mimeType: string; fileName: string; fileSize: number }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_CONVERSATIONS = 'void_miner_conversations_cache';
const LOCAL_STORAGE_MESSAGES = 'void_miner_messages_cache';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers, blockedUserIds, isSupabaseLive } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS);
      return stored ? JSON.parse(stored) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
      return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return INITIAL_CONVERSATIONS[0]?.id || null;
  });

  const [typingUsers, setTypingUsers] = useState<TypingIndicatorState[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(allMessages));
  }, [allMessages]);

  // Handle local Cross-tab Broadcast Channel for instant real-time multi-window sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const channel = new BroadcastChannel('void_miner_chat_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;

        if (type === 'NEW_MESSAGE') {
          const { message } = payload;
          if (blockedUserIds.includes(message.sender_id)) return;

          setAllMessages((prev) => {
            const list = prev[message.conversation_id] || [];
            if (list.some((m) => m.id === message.id)) return prev;
            return {
              ...prev,
              [message.conversation_id]: [...list, message],
            };
          });

          // Play sound if not current user
          if (message.sender_id !== currentUser.id) {
            sounds.playMessageReceived();
          }

          // Update conversation last_message and unread count
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === message.conversation_id) {
                const isCurrentActive = activeConversationId === c.id;
                return {
                  ...c,
                  updated_at: message.created_at,
                  last_message: message,
                  unread_count: isCurrentActive || c.is_muted ? c.unread_count : (c.unread_count || 0) + 1,
                };
              }
              return c;
            })
          );
        } else if (type === 'EDIT_MESSAGE') {
          const { messageId, conversationId, content } = payload;
          setAllMessages((prev) => {
            const list = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: list.map((m) => (m.id === messageId ? { ...m, content, is_edited: true } : m)),
            };
          });
        } else if (type === 'DELETE_MESSAGE') {
          const { messageId, conversationId } = payload;
          setAllMessages((prev) => {
            const list = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: list.filter((m) => m.id !== messageId),
            };
          });
        } else if (type === 'REACTION_UPDATE') {
          const { messageId, conversationId, reactions } = payload;
          setAllMessages((prev) => {
            const list = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: list.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
            };
          });
          sounds.playReaction();
        } else if (type === 'PIN_UPDATE') {
          const { messageId, conversationId, is_pinned } = payload;
          setAllMessages((prev) => {
            const list = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: list.map((m) => (m.id === messageId ? { ...m, is_pinned } : m)),
            };
          });
        } else if (type === 'TYPING') {
          const { indicator } = payload;
          if (indicator.userId === currentUser.id) return;
          setTypingUsers((prev) => {
            const filtered = prev.filter((t) => t.userId !== indicator.userId);
            if (indicator.isTyping) {
              return [...filtered, indicator];
            }
            return filtered;
          });
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }, [currentUser.id, activeConversationId, blockedUserIds]);

  // Clean stale typing indicators every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => prev.filter((t) => now - t.timestamp < 3500));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial conversations & messages from Supabase if connected
  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseLive) return;

    const fetchSupabaseData = async () => {
      try {
        const { data: convData, error: convError } = await client
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!convError && convData && convData.length > 0) {
          setConversations((prev) => {
            const map = new Map<string, Conversation>();
            convData.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });

          // Fetch messages for the top conversations
          convData.slice(0, 10).forEach(async (conv) => {
            const { data: msgData, error: msgError } = await client
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            if (!msgError && msgData && msgData.length > 0) {
              setAllMessages((prev) => ({
                ...prev,
                [conv.id]: msgData.map((m) => ({
                  ...m,
                  reactions: [],
                  read_by: [m.sender_id],
                })),
              }));
            }
          });
        }
      } catch (e) {
        console.warn('Supabase initial fetch skipped or tables pending:', e);
      }
    };

    fetchSupabaseData();
  }, [isSupabaseLive, currentUser.id]);

  // Supabase Realtime Subscription (when configured)
  useEffect(() => {
    if (!supabase || !isSupabaseLive) return;

    try {
      const channel = supabase
        .channel('void-miner-chat-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newMsg = payload.new as Message;
            if (blockedUserIds.includes(newMsg.sender_id)) return;

            setAllMessages((prev) => {
              const list = prev[newMsg.conversation_id] || [];
              if (list.some((m) => m.id === newMsg.id)) return prev;
              const sender = allUsers.find((u) => u.id === newMsg.sender_id);
              const hydratedMsg: Message = {
                ...newMsg,
                sender,
                reactions: [],
                read_by: [newMsg.sender_id],
              };
              return {
                ...prev,
                [newMsg.conversation_id]: [...list, hydratedMsg],
              };
            });

            if (newMsg.sender_id !== currentUser.id) {
              sounds.playMessageReceived();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            const updated = payload.new as Message;
            setAllMessages((prev) => {
              const list = prev[updated.conversation_id] || [];
              return {
                ...prev,
                [updated.conversation_id]: list.map((m) =>
                  m.id === updated.id ? { ...m, ...updated } : m
                ),
              };
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload) => {
            const deleted = payload.old as { id: string; conversation_id: string };
            if (deleted?.id && deleted?.conversation_id) {
              setAllMessages((prev) => ({
                ...prev,
                [deleted.conversation_id]: (prev[deleted.conversation_id] || []).filter(
                  (m) => m.id !== deleted.id
                ),
              }));
            }
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } catch (err) {
      console.warn('Supabase realtime error:', err);
    }
  }, [isSupabaseLive, allUsers, blockedUserIds, currentUser.id]);

  // Get active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Active messages (filtered against blocked users)
  const activeMessages = (activeConversationId ? allMessages[activeConversationId] || [] : [])
    .filter((msg) => !blockedUserIds.includes(msg.sender_id))
    .map((msg) => {
      // Ensure sender profile is attached
      const sender = msg.sender || allUsers.find((u) => u.id === msg.sender_id) || {
        id: msg.sender_id,
        username: 'Unknown Miner',
        callsign: 'VM-UNK',
        email: '',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + msg.sender_id,
        bio: '',
        mining_rank: 'MINER',
        ore_balance: 0,
        status: 'online',
        last_seen: new Date().toISOString(),
      };
      return { ...msg, sender };
    });

  const pinnedMessages = activeMessages.filter((m) => m.is_pinned);

  // Mark active conversation as read
  const markConversationAsRead = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId, markConversationAsRead]);

  // Send Message
  const sendMessage = async (
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    media?: MessageMedia,
    replyToId?: string
  ): Promise<Message> => {
    const replyTarget = replyToId
      ? (allMessages[conversationId] || []).find((m) => m.id === replyToId)
      : null;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content,
      type,
      media,
      reply_to_id: replyToId,
      reply_to: replyTarget
        ? {
            id: replyTarget.id,
            sender_id: replyTarget.sender_id,
            content: replyTarget.content,
            type: replyTarget.type,
            sender_name: replyTarget.sender?.username || 'Miner',
          }
        : undefined,
      is_edited: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUser,
      reactions: [],
      read_by: [currentUser.id],
      status: 'sent',
    };

    // Optimistic UI update
    setAllMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              updated_at: newMessage.created_at,
              last_message: newMessage,
            }
          : c
      )
    );

    // Audio cue
    sounds.playMessageSent();

    // Broadcast cross-tab
    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      payload: { message: newMessage },
    });

    // Supabase persist
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('messages').insert({
          id: newMessage.id,
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content,
          type,
          media_url: media?.url,
          media_metadata: media ? { fileName: media.fileName, fileSize: media.fileSize, duration: media.duration } : {},
          reply_to_id: replyToId || null,
        });
      } catch (err) {
        console.error('Supabase message insert error:', err);
      }
    }

    return newMessage;
  };

  // Edit Message
  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeConversationId) return;

    setAllMessages((prev) => {
      const list = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: list.map((m) =>
          m.id === messageId ? { ...m, content: newContent, is_edited: true, updated_at: new Date().toISOString() } : m
        ),
      };
    });

    broadcastChannelRef.current?.postMessage({
      type: 'EDIT_MESSAGE',
      payload: { messageId, conversationId: activeConversationId, content: newContent },
    });

    if (supabase && isSupabaseLive) {
      try {
        await supabase
          .from('messages')
          .update({ content: newContent, is_edited: true, updated_at: new Date().toISOString() })
          .eq('id', messageId);
      } catch {
        // Ignored
      }
    }
  };

  // Delete Message
  const deleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;

    setAllMessages((prev) => {
      const list = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: list.filter((m) => m.id !== messageId),
      };
    });

    broadcastChannelRef.current?.postMessage({
      type: 'DELETE_MESSAGE',
      payload: { messageId, conversationId: activeConversationId },
    });

    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('messages').delete().eq('id', messageId);
      } catch {
        // Ignored
      }
    }
  };

  // Toggle Reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId) return;

    let updatedReactions: Message['reactions'] = [];

    setAllMessages((prev) => {
      const list = prev[activeConversationId] || [];
      const updated = list.map((msg) => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex(
          (r) => r.user_id === currentUser.id && r.emoji === emoji
        );

        let nextReactions = [...msg.reactions];
        if (existingIdx >= 0) {
          // Remove reaction
          nextReactions.splice(existingIdx, 1);
        } else {
          // Add reaction
          nextReactions.push({
            id: `react-${Date.now()}`,
            message_id: messageId,
            user_id: currentUser.id,
            emoji,
            created_at: new Date().toISOString(),
            user: currentUser,
          });
        }
        updatedReactions = nextReactions;
        return { ...msg, reactions: nextReactions };
      });

      return {
        ...prev,
        [activeConversationId]: updated,
      };
    });

    sounds.playReaction();

    broadcastChannelRef.current?.postMessage({
      type: 'REACTION_UPDATE',
      payload: { messageId, conversationId: activeConversationId, reactions: updatedReactions },
    });

    if (supabase && isSupabaseLive) {
      try {
        const hasReaction = updatedReactions.some((r) => r.user_id === currentUser.id && r.emoji === emoji);
        if (hasReaction) {
          await supabase.from('message_reactions').insert({ message_id: messageId, user_id: currentUser.id, emoji });
        } else {
          await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: currentUser.id, emoji });
        }
      } catch (err) {
        console.error('Reaction sync error:', err);
      }
    }
  };

  // Toggle Pin
  const togglePinMessage = async (messageId: string) => {
    if (!activeConversationId) return;

    let nextPinState = false;

    setAllMessages((prev) => {
      const list = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: list.map((m) => {
          if (m.id === messageId) {
            nextPinState = !m.is_pinned;
            return { ...m, is_pinned: nextPinState };
          }
          return m;
        }),
      };
    });

    broadcastChannelRef.current?.postMessage({
      type: 'PIN_UPDATE',
      payload: { messageId, conversationId: activeConversationId, is_pinned: nextPinState },
    });

    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('messages').update({ is_pinned: nextPinState }).eq('id', messageId);
      } catch {
        // Ignored
      }
    }
  };

  // Typing indicator
  const setTyping = (conversationId: string, isTyping: boolean) => {
    const indicator: TypingIndicatorState = {
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatar_url,
      conversationId,
      timestamp: Date.now(),
    };

    broadcastChannelRef.current?.postMessage({
      type: 'TYPING',
      payload: { indicator: { ...indicator, isTyping } },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        broadcastChannelRef.current?.postMessage({
          type: 'TYPING',
          payload: { indicator: { ...indicator, isTyping: false } },
        });
      }, 3000);
    }
  };

  // Create Group
  const createGroup = async (
    title: string,
    description: string,
    avatarUrl: string,
    memberIds: string[]
  ): Promise<string> => {
    const newId = `group-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      type: 'group',
      title,
      description,
      avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
      unread_count: 0,
      is_muted: false,
    };

    setConversations((prev) => [newConv, ...prev]);
    setAllMessages((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `msg-sys-${Date.now()}`,
          conversation_id: newId,
          sender_id: currentUser.id,
          content: `Squad "${title}" formed by ${currentUser.username}. Coordinates locked. Ready for extraction!`,
          type: 'text',
          is_edited: false,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: currentUser,
          reactions: [],
          read_by: [currentUser.id],
        },
      ],
    }));

    setActiveConversationId(newId);

    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('conversations').insert({
          id: newId,
          type: 'group',
          title,
          description,
          avatar_url: avatarUrl,
          created_by: currentUser.id,
        });

        // Insert creator as owner
        const membersToInsert = [
          { conversation_id: newId, user_id: currentUser.id, role: 'owner' },
          ...memberIds.map((uid) => ({ conversation_id: newId, user_id: uid, role: 'member' })),
        ];

        await supabase.from('conversation_members').insert(membersToInsert);
      } catch (e) {
        console.error('Supabase group create error:', e);
      }
    }

    return newId;
  };

  // Create or Find Direct Chat
  const createDirectChat = async (targetUserId: string): Promise<string> => {
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    if (!targetUser) throw new Error('Target user not found');

    // Check if direct conversation already exists
    const existing = conversations.find(
      (c) => c.type === 'direct' && (c.title === targetUser.username || c.id.includes(targetUserId))
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const newId = `direct-${currentUser.id}-${targetUserId}`;
    const newConv: Conversation = {
      id: newId,
      type: 'direct',
      title: targetUser.username,
      description: targetUser.callsign || 'Direct Holo-Link',
      avatar_url: targetUser.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
      unread_count: 0,
      is_muted: false,
      other_user: targetUser,
    };

    setConversations((prev) => [newConv, ...prev]);
    setAllMessages((prev) => ({
      ...prev,
      [newId]: [],
    }));

    setActiveConversationId(newId);
    return newId;
  };

  // Toggle Mute
  const toggleMuteConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, is_muted: !c.is_muted } : c))
    );
  };

  // Delete Conversation
  const deleteConversation = async (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setAllMessages((prev) => {
      const copy = { ...prev };
      delete copy[conversationId];
      return copy;
    });

    if (activeConversationId === conversationId) {
      const remaining = conversations.filter((c) => c.id !== conversationId);
      setActiveConversationId(remaining[0]?.id || null);
    }

    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('conversations').delete().eq('id', conversationId);
      } catch {
        // Ignored
      }
    }
  };

  // Upload attachment (handles Supabase Storage or Local Data URL)
  const uploadAttachment = async (file: File) => {
    if (supabase && isSupabaseLive) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
          return {
            url: data.publicUrl,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          };
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, falling back to local object URL', err);
      }
    }

    // High fidelity browser blob / FileReader fallback
    return new Promise<{ url: string; mimeType: string; fileName: string; fileSize: number }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            url: reader.result as string,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      }
    );
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        allMessages,
        typingUsers: typingUsers.filter((t) => t.conversationId === activeConversationId),
        searchQuery,
        isSearchActive,
        pinnedMessages,
        setActiveConversationId,
        setSearchQuery,
        setIsSearchActive,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePinMessage,
        markConversationAsRead,
        setTyping,
        createGroup,
        createDirectChat,
        toggleMuteConversation,
        deleteConversation,
        uploadAttachment,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
