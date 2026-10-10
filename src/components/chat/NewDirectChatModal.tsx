import React, { useState } from 'react';
import { X, Search, Radio, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface NewDirectChatModalProps {
  onClose: () => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({ onClose }) => {
  const { allUsers, currentUser } = useAuth();
  const { createDirectChat } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = allUsers
    .filter((u) => u.id !== currentUser.id)
    .filter(
      (u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.mining_rank.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSelectUser = async (userId: string) => {
    sounds.playClick();
    await createDirectChat(userId);
    onClose();
  };

  const statusColors = {
    online: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    mining: 'bg-[#B026FF] shadow-[0_0_8px_#B026FF]',
    away: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    offline: 'bg-zinc-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-dropdown rounded-2xl border border-[#B026FF]/40 shadow-[0_0_30px_rgba(176,38,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#B026FF]/20 bg-[#100B18]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#B026FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">
              OPEN DIRECT HOLO-LINK
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#B026FF]/15">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search miners by callsign, name or rank..."
              className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#B026FF] font-tech"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="max-h-72 overflow-y-auto p-3 space-y-1.5 font-tech">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-[#A1A1AA] text-xs">
              No operative matched your search parameters.
            </div>
          ) : (
            candidates.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#050507]/50 hover:bg-[#B026FF]/15 border border-zinc-800/80 hover:border-[#B026FF]/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-9 h-9 rounded-xl object-cover border border-[#B026FF]/30"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#050507] ${
                        statusColors[user.status]
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm group-hover:text-[#B026FF] transition-colors leading-tight">
                      {user.username}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA]">
                      {user.callsign} · <span className="text-[#D8B4FE]">{user.mining_rank}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#A1A1AA] group-hover:text-[#B026FF] transition-colors">
                  <span className="text-[11px] uppercase tracking-wider">LINK</span>
                  <UserCheck className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
