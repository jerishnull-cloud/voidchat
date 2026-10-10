import React, { useState } from 'react';
import { X, User, Save, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../lib/sounds';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateProfile } = useAuth();

  const [username, setUsername] = useState(currentUser.username);
  const [callsign, setCallsign] = useState(currentUser.callsign);
  const [bio, setBio] = useState(currentUser.bio);
  const [statusMessage, setStatusMessage] = useState(currentUser.status_message || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        callsign: callsign.trim(),
        bio: bio.trim(),
        status_message: statusMessage.trim(),
        avatar_url: avatarUrl.trim(),
      });
      sounds.playReaction();
      onClose();
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-dropdown rounded-2xl border border-[#B026FF]/40 shadow-[0_0_30px_rgba(176,38,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#B026FF]/20 bg-[#100B18]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#B026FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">
              MINER DOSSIER & PROFILE
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
        <form onSubmit={handleSave} className="p-5 space-y-4 font-tech">
          {/* Avatar preview and input */}
          <div className="flex items-center gap-4 p-3 bg-[#050507] rounded-xl border border-[#B026FF]/20">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-14 h-14 rounded-xl object-cover border-2 border-[#B026FF] shadow-[0_0_10px_#B026FF]"
              onError={(e) => {
                // fallback
                (e.target as HTMLImageElement).src =
                  'https://api.dicebear.com/7.x/bottts/svg?seed=' + username;
              }}
            />
            <div className="flex-1">
              <label className="block text-[11px] uppercase text-[#A1A1AA] mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#100B18] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#B026FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase text-[#A1A1AA] mb-1">
                Player Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-[#A1A1AA] mb-1">
                Callsign Tag
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="VM-TITAN"
                className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] mb-1">
              Status Hologram (What are you mining?)
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Overclocking plasma drill at Sector 9"
              className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-[#A1A1AA] mb-1">
              Bio / Operative Log
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Mission logs, specialties, guild affiliations..."
              className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF] resize-none"
            />
          </div>

          {/* Badges and Rank info */}
          <div className="p-3 bg-[#100B18] rounded-xl border border-[#B026FF]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B026FF]" />
              <span className="text-[#A1A1AA]">RANK:</span>
              <span className="font-bold text-white">{currentUser.mining_rank}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#B026FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentUser.ore_balance.toLocaleString()} ORE</span>
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
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] hover:shadow-[0_0_15px_#B026FF] text-white font-bold text-xs tracking-wider transition-all disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'UPDATING...' : 'SAVE DOSSIER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
