import React from 'react';
import { Trophy, Medal, Sparkles, Shield, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../lib/sounds';

interface LeaderboardPageProps {
  onDirectMessage: (userId: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onDirectMessage }) => {
  const { allUsers, currentUser } = useAuth();

  // Sort miners by ore_balance
  const sortedMiners = [...allUsers].sort((a, b) => (b.ore_balance || 0) - (a.ore_balance || 0));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-tech">
      <div className="border-b border-[#B026FF]/20 pb-4">
        <h1 className="font-orbitron font-extrabold text-2xl text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          GALACTIC MINING LEADERBOARD
        </h1>
        <p className="text-xs text-[#A1A1AA]">
          Verified Void Ore extraction metrics across all cosmic sectors.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-[#B026FF]/25 overflow-hidden">
        <div className="p-3 bg-[#100B18] border-b border-[#B026FF]/20 grid grid-cols-12 text-xs uppercase font-bold text-[#A1A1AA] tracking-wider">
          <span className="col-span-1 text-center">RANK</span>
          <span className="col-span-6 sm:col-span-5">OPERATIVE</span>
          <span className="col-span-3 sm:col-span-4 text-right">TOTAL VOID ORE</span>
          <span className="col-span-2 text-right">COMMS</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {sortedMiners.map((miner, index) => {
            const isMe = miner.id === currentUser.id;
            return (
              <div
                key={miner.id}
                className={`p-3.5 grid grid-cols-12 items-center text-xs transition-colors ${
                  isMe
                    ? 'bg-[#B026FF]/15 border-l-2 border-l-[#B026FF]'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Rank number / medal */}
                <div className="col-span-1 flex justify-center font-orbitron font-bold">
                  {index === 0 ? (
                    <span className="text-amber-400 text-sm">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-zinc-300 text-sm">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-amber-600 text-sm">🥉</span>
                  ) : (
                    <span className="text-[#A1A1AA]">#{index + 1}</span>
                  )}
                </div>

                {/* Miner profile */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <img
                    src={miner.avatar_url}
                    alt={miner.username}
                    className="w-9 h-9 rounded-xl object-cover border border-[#B026FF]/30 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                      <span>{miner.username}</span>
                      {isMe && (
                        <span className="text-[9px] text-[#B026FF] uppercase font-mono px-1 rounded bg-[#B026FF]/20">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] truncate">
                      {miner.callsign} · <span className="text-[#D8B4FE]">{miner.mining_rank}</span>
                    </p>
                  </div>
                </div>

                {/* Ore balance */}
                <div className="col-span-3 sm:col-span-4 text-right font-mono font-bold text-white text-sm">
                  <span className="text-[#B026FF] mr-1">💎</span>
                  {(miner.ore_balance || 0).toLocaleString()}
                </div>

                {/* Message action */}
                <div className="col-span-2 text-right">
                  {!isMe ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onDirectMessage(miner.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#B026FF]/20 hover:bg-[#B026FF]/40 border border-[#B026FF]/30 text-white font-tech text-xs transition-colors cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">HOLO-LINK</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#A1A1AA]">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
