import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Pin,
  Reply,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  X,
  Search,
  Info,
  ArrowLeft,
  Volume2,
  Play,
  Pause,
  Download,
  Flame,
  File,
  Shield,
} from 'lucide-react';
import {
  Message,
  MessageMedia,
  MessageType,
  UserProfile,
} from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { VoiceRecorder } from './VoiceRecorder';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

interface ChatWindowProps {
  onBackToSidebar?: () => void;
  onToggleInfoPanel: () => void;
  onViewMedia: (media: MessageMedia) => void;
}

const COMMON_EMOJIS = ['💎', '⚡', '🔥', '🚀', '👾', '❤️', '👍', '👀'];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  onBackToSidebar,
  onToggleInfoPanel,
  onViewMedia,
}) => {
  const { currentUser, allUsers } = useAuth();
  const {
    activeConversation,
    activeMessages,
    typingUsers,
    pinnedMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePinMessage,
    setTyping,
    uploadAttachment,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Audio playing states for voice notes: { [msgId: string]: boolean }
  const [playingAudios, setPlayingAudios] = useState<Record<string, boolean>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, typingUsers.length]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#050507] text-[#A1A1AA] select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#100B18] border border-[#B026FF]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(176,38,255,0.2)]">
          <Shield className="w-8 h-8 text-[#B026FF]" />
        </div>
        <h3 className="font-orbitron font-bold text-lg text-white mb-1">
          VOID MINER COMMS TERMINAL
        </h3>
        <p className="text-sm font-tech max-w-sm">
          Select an encrypted frequency or squad from the left console to start quantum-linked real-time transmissions.
        </p>
      </div>
    );
  }

  // Handle Input Changes & Typing indication
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setTyping(activeConversation.id, e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isUploading) return;

    // Trigger celebratory confetti if user finds Void Ore or types crystals
    if (trimmed.includes('💎') || trimmed.toLowerCase().includes('void ore') || trimmed.includes('anomaly')) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#B026FF', '#8A2BE2', '#FFFFFF'],
      });
    }

    const replyId = replyingTo ? replyingTo.id : undefined;
    setInputText('');
    setReplyingTo(null);
    setTyping(activeConversation.id, false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(activeConversation.id, trimmed, 'text', undefined, replyId);
  };

  // File Upload Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    sounds.playClick();
    try {
      const media = await uploadAttachment(file);
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const messageType: MessageType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'file';

      await sendMessage(
        activeConversation.id,
        isImage ? 'Transmitted tactical imagery' : `Transmitted file: ${file.name}`,
        messageType,
        media,
        replyingTo?.id
      );
      setReplyingTo(null);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Transmission failed. Ensure file size is within limits.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice Note Send Handler
  const handleVoiceSend = async (media: MessageMedia) => {
    setIsRecordingVoice(false);
    await sendMessage(
      activeConversation.id,
      'Transmitted encrypted voice log',
      'audio',
      media,
      replyingTo?.id
    );
    setReplyingTo(null);
  };

  // Audio Playback
  const togglePlayAudio = (msgId: string, url: string) => {
    const isPlaying = playingAudios[msgId];
    if (isPlaying) {
      audioElementsRef.current[msgId]?.pause();
      setPlayingAudios((prev) => ({ ...prev, [msgId]: false }));
    } else {
      // Pause any other playing audio
      Object.keys(audioElementsRef.current).forEach((id) => {
        audioElementsRef.current[id]?.pause();
      });
      setPlayingAudios({});

      let audio = audioElementsRef.current[msgId];
      if (!audio) {
        audio = new Audio(url);
        audioElementsRef.current[msgId] = audio;
        audio.onended = () => {
          setPlayingAudios((prev) => ({ ...prev, [msgId]: false }));
        };
      }
      audio.play().catch(() => {});
      setPlayingAudios((prev) => ({ ...prev, [msgId]: true }));
    }
  };

  // Edit Message
  const handleSaveEdit = async (messageId: string) => {
    if (!editingText.trim()) return;
    await editMessage(messageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText('');
    sounds.playClick();
  };

  // Filter messages by in-chat search query
  const displayedMessages = activeMessages.filter((msg) => {
    if (!searchInChatQuery.trim()) return true;
    return (
      msg.content.toLowerCase().includes(searchInChatQuery.toLowerCase()) ||
      msg.sender?.username.toLowerCase().includes(searchInChatQuery.toLowerCase())
    );
  });

  return (
    <main className="flex-1 flex flex-col h-full bg-[#050507]/90 backdrop-blur-md relative overflow-hidden select-text">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Active Conversation Header */}
      <header className="p-3.5 border-b border-[#B026FF]/20 bg-[#100B18]/90 flex items-center justify-between gap-3 select-none z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          {onBackToSidebar && (
            <button
              onClick={() => {
                sounds.playClick();
                onBackToSidebar();
              }}
              className="md:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative flex-shrink-0">
            <img
              src={
                activeConversation.avatar_url ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
              }
              alt={activeConversation.title}
              className="w-10 h-10 rounded-xl object-cover border border-[#B026FF]/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#100B18]" />
          </div>

          <div className="min-w-0">
            <h2 className="font-orbitron font-bold text-white text-sm truncate flex items-center gap-2">
              <span>{activeConversation.title}</span>
              {activeConversation.type === 'group' && (
                <span className="text-[10px] text-[#B026FF] font-tech font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#B026FF]/10 border border-[#B026FF]/30">
                  SQUAD
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#A1A1AA] font-tech truncate">
              {activeConversation.description || 'Encrypted Quantum Connection Stable'}
            </p>
          </div>
        </div>

        {/* Header Tools: In-chat search, Intel Panel Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsSearchActive(!isSearchActive);
              sounds.playClick();
            }}
            title="Search Frequency Transmissions"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSearchActive
                ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/40'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onToggleInfoPanel();
            }}
            title="View Frequency Intel"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#B026FF]" />
          </button>
        </div>
      </header>

      {/* In-Chat Search Bar Toggle */}
      {isSearchActive && (
        <div className="p-2.5 bg-[#100B18] border-b border-[#B026FF]/20 flex items-center gap-2 font-tech text-xs animate-in slide-in-from-top-2 duration-150">
          <Search className="w-3.5 h-3.5 text-[#B026FF]" />
          <input
            type="text"
            autoFocus
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            placeholder="Search words, commands, coordinates in this channel..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-[#A1A1AA]/60"
          />
          {searchInChatQuery && (
            <button
              onClick={() => setSearchInChatQuery('')}
              className="text-[#A1A1AA] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-[#A1A1AA]">
            {displayedMessages.length} results
          </span>
        </div>
      )}

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-[#100B18]/70 border-b border-[#B026FF]/20 flex items-center justify-between text-xs font-tech text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-[#B026FF] flex-shrink-0" />
            <span className="text-[#A1A1AA] font-bold text-[10px] uppercase">PINNED:</span>
            <span className="truncate italic text-zinc-200">
              {pinnedMessages[pinnedMessages.length - 1].content}
            </span>
          </div>
          <span className="text-[10px] text-[#B026FF] font-mono flex-shrink-0 ml-2">
            ({pinnedMessages.length})
          </span>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-tech">
        {displayedMessages.length === 0 ? (
          <div className="text-center py-16 text-[#A1A1AA] text-xs space-y-2">
            <p>No transmissions logged on this channel yet.</p>
            <p className="text-[11px] text-[#B026FF]/80">Be the first to transmit coordinates or chat with miners.</p>
          </div>
        ) : (
          displayedMessages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser.id;
            const sender = msg.sender || allUsers.find((u) => u.id === msg.sender_id);
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`group relative flex items-start gap-3 transition-all ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Sender Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <img
                    src={
                      sender?.avatar_url ||
                      'https://api.dicebear.com/7.x/bottts/svg?seed=' + msg.sender_id
                    }
                    alt={sender?.username || 'Miner'}
                    className="w-8 h-8 rounded-xl object-cover border border-[#B026FF]/30 shadow-sm"
                  />
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender metadata & Callsign */}
                  <div
                    className={`flex items-center gap-2 mb-1 text-[11px] ${
                      isMe ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <span className="font-bold text-white leading-none">
                      {isMe ? 'You' : sender?.username || 'Miner'}
                    </span>
                    {sender?.callsign && (
                      <span className="text-[9px] text-[#B026FF] uppercase font-mono px-1 py-0.2 rounded bg-[#B026FF]/10 border border-[#B026FF]/30">
                        {sender.callsign}
                      </span>
                    )}
                    <span className="text-[10px] text-[#A1A1AA] font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.is_pinned && (
                      <span title="Pinned Transmission">
                        <Pin className="w-3 h-3 text-[#B026FF]" />
                      </span>
                    )}
                  </div>

                  {/* Reply Quote Banner */}
                  {msg.reply_to && (
                    <div
                      className={`text-xs p-2 mb-1.5 rounded-lg border-l-2 border-[#B026FF] bg-[#100B18]/80 text-[#A1A1AA] max-w-full truncate ${
                        isMe ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span className="font-bold text-white text-[10px] block">
                        Replying to {msg.reply_to.sender_name}:
                      </span>
                      <span className="italic line-clamp-1">{msg.reply_to.content}</span>
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  <div
                    className={`relative rounded-2xl px-4 py-2.5 text-sm transition-all shadow-md ${
                      isMe
                        ? 'bg-gradient-to-br from-[#B026FF] to-[#8A2BE2] text-white rounded-tr-sm shadow-[0_0_15px_rgba(176,38,255,0.25)]'
                        : 'bg-[#100B18] border border-[#B026FF]/25 text-zinc-100 rounded-tl-sm'
                    }`}
                  >
                    {/* Inline Editing */}
                    {isEditing ? (
                      <div className="space-y-2 min-w-56">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-[#050507] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5 text-xs">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-0.5 rounded text-[#A1A1AA] hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-0.5 rounded bg-white text-[#B026FF] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Image Transmission */}
                        {msg.type === 'image' && msg.media && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                            <img
                              src={msg.media.url}
                              alt={msg.media.fileName || 'Attachment'}
                              onClick={() => onViewMedia(msg.media!)}
                              className="max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            />
                          </div>
                        )}

                        {/* Video Transmission */}
                        {msg.type === 'video' && msg.media && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                            <video
                              src={msg.media.url}
                              controls
                              className="max-h-64 rounded-lg"
                            />
                          </div>
                        )}

                        {/* File Transmission */}
                        {msg.type === 'file' && msg.media && (
                          <div className="flex items-center gap-3 p-2 bg-[#050507]/40 rounded-xl mb-1 border border-white/10">
                            <File className="w-5 h-5 text-white" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-white">
                                {msg.media.fileName}
                              </p>
                              <p className="text-[10px] text-zinc-300">
                                {Math.round((msg.media.fileSize || 0) / 1024)} KB
                              </p>
                            </div>
                            <a
                              href={msg.media.url}
                              download={msg.media.fileName}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        {/* Voice Transmission */}
                        {msg.type === 'audio' && msg.media && (
                          <div className="flex items-center gap-3 py-1 min-w-48">
                            <button
                              onClick={() => togglePlayAudio(msg.id, msg.media!.url)}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
                            >
                              {playingAudios[msg.id] ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-white rounded-full ${
                                    playingAudios[msg.id] ? 'animate-pulse' : ''
                                  }`}
                                  style={{ width: playingAudios[msg.id] ? '70%' : '15%' }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-white/80 mt-1 font-mono">
                                <span>Voice Memo</span>
                                <span>{msg.media.duration ? `${msg.media.duration}s` : '0:05'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Text Message Content */}
                        {msg.content && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}

                        {/* Footer status & Edited tag */}
                        <div
                          className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                            isMe ? 'justify-end text-white/80' : 'justify-end text-[#A1A1AA]'
                          }`}
                        >
                          {msg.is_edited && <span className="italic">(edited)</span>}
                          {isMe && (
                            <span title="Delivered to quantum mesh">
                              <CheckCheck className="w-3.5 h-3.5 text-white" />
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reactions Pill Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {/* Group reactions by emoji */}
                      {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                        const count = msg.reactions.filter((r) => r.emoji === emoji).length;
                        const hasReacted = msg.reactions.some(
                          (r) => r.emoji === emoji && r.user_id === currentUser.id
                        );

                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-[#B026FF]/30 border border-[#B026FF] text-white shadow-[0_0_8px_rgba(176,38,255,0.4)]'
                                : 'bg-[#100B18] border border-zinc-800 text-[#A1A1AA] hover:border-[#B026FF]/50'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Hover Action Menu */}
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#100B18] border border-[#B026FF]/40 rounded-xl p-1 shadow-lg z-20 ${
                    isMe ? 'mr-1' : 'ml-1'
                  }`}
                >
                  {/* Emoji Quick React */}
                  <button
                    onClick={() =>
                      setActiveReactionPickerMsgId(
                        activeReactionPickerMsgId === msg.id ? null : msg.id
                      )
                    }
                    title="Add Reaction"
                    className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#B026FF] hover:bg-white/5 cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {/* Reply */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setReplyingTo(msg);
                      textareaRef.current?.focus();
                    }}
                    title="Reply"
                    className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#B026FF] hover:bg-white/5 cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {/* Pin */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      togglePinMessage(msg.id);
                    }}
                    title={msg.is_pinned ? 'Unpin' : 'Pin to Frequency'}
                    className={`p-1 rounded-lg hover:bg-white/5 cursor-pointer ${
                      msg.is_pinned ? 'text-[#B026FF]' : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit (if sender is me) */}
                  {isMe && msg.type === 'text' && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setEditingMessageId(msg.id);
                        setEditingText(msg.content);
                      }}
                      title="Edit Message"
                      className="p-1 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete (if sender is me) */}
                  {isMe && (
                    <button
                      onClick={() => {
                        if (confirm('Delete transmission?')) {
                          sounds.playClick();
                          deleteMessage(msg.id);
                        }
                      }}
                      title="Delete Message"
                      className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Popover Emoji Picker */}
                {activeReactionPickerMsgId === msg.id && (
                  <div
                    className={`absolute bottom-full mb-2 z-30 flex items-center gap-1.5 p-1.5 rounded-xl glass-dropdown border border-[#B026FF]/40 shadow-[0_0_15px_rgba(176,38,255,0.3)] animate-in zoom-in-95 ${
                      isMe ? 'right-12' : 'left-12'
                    }`}
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          toggleReaction(msg.id, emoji);
                          setActiveReactionPickerMsgId(null);
                        }}
                        className="text-base p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#B026FF] animate-pulse py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF]" />
            </div>
            <span>
              {typingUsers.map((t) => t.username).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is typing transmission...' : 'are typing transmissions...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner (if replying) */}
      {replyingTo && (
        <div className="p-2.5 bg-[#100B18] border-t border-[#B026FF]/25 flex items-center justify-between text-xs font-tech text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-[#B026FF]" />
            <div>
              <span className="font-bold text-[#D8B4FE]">
                Replying to {replyingTo.sender?.username || 'Miner'}:
              </span>{' '}
              <span className="text-[#A1A1AA] italic truncate max-w-xs inline-block align-bottom">
                {replyingTo.content}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#A1A1AA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Message Input Console */}
      <footer className="p-3 bg-[#100B18]/95 border-t border-[#B026FF]/20 select-none">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleVoiceSend}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <div className="flex items-end gap-2 font-tech">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach File or Image"
              disabled={isUploading}
              className="p-2.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-[#B026FF]/30 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-[#B026FF]" />
            </button>

            {/* Emoji Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Insert Holographic Emoji"
                className="p-2.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-[#B026FF]/30 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4 text-[#B026FF]" />
              </button>

              {/* Emoji Picker Dropdown */}
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-40 p-2 rounded-xl glass-dropdown border border-[#B026FF]/40 shadow-[0_0_20px_rgba(176,38,255,0.3)] grid grid-cols-4 gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                        textareaRef.current?.focus();
                        sounds.playClick();
                      }}
                      className="text-lg p-1.5 hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Transmit encrypted message to sector... (Enter to send)"
                className="w-full bg-[#050507] border border-[#B026FF]/35 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#A1A1AA]/50 focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF] resize-none max-h-32"
              />
            </div>

            {/* Voice Record Button (when input empty) */}
            {!inputText.trim() && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsRecordingVoice(true);
                }}
                title="Record Voice Log"
                className="p-2.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-[#B026FF]/30 text-[#A1A1AA] hover:text-[#B026FF] transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#B026FF]" />
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isUploading}
              title="Transmit Message"
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] hover:shadow-[0_0_15px_#B026FF] text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </footer>
    </main>
  );
};
