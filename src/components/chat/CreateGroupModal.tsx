import React, { useState } from 'react';
import { X, Users, Shield, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface CreateGroupModalProps {
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const { allUsers, currentUser } = useAuth();
  const { createGroup } = useChat();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const toggleUser = (userId: string) => {
    sounds.playClick();
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createGroup(title.trim(), description.trim(), selectedAvatar, selectedUserIds);
      sounds.playMessageSent();
      onClose();
    } catch (err) {
      console.error('Failed to create squad:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-dropdown rounded-2xl border border-[#B026FF]/40 shadow-[0_0_30px_rgba(176,38,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#B026FF]/20 bg-[#100B18]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B026FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">
              INITIALIZE MINING SQUAD
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-tech">
          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] tracking-wider mb-1">
              Squad Name / Callsign *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex Void Drifters"
              className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] tracking-wider mb-1">
              Sector Mission / Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High-density dark matter core excavation"
              className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] tracking-wider mb-2">
              Squad Crest / Insignia
            </label>
            <div className="flex items-center gap-3">
              {AVATAR_PRESETS.map((avatar, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    sounds.playClick();
                  }}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedAvatar === avatar
                      ? 'border-[#B026FF] scale-105 shadow-[0_0_12px_#B026FF]'
                      : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-[#B026FF]/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] tracking-wider mb-2">
              Recruit Miners ({selectedUserIds.length} Selected)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {availableUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#B026FF]/20 border-[#B026FF] text-white shadow-[0_0_8px_rgba(176,38,255,0.2)]'
                        : 'bg-[#050507]/60 border-zinc-800/80 text-[#A1A1AA] hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-xs leading-none">{user.username}</p>
                        <p className="text-[10px] text-[#A1A1AA] mt-0.5">{user.mining_rank} · {user.callsign}</p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-[#B026FF] border-[#B026FF]' : 'border-zinc-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] hover:shadow-[0_0_15px_#B026FF] text-white font-bold text-xs tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>ESTABLISH SQUAD</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
