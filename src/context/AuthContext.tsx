import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserStatus } from '../types/chat';
import { SEED_PROFILES } from '../data/seedData';
import { supabase, isSupabaseConnected } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  blockedUserIds: string[];
  isAuthenticated: boolean;
  isRealUser: boolean;
  isAuthReady: boolean;
  isPasswordRecovery: boolean;
  isSupabaseLive: boolean;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateStatus: (status: UserStatus, statusMessage?: string) => Promise<void>;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  reportUser: (userId: string, reason: string, messageId?: string) => void;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string,
    returnTo?: string
  ) => Promise<{ error: Error | null; needsEmailVerification: boolean }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USERS = 'void_miner_users_cache';
const LOCAL_STORAGE_CURRENT_USER_ID = 'void_miner_current_user_id';
const LOCAL_STORAGE_BLOCKS = 'void_miner_blocked_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseLive = isSupabaseConnected();
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS);
      return stored ? JSON.parse(stored) : SEED_PROFILES;
    } catch {
      return SEED_PROFILES;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_ID);
      return stored || SEED_PROFILES[0].id;
    } catch {
      return SEED_PROFILES[0].id;
    }
  });

  const [isRealUser, setIsRealUser] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseLive);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BLOCKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load user from Supabase auth if session exists
  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    // Await getSession to ensure OAuth hashes are parsed before marking auth as ready
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('getSession error:', error);
      }
      
      if (session?.user) {
        setIsRealUser(true);
        window.setTimeout(() => {
          void syncSupabaseProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.username,
            session.user.user_metadata?.avatar_url
          );
        }, 0);
      } else {
        setIsRealUser(false);
      }
      
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        // Handled by getSession above
        return;
      }

      if (session?.user) {
        setIsRealUser(true);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        } else if (event === 'SIGNED_IN') {
          setIsPasswordRecovery(false);
        }

        window.setTimeout(() => {
          void syncSupabaseProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.username,
            session.user.user_metadata?.avatar_url
          );
        }, 0);
      } else {
        setIsRealUser(false);
        setIsPasswordRecovery(false);
        setCurrentUserId(SEED_PROFILES[0].id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncSupabaseProfile = async (
    authUserId: string,
    authEmail?: string,
    authUsername?: string,
    authAvatarUrl?: string
  ) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (data && !error) {
        const fullProfile: UserProfile = {
          id: data.id,
          username: data.username || authUsername || authEmail?.split('@')[0] || `Miner_${data.id.substring(0, 5)}`,
          callsign: data.callsign || `VM-${data.id.substring(0, 4).toUpperCase()}`,
          email: authEmail || data.email || '',
          avatar_url: data.avatar_url || authAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.id}`,
          bio: data.bio || 'Void Miner Operative exploring cosmic sectors.',
          mining_rank: data.mining_rank || 'NOVICE MINER',
          ore_balance: data.ore_balance ? Number(data.ore_balance) : 2500,
          status: (data.status as UserStatus) || 'online',
          status_message: data.status_message,
          last_seen: data.last_seen || new Date().toISOString(),
        };

        setAllUsers((prev) => {
          const exists = prev.some((u) => u.id === fullProfile.id);
          const updated = exists ? prev.map((u) => (u.id === fullProfile.id ? fullProfile : u)) : [fullProfile, ...prev];
          localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(updated));
          return updated;
        });

        setCurrentUserId(authUserId);
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_ID, authUserId);
      } else if (authEmail) {
        // Fallback profile if record does not exist yet
        const tempProfile: UserProfile = {
          id: authUserId,
          username: authUsername || authEmail.split('@')[0],
          callsign: `VM-${authUserId.substring(0, 4).toUpperCase()}`,
          email: authEmail,
          avatar_url: authAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUserId}`,
          bio: 'Void Miner Operative.',
          mining_rank: 'NOVICE MINER',
          ore_balance: 1500,
          status: 'online',
          last_seen: new Date().toISOString(),
        };
        setAllUsers((prev) => [tempProfile, ...prev.filter((u) => u.id !== authUserId)]);
        setCurrentUserId(authUserId);
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BLOCKS, JSON.stringify(blockedUserIds));
  }, [blockedUserIds]);

  const currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0] || SEED_PROFILES[0];

  const switchUser = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setAllUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u));
      return updated;
    });

    if (supabase && isSupabaseLive) {
      try {
        await supabase
          .from('profiles')
          .update({
            username: updates.username,
            callsign: updates.callsign,
            avatar_url: updates.avatar_url,
            bio: updates.bio,
            status_message: updates.status_message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
      } catch (e) {
        console.error('Supabase profile update failed:', e);
      }
    }
  };

  const updateStatus = async (status: UserStatus, statusMessage?: string) => {
    await updateProfile({
      status,
      status_message: statusMessage !== undefined ? statusMessage : currentUser.status_message,
      last_seen: new Date().toISOString(),
    });
  };

  const blockUser = async (userId: string) => {
    setBlockedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('user_blocks').insert({ blocker_id: currentUser.id, blocked_id: userId });
      } catch {
        // Ignored
      }
    }
  };

  const unblockUser = async (userId: string) => {
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
    if (supabase && isSupabaseLive) {
      try {
        await supabase.from('user_blocks').delete().match({ blocker_id: currentUser.id, blocked_id: userId });
      } catch {
        // Ignored
      }
    }
  };

  const reportUser = async (userId: string, reason: string, messageId?: string) => {
    if (supabase && isSupabaseLive) {
      try {
        await supabase
          .from('user_reports')
          .insert({
            reporter_id: currentUser.id,
            reported_user_id: userId,
            reason,
            message_id: messageId || null,
          });
      } catch {
        // Ignored
      }
    }
    const existing = JSON.parse(localStorage.getItem('void_miner_reports') || '[]');
    existing.push({ reporter: currentUser.id, target: userId, reason, messageId, date: new Date().toISOString() });
    localStorage.setItem('void_miner_reports', JSON.stringify(existing));
  };

  const signInWithGoogle = async (returnTo?: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Configure Supabase in the setup modal.');
    }
    const redirectUrl = new URL(returnTo || '/?tab=command', window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured. Connect your Supabase project in the setup modal.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, username: string, returnTo?: string) => {
    if (!supabase) {
      return {
        error: new Error('Supabase not configured. Connect your Supabase project in the setup modal.'),
        needsEmailVerification: false,
      };
    }
    const redirectUrl = new URL(returnTo || '/?tab=command', window.location.origin).toString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: redirectUrl,
      },
    });
    return { error, needsEmailVerification: !error && !data.session };
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured. Connect your Supabase project in the setup modal.') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error };

    const { error: signOutError } = await supabase.auth.signOut();
    return { error: signOutError };
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        blockedUserIds,
        isAuthenticated: isRealUser,
        isRealUser,
        isAuthReady,
        isPasswordRecovery,
        isSupabaseLive,
        switchUser,
        updateProfile,
        updateStatus,
        blockUser,
        unblockUser,
        reportUser,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
