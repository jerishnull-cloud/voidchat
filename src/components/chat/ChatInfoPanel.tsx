import React, { useState } from 'react';
import {
  X,
  Bell,
  BellOff,
  Trash2,
  Ban,
  Flag,
  Users,
  Image,
  FileText,
  Shield,
  Sparkles,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import { Conversation, MessageMedia, UserProfile } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface ChatInfoPanelProps {
  conversation: Conversation;
  onClose: () => void;
  onViewMedia: (media: MessageMedia) => void;
}

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  conversation,
  onClose,
  onViewMedia,
}) => {
  const { currentUser, allUsers, blockUser, reportUser } = useAuth();
  const {
    activeMessages,
    toggleMuteConversation,
    deleteConversation,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'members' | 'media'>('members');
  const [reportReason, setReportReason] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Collect shared media in this conversation
  const sharedMediaMessages = activeMessages.filter(
    (m) => m.media && (m.type === 'image' || m.type === 'video' || m.type === 'file')
  );

  // Group members or target user
  const otherUser = conversation.type === 'direct'
    ? allUsers.find((u) => u.username === conversation.title) || conversation.other_user
    : null;

  const handleMute = () => {
    sounds.playClick();
    toggleMuteConversation(conversation.id);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to terminate this comms frequency?')) {
      sounds.playClick();
      deleteConversation(conversation.id);
      onClose();
    }
  };

  const handleBlock = () => {
    if (otherUser) {
      if (confirm(`Block operative ${otherUser.username}? You will no longer receive transmissions.`)) {
        sounds.playClick();
        blockUser(otherUser.id);
        onClose();
      }
    }
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (otherUser && reportReason) {
      sounds.playReaction();
      reportUser(otherUser.id, reportReason);
      alert('Security dispatch logged. Fleet command is reviewing this incident.');
      setShowReportDialog(false);
      setReportReason('');
    }
  };

  return (
    <aside className="w-80 lg:w-88 flex flex-col h-full bg-[#100B18]/90 border-l border-[#B026FF]/20 backdrop-blur-md select-none font-tech animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-[#B026FF]/20 bg-[#050507]/40 flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-xs tracking-wider text-white">
          FREQUENCY INTEL
        </h3>
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card / Group Overview */}
        <div className="text-center p-4 bg-[#050507]/60 rounded-2xl border border-[#B026FF]/20">
          <img
            src={
              conversation.avatar_url ||
              otherUser?.avatar_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
            }
            alt={conversation.title}
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 border-2 border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.4)]"
          />
          <h4 className="font-orbitron font-bold text-white text-base leading-tight">
            {conversation.title}
          </h4>
          <p className="text-xs text-[#B026FF] mt-0.5">
            {conversation.type === 'group' ? 'OPERATIONAL SQUAD' : otherUser?.callsign || 'DIRECT COMMS'}
          </p>
          <p className="text-xs text-[#A1A1AA] mt-2 italic px-2">
            {conversation.description || otherUser?.bio || 'Frequency encrypted and operational.'}
          </p>

          {/* Quick stats for direct user */}
          {otherUser && (
            <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2 text-left text-xs">
              <div>
                <span className="text-[10px] text-[#A1A1AA] block">RANK</span>
                <span className="font-bold text-white">{otherUser.mining_rank}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A1A1AA] block">STATUS</span>
                <span className="font-bold text-emerald-400 capitalize">{otherUser.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleMute}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              conversation.is_muted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#050507] hover:bg-white/5 text-[#A1A1AA] border-zinc-800'
            }`}
          >
            {conversation.is_muted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{conversation.is_muted ? 'UNMUTE' : 'MUTE'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#050507] hover:bg-red-500/15 border border-zinc-800 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>DISMISS</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#B026FF]/20 text-xs font-bold">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-colors ${
              activeTab === 'members'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            {conversation.type === 'group' ? 'SQUAD ROSTER' : 'OPERATIVE INFO'}
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-colors ${
              activeTab === 'media'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            MEDIA ({sharedMediaMessages.length})
          </button>
        </div>

        {/* Members Roster */}
        {activeTab === 'members' && (
          <div className="space-y-2">
            {conversation.type === 'group' ? (
              allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#050507]/40 border border-zinc-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-7 h-7 rounded-lg object-cover border border-[#B026FF]/30"
                    />
                    <div>
                      <p className="font-bold text-xs text-white leading-tight">
                        {user.username}
                      </p>
                      <p className="text-[10px] text-[#A1A1AA]">{user.mining_rank}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#B026FF] font-mono">
                    {user.id === currentUser.id ? 'YOU' : 'SQUAD'}
                  </span>
                </div>
              ))
            ) : (
              otherUser && (
                <div className="p-3 bg-[#050507]/40 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div>
                    <span className="text-[#A1A1AA] text-[10px] uppercase block">CALLSIGN</span>
                    <span className="text-white font-mono font-bold">{otherUser.callsign}</span>
                  </div>
                  <div>
                    <span className="text-[#A1A1AA] text-[10px] uppercase block">CURRENT HARVEST YIELD</span>
                    <span className="text-[#D8B4FE] font-mono font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#B026FF]" />
                      {otherUser.ore_balance.toLocaleString()} VOID ORE
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Shared Media Gallery */}
        {activeTab === 'media' && (
          <div>
            {sharedMediaMessages.length === 0 ? (
              <div className="text-center py-8 text-[#A1A1AA] text-xs">
                No holographic files or scans transmitted in this frequency yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sharedMediaMessages.map((msg) =>
                  msg.media ? (
                    <button
                      key={msg.id}
                      onClick={() => {
                        sounds.playClick();
                        onViewMedia(msg.media!);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[#B026FF]/30 hover:border-[#B026FF] group transition-all cursor-pointer"
                    >
                      <img
                        src={msg.media.url}
                        alt="Shared"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* Danger Zone: Block & Report */}
        {otherUser && (
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              SECURITY & MODERATION
            </span>
            <button
              onClick={handleBlock}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
            >
              <span>Block Operative</span>
              <Ban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowReportDialog(true)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <span>Report Security Breach</span>
              <Flag className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Report Modal Dialog */}
        {showReportDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm glass-dropdown rounded-2xl p-4 border border-[#B026FF]/40 shadow-[0_0_20px_#B026FF]">
              <h4 className="font-orbitron font-bold text-white text-sm mb-2">
                TRANSMIT SECURITY DISPATCH
              </h4>
              <p className="text-xs text-[#A1A1AA] mb-3">
                Flag user for abusive comms, piracy, or harassment.
              </p>
              <form onSubmit={handleReport} className="space-y-3">
                <textarea
                  required
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe incident in Sector..."
                  className="w-full bg-[#050507] border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#B026FF]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportDialog(false)}
                    className="px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Send Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
