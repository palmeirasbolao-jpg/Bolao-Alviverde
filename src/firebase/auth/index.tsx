'use client';

import { onAuthStateChanged, signOut as firebaseSignOut, type User, type Auth } from 'firebase/auth';
import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';

// Re-export core types and functions
export * from 'firebase/auth';

// --- User Hook ---

// This should ideally be in its own file like 'use-user.ts' but placing it here for simplicity
// to avoid creating a new file for a single hook.

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const AuthContext = createContext<UserAuthState | undefined>(undefined);

export function AuthProvider({ children, auth }: { children: ReactNode, auth: Auth }) {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("AuthProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => userAuthState, [userAuthState]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}


export const useUser = (): UserAuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider.');
  }
  return context;
};

// --- Non-blocking Auth functions ---

export function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  return firebaseSignOut(authInstance).then(() => {}).catch(e => {throw e});
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  return createUserWithEmailAndPassword(authInstance, email, password).then(() => {}).catch(e => {throw e});
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(authInstance, email, password).then(() => {}).catch(e => {throw e});
}

// Export a non-blocking signOut
export function signOut(authInstance: Auth): Promise<void> {
    return firebaseSignOut(authInstance).catch(e => { throw e });
}
