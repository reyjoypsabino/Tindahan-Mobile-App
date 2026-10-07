import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface LocalSession {
  email: string;
  storeName?: string;
}

interface Auth {
  session: LocalSession | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, storeName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

const SESSION_KEY = '@tindahan/session';
const PENDING_STORE_KEY = '@tindahan/pending-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) setSession(JSON.parse(raw));
      } catch {
        // corrupted storage: stay signed out
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: LocalSession | null) => {
    setSession(next);
    try {
      if (next) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // storage write failed: session still held in memory
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!email.trim() || !password) {
        Alert.alert('Missing details', 'Enter your email and password.');
        return false;
      }
      // Local-only auth (no backend). Accepts any credentials.
      // Picks up the store name saved at signup, if any.
      let storeName: string | undefined;
      try {
        storeName = (await AsyncStorage.getItem(PENDING_STORE_KEY)) ?? undefined;
        if (storeName) await AsyncStorage.removeItem(PENDING_STORE_KEY);
      } catch {
        // storage read failed: log in without a store name
      }
      await persist({ email: email.trim(), storeName });
      return true;
    },
    [persist],
  );

  const signUp = useCallback(
    async (email: string, password: string, storeName: string): Promise<boolean> => {
      if (!email.trim() || !password) {
        Alert.alert('Missing details', 'Enter store name, email, and password (6+ characters).');
        return false;
      }
      // Local-only auth (no backend). Registration does NOT sign in:
      // the user confirms the account, then logs in on the Login screen.
      // The store name is kept for the next login greeting.
      try {
        await AsyncStorage.setItem(PENDING_STORE_KEY, storeName.trim() || 'My Sari-Sari Store');
      } catch {
        // storage write failed: signup still succeeds
      }
      return true;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await persist(null);
  }, [persist]);

  const value = useMemo(() => ({ session, ready, signIn, signUp, signOut }), [session, ready, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
