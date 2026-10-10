import React, { useState } from 'react';
import {
  Radio,
  Flame,
  Volume2,
  VolumeX,
  Database,
  Users,
  ChevronDown,
  Sparkles,
  Pickaxe,
  Trophy,
  ShoppingBag,
  Compass,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface VoidNavbarProps {
  currentTab: 'chat' | 'command' | 'rig' | 'leaderboard';
  setCurrentTab: (tab: 'chat' | 'command' | 'rig' | 'leaderboard') => void;
  onOpenSetup: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const VoidNavbar: React.FC<VoidNavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSetup,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { currentUser, allUsers, switchUser, isSupabaseLive, isRealUser, updateStatus, signOut } = useAuth();
  const { conversations } = useChat();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Calculate total unread messages
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  const handleSignOut = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAuthError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      setShowUserDropdown(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const statusColors = {
    online: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    mining: 'bg-[#B026FF] shadow-[0_0_8px_#B026FF]',
    away: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    offline: 'bg-zinc-600',
  };

  return (
    <header className="relative z-30 w-full bg-[#100B18]/90 border-b border-[#B026FF]/20 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setCurrentTab('command');
              sounds.playClick();
            }}
            className="flex items-center gap-3 text-left group transition-transform active:scale-95 cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#B026FF] to-[#100B18] p-0.5 shadow-[0_0_15px_rgba(176,38,255,0.4)]">
              <div className="w-full h-full bg-[#050507] rounded-[10px] flex items-center justify-center">
                <Pickaxe className="w-5 h-5 text-[#B026FF] group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#B026FF] rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-extrabold text-lg tracking-wider text-white group-hover:text-[#B026FF] transition-colors">
                  VOID<span className="text-[#B026FF]">MINER</span>
                </span>
                <span className="text-[10px] uppercase font-tech tracking-widest text-[#B026FF] bg-[#B026FF]/10 px-1.5 py-0.5 rounded border border-[#B026FF]/30">
                  v3.8 SEC
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] font-tech tracking-wide -mt-0.5">
                DEEP VOID EXTRACTION PROTOCOL
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-tech tracking-wider text-sm">
            <button
              onClick={() => {
                setCurrentTab('command');
                sounds.playClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentTab === 'command'
                  ? 'bg-[#B026FF]/20 text-white border border-[#B026FF]/40 shadow-[0_0_12px_rgba(176,38,255,0.25)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-[#B026FF]" />
              COMMAND DECK
            </button>

            <button
              onClick={() => {
                setCurrentTab('rig');
                sounds.playClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentTab === 'rig'
                  ? 'bg-[#B026FF]/20 text-white border border-[#B026FF]/40 shadow-[0_0_12px_rgba(176,38,255,0.25)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4 text-[#B026FF]" />
              MINING RIG
            </button>

            {/* COMMS / CHAT BUTTON */}
            <button
              onClick={() => {
                setCurrentTab('chat');
                sounds.playClick();
              }}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                currentTab === 'chat'
                  ? 'bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] text-white shadow-[0_0_16px_rgba(176,38,255,0.5)] border border-white/20'
                  : 'text-white bg-[#B026FF]/15 hover:bg-[#B026FF]/25 border border-[#B026FF]/35'
              }`}
            >
              <Radio className="w-4 h-4 animate-pulse text-white" />
              <span>COMMS / CHAT</span>
              {totalUnread > 0 && (
                <span className="ml-1 bg-white text-[#B026FF] text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-5 text-center shadow-[0_0_8px_#ffffff]">
                  {totalUnread}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('leaderboard');
                sounds.playClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentTab === 'leaderboard'
                  ? 'bg-[#B026FF]/20 text-white border border-[#B026FF]/40 shadow-[0_0_12px_rgba(176,38,255,0.25)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#B026FF]" />
              LEADERBOARD
            </button>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Ore Counter */}
          <div className="hidden lg:flex items-center gap-2 bg-[#050507]/80 border border-[#B026FF]/30 px-3 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#B026FF] animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-[#A1A1AA] block leading-tight font-tech">VOID ORE</span>
              <span className="text-xs font-orbitron font-bold text-white tracking-wider">
                {currentUser.ore_balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Database Setup Button / Status */}
          <button
            onClick={() => {
              onOpenSetup();
              sounds.playClick();
            }}
            title={isSupabaseLive ? 'Connected to existing Supabase' : 'Configure Supabase Database'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-tech tracking-wider border transition-all cursor-pointer ${
              isSupabaseLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-[#B026FF]/10 text-[#D8B4FE] border-[#B026FF]/30 hover:bg-[#B026FF]/20'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabaseLive ? 'SUPABASE LIVE' : 'SUPABASE CONFIG'}
            </span>
          </button>

          {/* Account / Authenticate Button */}
          <button
            onClick={() => {
              if (isRealUser) {
                setShowUserDropdown((open) => !open);
              } else {
                onOpenAuth();
              }
              sounds.playClick();
            }}
            title={isRealUser ? `Authenticated as ${currentUser.username}` : 'Sign in with existing Supabase account'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-tech tracking-wider border transition-all cursor-pointer ${
              isRealUser
                ? 'bg-[#B026FF]/20 text-white border-[#B026FF] shadow-[0_0_10px_rgba(176,38,255,0.3)]'
                : 'bg-[#050507] text-[#A1A1AA] hover:text-white border-zinc-800 hover:border-[#B026FF]/40'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#B026FF]" />
            <span className="hidden sm:inline">
              {isRealUser ? 'ACCOUNT' : 'SIGN IN'}
            </span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Disable Audio Cues' : 'Enable Audio Cues'}
            className="w-8 h-8 rounded-lg bg-[#050507] border border-[#B026FF]/30 text-[#A1A1AA] hover:text-white hover:border-[#B026FF] flex items-center justify-center transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#B026FF]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Current User Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 bg-[#050507] hover:bg-[#100B18] border border-[#B026FF]/35 hover:border-[#B026FF] px-2.5 py-1.5 rounded-xl transition-all cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-lg object-cover border border-[#B026FF]/40"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#050507] ${
                    statusColors[currentUser.status]
                  }`}
                />
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-[#B026FF] transition-colors leading-tight">
                    {currentUser.username}
                  </span>
                </div>
                <span className="text-[10px] text-[#A1A1AA] font-tech block leading-none">
                  {currentUser.callsign} · {currentUser.mining_rank}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-white transition-transform" />
            </button>

            {/* Dropdown Menu: Profile actions + Instant User Switch for multi-user demo testing */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-72 glass-dropdown rounded-xl p-2 z-50 text-xs font-tech animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="p-2 border-b border-[#B026FF]/20 flex items-center gap-3">
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-10 h-10 rounded-xl object-cover border border-[#B026FF]/50"
                  />
                  <div>
                    <p className="font-bold text-white text-sm">{currentUser.username}</p>
                    <p className="text-[11px] text-[#B026FF]">{currentUser.callsign} | {currentUser.mining_rank}</p>
                    <p className="text-[10px] text-[#A1A1AA] line-clamp-1 italic">{currentUser.status_message || currentUser.bio}</p>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="p-2 border-b border-[#B026FF]/20">
                  <p className="text-[10px] uppercase text-[#A1A1AA] mb-1.5 tracking-wider">SET STATUS</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['online', 'mining', 'away', 'offline'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(st);
                          sounds.playClick();
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] capitalize cursor-pointer border transition-colors ${
                          currentUser.status === st
                            ? 'bg-[#B026FF]/20 text-white border-[#B026FF]'
                            : 'text-[#A1A1AA] border-transparent hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusColors[st]}`} />
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-1">
                  {!isRealUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserDropdown(false);
                        onOpenAuth();
                        sounds.playClick();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#B026FF]/15 text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Supabase Sign In / Register</span>
                      <span className="text-[#B026FF] text-[10px]">🔑</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserDropdown(false);
                      onOpenProfile();
                      sounds.playClick();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#B026FF]/15 text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Edit Miner Profile</span>
                    <span className="text-[#B026FF] text-[10px]">⚙️</span>
                  </button>
                  {isRealUser && (
                    <button
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-rose-300 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {authError && (
                  <p role="alert" className="mx-2 mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-200">
                    {authError}
                  </p>
                )}

                {/* Instant Profile Switcher (Ideal for testing 2-way real-time messaging) */}
                {!isRealUser && (
                  <div className="p-2 pt-1 border-t border-[#B026FF]/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">
                      SWITCH PLAYER (REAL-TIME TEST)
                    </span>
                    <Users className="w-3 h-3 text-[#B026FF]" />
                  </div>
                  <div className="space-y-1">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          switchUser(user.id);
                          setShowUserDropdown(false);
                          sounds.playClick();
                        }}
                        className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          user.id === currentUser.id
                            ? 'bg-[#B026FF]/25 border border-[#B026FF]/50 text-white'
                            : 'hover:bg-white/5 text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-6 h-6 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] truncate">{user.username}</p>
                          <p className="text-[9px] text-[#A1A1AA] truncate">{user.callsign}</p>
                        </div>
                        {user.id === currentUser.id && (
                          <span className="text-[9px] text-[#B026FF] font-bold">ACTIVE</span>
                        )}
                      </button>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex md:hidden items-center justify-around pt-2 mt-2 border-t border-[#B026FF]/15 font-tech text-xs">
        <button
          onClick={() => {
            setCurrentTab('command');
            sounds.playClick();
          }}
          className={`flex items-center gap-1 py-1 px-2.5 rounded ${
            currentTab === 'command' ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40' : 'text-[#A1A1AA]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          COMMAND
        </button>
        <button
          onClick={() => {
            setCurrentTab('rig');
            sounds.playClick();
          }}
          className={`flex items-center gap-1 py-1 px-2.5 rounded ${
            currentTab === 'rig' ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40' : 'text-[#A1A1AA]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          RIG
        </button>
        <button
          onClick={() => {
            setCurrentTab('chat');
            sounds.playClick();
          }}
          className={`relative flex items-center gap-1 py-1 px-3 rounded font-bold ${
            currentTab === 'chat'
              ? 'text-white bg-[#B026FF] shadow-[0_0_10px_#B026FF]'
              : 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          COMMS
          {totalUnread > 0 && (
            <span className="bg-white text-[#B026FF] text-[9px] px-1 rounded-full font-black">
              {totalUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setCurrentTab('leaderboard');
            sounds.playClick();
          }}
          className={`flex items-center gap-1 py-1 px-2.5 rounded ${
            currentTab === 'leaderboard' ? 'text-white bg-[#B026FF]/20 border border-[#B026FF]/40' : 'text-[#A1A1AA]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          RANKS
        </button>
      </div>
    </header>
  );
};
