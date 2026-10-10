import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Radio,
  Pin,
  BellOff,
  Flame,
  Sparkles,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Conversation, UserProfile } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface ChatSidebarProps {
  onOpenCreateGroup: () => void;
  onOpenNewDirect: () => void;
  onOpenProfile: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onOpenCreateGroup,
  onOpenNewDirect,
  onOpenProfile,
}) => {
  const { currentUser, allUsers } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
  } = useChat();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');

  const statusColors = {
    online: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    mining: 'bg-[#B026FF] shadow-[0_0_8px_#B026FF]',
    away: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    offline: 'bg-zinc-600',
  };

  // Online friends list (excluding current user)
  const onlineFriends = allUsers.filter(
    (u) => u.id !== currentUser.id && u.status !== 'offline'
  );

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((c) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'direct' && c.type === 'direct') ||
      (activeTab === 'groups' && c.type === 'group');

    const matchesSearch =
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchFilter.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#100B18]/80 border-r border-[#B026FF]/20 backdrop-blur-md select-none">
      {/* Top Header / Profile Bar */}
      <div className="p-3.5 border-b border-[#B026FF]/20 bg-[#050507]/40 flex items-center justify-between">
        <button
          onClick={() => {
            onOpenProfile();
            sounds.playClick();
          }}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="relative">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-10 h-10 rounded-xl object-cover border border-[#B026FF]/40 group-hover:border-[#B026FF] group-hover:shadow-[0_0_10px_#B026FF] transition-all"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#100B18] ${
                statusColors[currentUser.status]
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm group-hover:text-[#B026FF] transition-colors">
                {currentUser.username}
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] font-tech leading-tight">
              {currentUser.callsign} · <span className="text-[#D8B4FE]">{currentUser.mining_rank}</span>
            </p>
          </div>
        </button>

        {/* Action button to create squad or DM */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onOpenNewDirect();
              sounds.playClick();
            }}
            title="Direct Holo-Link"
            className="w-8 h-8 rounded-lg bg-[#050507] hover:bg-[#B026FF]/20 border border-[#B026FF]/30 text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-[#B026FF]" />
          </button>
          <button
            onClick={() => {
              onOpenCreateGroup();
              sounds.playClick();
            }}
            title="Form Mining Squad"
            className="w-8 h-8 rounded-lg bg-[#050507] hover:bg-[#B026FF]/20 border border-[#B026FF]/30 text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B026FF]" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#B026FF]/15">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search comms frequencies..."
            className="w-full bg-[#050507]/90 border border-[#B026FF]/25 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#B026FF] font-tech"
          />
        </div>
      </div>

      {/* Online Miners Strip */}
      <div className="px-3 py-2.5 border-b border-[#B026FF]/15 bg-[#050507]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-tech tracking-wider text-[#A1A1AA] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ACTIVE MINERS IN SECTOR ({onlineFriends.length})
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {onlineFriends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => {
                onOpenNewDirect();
                sounds.playClick();
              }}
              title={`${friend.username} (${friend.status})`}
              className="relative flex-shrink-0 group cursor-pointer"
            >
              <img
                src={friend.avatar_url}
                alt={friend.username}
                className="w-8 h-8 rounded-xl object-cover border border-[#B026FF]/30 group-hover:border-[#B026FF] group-hover:scale-105 transition-all"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#050507] ${
                  statusColors[friend.status]
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Channel / Conversation Type Tabs */}
      <div className="flex items-center justify-around border-b border-[#B026FF]/15 px-2 py-1 font-tech text-xs bg-[#050507]/30">
        <button
          onClick={() => {
            setActiveTab('all');
            sounds.playClick();
          }}
          className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          ALL FREQUENCIES
        </button>
        <button
          onClick={() => {
            setActiveTab('groups');
            sounds.playClick();
          }}
          className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'groups'
              ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          SQUADS ({conversations.filter((c) => c.type === 'group').length})
        </button>
        <button
          onClick={() => {
            setActiveTab('direct');
            sounds.playClick();
          }}
          className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'direct'
              ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          DIRECT ({conversations.filter((c) => c.type === 'direct').length})
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-tech">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-10 px-4 text-[#A1A1AA] text-xs">
            <Radio className="w-8 h-8 text-[#B026FF]/40 mx-auto mb-2 animate-pulse" />
            <p>No active comms found on this channel.</p>
            <button
              onClick={onOpenCreateGroup}
              className="mt-3 text-xs text-[#B026FF] underline hover:text-white cursor-pointer"
            >
              Initialize a new squad
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const hasUnread = (conv.unread_count || 0) > 0;

            return (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  sounds.playClick();
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B026FF]/25 to-[#100B18] border border-[#B026FF]/60 shadow-[0_0_15px_rgba(176,38,255,0.2)]'
                    : 'bg-[#050507]/40 hover:bg-[#B026FF]/10 border border-transparent hover:border-[#B026FF]/30'
                }`}
              >
                {/* Conversation Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      conv.avatar_url ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={conv.title}
                    className="w-11 h-11 rounded-xl object-cover border border-[#B026FF]/30 group-hover:border-[#B026FF]"
                  />
                  {conv.type === 'group' ? (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-[#100B18] border border-[#B026FF] flex items-center justify-center text-[9px] text-[#B026FF]">
                      <Users className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#050507]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4
                      className={`font-bold text-sm truncate ${
                        isActive || hasUnread ? 'text-white' : 'text-[#E4E4E7]'
                      }`}
                    >
                      {conv.title}
                    </h4>
                    <span className="text-[10px] text-[#A1A1AA] flex-shrink-0 font-mono">
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-[#A1A1AA] truncate leading-tight">
                      {conv.last_message ? (
                        <>
                          <span className="text-zinc-400">
                            {conv.last_message.sender?.username || 'Miner'}:{' '}
                          </span>
                          {conv.last_message.type === 'image'
                            ? '📷 [Cosmic Image]'
                            : conv.last_message.type === 'audio'
                            ? '🎙️ [Voice Memo]'
                            : conv.last_message.content}
                        </>
                      ) : (
                        conv.description || 'Frequency open'
                      )}
                    </p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.is_muted && (
                        <BellOff className="w-3 h-3 text-zinc-500" />
                      )}
                      {hasUnread && (
                        <span className="bg-[#B026FF] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-[0_0_6px_#B026FF]">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
