/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { SpaceCanvas } from './components/cosmic/SpaceCanvas';
import { VoidNavbar } from './components/navigation/VoidNavbar';
import { ChatContainer } from './components/chat/ChatContainer';
import { CommandDeckPage } from './components/game/CommandDeckPage';
import { MiningRigPage } from './components/game/MiningRigPage';
import { LeaderboardPage } from './components/game/LeaderboardPage';
import { SupabaseSetupModal } from './components/chat/SupabaseSetupModal';
import { ProfileModal } from './components/chat/ProfileModal';
import { AuthPage, AuthPageMode } from './components/auth/AuthPage';

type AppTab = 'chat' | 'command' | 'rig' | 'leaderboard';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<AppTab>('chat');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const { createDirectChat } = useChat();
  const { isAuthReady, isRealUser, isSupabaseLive } = useAuth();

  const authPageModes: Record<string, AuthPageMode> = {
    '/login': 'login',
    '/register': 'register',
    '/forgot-password': 'forgot-password',
    '/reset-password': 'reset-password',
  };
  const authPageMode = authPageModes[currentPath.replace(/\/+$/, '') || '/'];

  // Listen to browser URL query params if any (e.g. /?tab=chat or /chat)
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as AppTab | null;
    if (tabParam && ['chat', 'command', 'rig', 'leaderboard'].includes(tabParam)) {
      setCurrentTab(tabParam);
    } else if (window.location.pathname.includes('/chat')) {
      setCurrentTab('chat');
    }

    if (params.get('tab') === 'reset-password' && window.location.pathname !== '/reset-password') {
      window.location.replace('/reset-password');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (authPageMode && authPageMode !== 'reset-password' && isRealUser) {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
        window.location.replace(next);
      } else {
        window.location.replace('/?tab=command');
      }
      return;
    }

    if (!authPageMode && isSupabaseLive && !isRealUser) {
      const params = new URLSearchParams(window.location.search);
      const authFailure = params.get('error_description') || params.get('error');
      if (authFailure) {
        window.location.replace(`/login?authError=${encodeURIComponent(authFailure)}`);
      } else {
        const requestedPath = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/login?next=${encodeURIComponent(requestedPath)}`);
      }
    }
  }, [authPageMode, isAuthReady, isRealUser, isSupabaseLive]);

  if (isSupabaseLive && !isAuthReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050507] text-[#D8B4FE]">
        <div className="flex items-center gap-3 font-tech text-sm tracking-widest">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#B026FF]" />
          ESTABLISHING SECURE LINK…
        </div>
      </main>
    );
  }

  if (authPageMode) {
    return (
      <>
        <AuthPage mode={authPageMode} onOpenSetup={() => setShowSetupModal(true)} />
        {showSetupModal && <SupabaseSetupModal onClose={() => setShowSetupModal(false)} />}
      </>
    );
  }

  if (isSupabaseLive && !isRealUser) return null;

  const handleDirectMessage = async (userId: string) => {
    await createDirectChat(userId);
    setCurrentTab('chat');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050507] text-white flex flex-col overflow-hidden font-tech selection:bg-[#B026FF]/40 selection:text-white">
      {/* Live Animated Space Background with Purple Nebulae & Stardust */}
      <SpaceCanvas />

      {/* VOID MINER Navigation Bar */}
      <VoidNavbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSetup={() => setShowSetupModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={() => window.location.assign('/login')}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {currentTab === 'chat' && (
          <ChatContainer onOpenSetup={() => setShowSetupModal(true)} />
        )}

        {currentTab === 'command' && (
          <CommandDeckPage
            onNavigateToChat={() => setCurrentTab('chat')}
            onNavigateToRig={() => setCurrentTab('rig')}
          />
        )}

        {currentTab === 'rig' && (
          <MiningRigPage onNavigateToChat={() => setCurrentTab('chat')} />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardPage onDirectMessage={handleDirectMessage} />
        )}
      </div>

      {/* Global Modals */}
      {showSetupModal && (
        <SupabaseSetupModal onClose={() => setShowSetupModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
}
