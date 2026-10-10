import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Key,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConnected,
} from '../../lib/supabase';
import { sounds } from '../../lib/sounds';

interface SupabaseSetupModalProps {
  onClose: () => void;
}

const SQL_MIGRATION_PREVIEW = `-- ==============================================================================
-- VOID MINER - SAFE SQL MIGRATION FOR YOUR EXISTING SUPABASE PROJECT
-- NON-DESTRUCTIVE: Preserves all existing tables, users, and data!
-- Run in your existing Supabase Dashboard: SQL Editor > New query > Run
-- ==============================================================================

-- 1. Ensure UUID Extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Safely add missing columns to profiles table if they don't already exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Void Miner Operative exploring cosmic sectors.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mining_rank TEXT DEFAULT 'NOVICE MINER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ore_balance BIGINT DEFAULT 1500;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'online';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  title TEXT,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conversation Members Table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID,
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'file', 'audio')),
  media_url TEXT,
  media_metadata JSONB DEFAULT '{}'::jsonb,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- 7. User Blocks & Moderation
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Safe Realtime Replication (No duplicate errors)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 9. Storage Bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ onClose }) => {
  const currentConfig = getStoredSupabaseConfig();
  const isConnected = isSupabaseConnected();

  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'sql' | 'steps' | 'vercel'>('connect');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_PREVIEW);
    setCopied(true);
    sounds.playReaction();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !anonKey.trim()) return;
    saveSupabaseConfig(supabaseUrl.trim(), anonKey.trim());
  };

  const handleDisconnect = () => {
    sounds.playClick();
    clearSupabaseConfig();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col glass-dropdown rounded-2xl border border-[#B026FF]/40 shadow-[0_0_40px_rgba(176,38,255,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#B026FF]/20 bg-[#100B18]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B026FF]/20 border border-[#B026FF]/40 flex items-center justify-center">
              <Database className="w-4 h-4 text-[#B026FF]" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">
                REUSE EXISTING SUPABASE PROJECT
              </h3>
              <p className="text-[11px] text-[#A1A1AA] font-tech">
                PostgreSQL · Real-time Channels · Row Level Security · Storage
              </p>
            </div>
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

        {/* Status banner */}
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between font-tech text-xs ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-purple-950/40 border-[#B026FF]/30 text-[#D8B4FE]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
            <span className="font-bold">
              {isConnected
                ? 'Status: Connected to Existing Supabase Project & Realtime Active'
                : 'Status: Standby (Enter your existing Supabase credentials below)'}
            </span>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-[11px] underline hover:text-white cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Tab selection */}
        <div className="flex items-center border-b border-[#B026FF]/20 bg-[#050507]/60 px-4 font-tech text-xs">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'connect'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            1. Existing Credentials
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'sql'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            2. Safe SQL Migration
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'steps'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            3. Setup Steps
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'vercel'
                ? 'border-[#B026FF] text-white'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            4. Vercel Env Vars
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 font-tech text-xs">
          {activeTab === 'connect' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3 bg-[#B026FF]/10 rounded-xl border border-[#B026FF]/30 text-zinc-300">
                <p className="font-bold text-white mb-1">⚡ Connect Your Existing Supabase Project</p>
                <p>
                  Paste your existing Supabase Project URL and Public Anon Key below. This app will instantly connect to your live project without resetting or overwriting any existing authentication, user accounts, or tables.
                </p>
              </div>

              <div>
                <label className="block uppercase text-[11px] text-[#A1A1AA] mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#B026FF]" />
                  <span>VITE_SUPABASE_URL *</span>
                </label>
                <input
                  type="url"
                  required
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzabcdefg.supabase.co"
                  className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B026FF]"
                />
                <span className="text-[10px] text-[#A1A1AA] mt-1 block">
                  Found in your existing Supabase Dashboard → Project Settings → API → Project URL
                </span>
              </div>

              <div>
                <label className="block uppercase text-[11px] text-[#A1A1AA] mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#B026FF]" />
                  <span>VITE_SUPABASE_ANON_KEY (Public Key) *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#B026FF]"
                />
                <span className="text-[10px] text-[#A1A1AA] mt-1 block">
                  Important: Use your project&apos;s public <strong>anon key</strong>. Never put your secret service-role key in frontend code.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#B026FF] hover:underline"
                >
                  <span>Open Existing Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] text-white font-bold tracking-wider hover:shadow-[0_0_15px_#B026FF] transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>SAVE & CONNECT LIVE</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Safe SQL Migration Script</h4>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Uses <code className="text-[#D8B4FE]">CREATE TABLE IF NOT EXISTS</code> and <code className="text-[#D8B4FE]">ADD COLUMN IF NOT EXISTS</code> to safeguard existing data. Also saved in <code className="text-[#D8B4FE]">/supabase/schema.sql</code>.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B026FF]/20 hover:bg-[#B026FF]/30 border border-[#B026FF]/40 text-white font-bold transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY ALL SQL'}</span>
                </button>
              </div>

              <div className="relative bg-[#050507] rounded-xl border border-zinc-800 p-3 max-h-72 overflow-y-auto font-mono text-[11px] text-zinc-300">
                <pre>{SQL_MIGRATION_PREVIEW}</pre>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <h4 className="font-bold text-white text-sm">Exact Steps to Run in Your Existing Project</h4>
              <ol className="list-decimal list-inside space-y-3 pl-1">
                <li>
                  <strong className="text-white">Open Existing Supabase Project:</strong> Go to{' '}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#B026FF] underline">
                    supabase.com/dashboard
                  </a>{' '}
                  and select your existing VOID MINER project.
                </li>
                <li>
                  <strong className="text-white">Execute Safe SQL Migration:</strong> In the left sidebar, click{' '}
                  <strong className="text-white">SQL Editor</strong>, click <em>&ldquo;New query&rdquo;</em>, paste the SQL from Tab 2 (or from <code className="text-[#D8B4FE]">/supabase/schema.sql</code>), and click <strong className="text-white">Run</strong>. It will safely create only missing chat tables and leave all existing data intact.
                </li>
                <li>
                  <strong className="text-white">Verify Realtime Replication:</strong> Go to{' '}
                  <strong className="text-white">Database → Replication</strong> and ensure that the tables{' '}
                  <code className="text-[#D8B4FE]">messages</code>, <code className="text-[#D8B4FE]">message_reactions</code>, and <code className="text-[#D8B4FE]">conversation_members</code> are enabled for replication.
                </li>
                <li>
                  <strong className="text-white">Verify Storage Bucket:</strong> In{' '}
                  <strong className="text-white">Storage</strong>, confirm the bucket{' '}
                  <code className="text-[#D8B4FE]">chat-attachments</code> exists with public read access.
                </li>
                <li>
                  <strong className="text-white">Existing Authentication:</strong> Your existing Supabase user accounts, passwords, and Google logins continue working directly with no duplicate accounts needed.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <h4 className="font-bold text-white text-sm">Vercel Deployment Variables</h4>
              <p>In your Vercel Project Settings &gt; Environment Variables, ensure these existing variables are present:</p>

              <div className="space-y-2 bg-[#050507] p-3 rounded-xl border border-zinc-800 font-mono text-[11px]">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>VITE_SUPABASE_URL</span>
                  <span className="text-[#B026FF]">https://[YOUR_EXISTING_ID].supabase.co</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-[#B026FF]">eyJhbGciOiJIUz...</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-white">Verification Steps:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Commit and push the code to your existing repository.</li>
                  <li>In Vercel, trigger a redeploy or push a new commit.</li>
                  <li>Open the deployed app, navigate to <strong>COMMS / CHAT</strong>, and send messages across two logged-in accounts.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
