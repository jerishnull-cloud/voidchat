import React from 'react';
import {
  Compass,
  Radio,
  Flame,
  Sparkles,
  Shield,
  Activity,
  Layers,
  Zap,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';

interface CommandDeckPageProps {
  onNavigateToChat: () => void;
  onNavigateToRig: () => void;
}

export const CommandDeckPage: React.FC<CommandDeckPageProps> = ({
  onNavigateToChat,
  onNavigateToRig,
}) => {
  const { currentUser, allUsers } = useAuth();
  const { conversations } = useChat();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-tech">
      {/* Hero Sector Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#B026FF]/40 bg-gradient-to-r from-[#100B18]/90 via-[#050507]/90 to-[#100B18]/90 p-6 sm:p-8 shadow-[0_0_40px_rgba(176,38,255,0.25)]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs uppercase font-orbitron tracking-widest text-[#B026FF]">
              SECTOR 9 ANOMALY DETECTED
            </span>
          </div>
          <h1 className="font-orbitron font-extrabold text-2xl sm:text-4xl text-white tracking-wide">
            WELCOME TO <span className="text-[#B026FF]">VOID MINER</span> COMMAND
          </h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Extract cosmic matter from collapsed neutron stars. Coordinate planetary strikes, monitor drill heat, and communicate with fleet operatives over encrypted real-time quantum comms.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onNavigateToChat();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] hover:shadow-[0_0_20px_#B026FF] text-white font-orbitron text-xs font-bold tracking-wider transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>ACCESS FLEET COMMS</span>
              {totalUnread > 0 && (
                <span className="bg-white text-[#B026FF] px-1.5 py-0.2 rounded-full text-[10px]">
                  {totalUnread}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onNavigateToRig();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-[#B026FF]/40 text-white font-orbitron text-xs font-bold tracking-wider transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#B026FF]" />
              <span>DEPLOY MINING RIG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-1">
          <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
            <span>OPERATIVE CALLSIGN</span>
            <Shield className="w-4 h-4 text-[#B026FF]" />
          </div>
          <p className="font-orbitron font-bold text-lg text-white">{currentUser.callsign}</p>
          <p className="text-xs text-[#B026FF]">{currentUser.mining_rank}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-1">
          <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
            <span>VOID ORE EXTRACTED</span>
            <Sparkles className="w-4 h-4 text-[#B026FF]" />
          </div>
          <p className="font-orbitron font-bold text-lg text-white">
            {currentUser.ore_balance.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-400">+1,450 / hr telemetry</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-1">
          <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
            <span>COMMS FREQUENCIES</span>
            <Radio className="w-4 h-4 text-[#B026FF]" />
          </div>
          <p className="font-orbitron font-bold text-lg text-white">
            {conversations.length} Active
          </p>
          <p className="text-xs text-[#A1A1AA]">{totalUnread} Unread Transmissions</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-1">
          <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
            <span>SECTOR FLEET ROSTER</span>
            <Activity className="w-4 h-4 text-[#B026FF]" />
          </div>
          <p className="font-orbitron font-bold text-lg text-white">
            {allUsers.length} Operatives
          </p>
          <p className="text-xs text-emerald-400">Mesh network encrypted</p>
        </div>
      </div>

      {/* Recent Comms Transmissions Preview */}
      <div className="glass-panel p-5 rounded-2xl border border-[#B026FF]/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#B026FF]" />
            <h3 className="font-orbitron font-bold text-sm text-white">
              LIVE SECTOR TRANSMISSIONS
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateToChat();
            }}
            className="text-xs text-[#B026FF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Comms Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {conversations.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sounds.playClick();
                onNavigateToChat();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#050507]/60 hover:bg-[#B026FF]/15 border border-zinc-800/80 hover:border-[#B026FF]/50 transition-all text-left cursor-pointer"
            >
              <img
                src={c.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                alt={c.title}
                className="w-10 h-10 rounded-xl object-cover border border-[#B026FF]/30"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs truncate">{c.title}</p>
                <p className="text-[11px] text-[#A1A1AA] truncate">
                  {c.last_message?.content || c.description || 'Live Frequency'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
