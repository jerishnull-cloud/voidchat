import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Sparkles,
  Radio,
  Thermometer,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../lib/sounds';
import confetti from 'canvas-confetti';

interface MiningRigPageProps {
  onNavigateToChat: () => void;
}

export const MiningRigPage: React.FC<MiningRigPageProps> = ({ onNavigateToChat }) => {
  const { currentUser, updateProfile } = useAuth();
  const { sendMessage, conversations } = useChat();

  const [heat, setHeat] = useState(25);
  const [clickSparks, setClickSparks] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [drillLevel, setDrillLevel] = useState(1);
  const [isVibrating, setIsVibrating] = useState(false);

  const mineAsteroid = (e: React.MouseEvent<HTMLDivElement>) => {
    sounds.playMessageSent();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const yieldAmount = 25 * drillLevel;
    const newSpark = { id: Date.now(), x, y, amount: yieldAmount };
    setClickSparks((prev) => [...prev, newSpark]);
    setTimeout(() => {
      setClickSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
    }, 800);

    // Increase heat slightly
    setHeat((prev) => Math.min(100, prev + 2.5));

    // Update player balance
    updateProfile({ ore_balance: (currentUser.ore_balance || 0) + yieldAmount });

    // Haptic feedback
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 120);

    // If heat reached 100%, alert
    if (heat >= 95) {
      sounds.playReaction();
      confetti({
        particleCount: 25,
        spread: 45,
        colors: ['#B026FF', '#EF4444', '#FFA500'],
      });
    }
  };

  const coolRig = () => {
    sounds.playClick();
    setHeat(10);
  };

  const upgradeLaser = () => {
    if (currentUser.ore_balance >= 500) {
      sounds.playReaction();
      updateProfile({ ore_balance: currentUser.ore_balance - 500 });
      setDrillLevel((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 70,
        colors: ['#B026FF', '#FFFFFF'],
      });
    } else {
      alert('Insufficient Void Ore. Mine more crystals!');
    }
  };

  const broadcastYieldToComms = async () => {
    sounds.playClick();
    const targetConv = conversations[0];
    if (targetConv) {
      await sendMessage(
        targetConv.id,
        `⛏️ EXTRACTION REPORT: Overclocked thermal rig to Tier ${drillLevel}. Mined +${(25 * drillLevel).toLocaleString()} Void Ore units at Grid Theta-9!`,
        'text'
      );
      onNavigateToChat();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-tech">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B026FF]/20 pb-4">
        <div>
          <h1 className="font-orbitron font-extrabold text-2xl text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#B026FF]" />
            THERMAL QUANTUM DRILL RIG
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Target: Asteroid Sector VM-89 · Core Composition: Pure Crystallized Void Ore
          </p>
        </div>

        <button
          onClick={broadcastYieldToComms}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B026FF]/20 hover:bg-[#B026FF]/30 border border-[#B026FF]/40 text-white font-bold text-xs tracking-wider transition-all cursor-pointer"
        >
          <Radio className="w-4 h-4 text-[#B026FF]" />
          <span>TRANSMIT HAUL TO SQUAD</span>
        </button>
      </div>

      {/* Main Asteroid Mining Canvas & Interaction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-[#B026FF]/30 flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
          {/* Laser beam & Asteroid */}
          <div
            onClick={mineAsteroid}
            className={`relative w-56 h-56 rounded-full cursor-pointer transition-transform duration-100 select-none ${
              isVibrating ? 'scale-95' : 'hover:scale-105'
            }`}
          >
            {/* Pulsing glow background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#B026FF] to-[#8A2BE2] opacity-40 blur-2xl animate-pulse" />

            {/* Asteroid rock representation */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-800 via-[#100B18] to-[#050507] border-4 border-[#B026FF]/50 shadow-[0_0_35px_rgba(176,38,255,0.4)] flex items-center justify-center overflow-hidden">
              <Sparkles className="w-16 h-16 text-[#B026FF] animate-spin" style={{ animationDuration: '20s' }} />
              <span className="absolute font-orbitron font-extrabold text-xs text-white/80 tracking-widest">
                CLICK TO MINE
              </span>
            </div>

            {/* Particle Sparks */}
            {clickSparks.map((spark) => (
              <div
                key={spark.id}
                className="absolute pointer-events-none font-orbitron font-extrabold text-sm text-white drop-shadow-[0_0_8px_#B026FF] animate-out fade-out slide-out-to-top-8 duration-700"
                style={{ left: spark.x, top: spark.y }}
              >
                +{spark.amount} 💎
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-[#A1A1AA] text-center">
            Click repeatedly to engage the drill teeth. Watch heat thresholds to avoid laser shutdown!
          </p>
        </div>

        {/* Rig Controls & Upgrades */}
        <div className="space-y-4">
          {/* Thermal Gauge */}
          <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A1A1AA]">
                <Thermometer className="w-4 h-4 text-amber-400" />
                DRILL CORE TEMPERATURE
              </span>
              <span className={`font-mono font-bold ${heat > 80 ? 'text-red-400' : 'text-white'}`}>
                {Math.round(heat)}°C
              </span>
            </div>
            <div className="w-full bg-[#050507] h-3 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-200 ${
                  heat > 80
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : 'bg-gradient-to-r from-emerald-500 via-[#B026FF] to-amber-500'
                }`}
                style={{ width: `${heat}%` }}
              />
            </div>
            <button
              onClick={coolRig}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-zinc-800 text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>VENT CRYO COOLANT</span>
            </button>
          </div>

          {/* Upgrades */}
          <div className="glass-panel p-4 rounded-2xl border border-[#B026FF]/20 space-y-3">
            <h4 className="font-orbitron font-bold text-xs text-white">RIG UPGRADES</h4>

            <div className="p-3 bg-[#050507]/60 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-white">Quantum Laser Tier {drillLevel}</p>
                <p className="text-[10px] text-[#A1A1AA]">Yield: +{25 * drillLevel} Ore/strike</p>
              </div>
              <button
                onClick={upgradeLaser}
                className="px-3 py-1.5 bg-[#B026FF] hover:bg-[#8A2BE2] text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Upgrade (500 💎)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
