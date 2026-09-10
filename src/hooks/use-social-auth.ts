import { useAuth, useSSO } from '@clerk/expo';
import { makeRedirectUri } from 'expo-auth-session';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { authErrorMessage } from '@/lib/auth-errors';

export type AuthProvider = 'Google' | 'Apple';

export function useSocialAuth() {
  const { isLoaded } = useAuth();
  const { startSSOFlow } = useSSO();
  const inFlight = useRef(false);
  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);

  async function signIn(provider: AuthProvider) {
    if (!isLoaded || inFlight.current) return;
    inFlight.current = true;
    setPendingProvider(provider);
    try {
      const result = await startSSOFlow({
        strategy: provider === 'Google' ? 'oauth_google' : 'oauth_apple',
        redirectUrl: makeRedirectUri({ scheme: 'codexgram', path: 'sso-callback' }),
      });
      // A dismissed browser is an intentional cancellation, not a failed login.
      if (result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss') return;
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // Root route guards transition only after Clerk confirms the active session.
      } else if (result.signUp?.status === 'missing_requirements') {
        Alert.alert('More information needed', 'Your account needs additional details. Please contact the Codexgram team to finish signing up.');
      } else {
        Alert.alert('Sign-in incomplete', 'We couldn’t finish verifying your account. Please try signing in again.');
      }
    } catch (error) {
      const message = authErrorMessage(error);
      if (message) Alert.alert('Unable to sign in', message);
    } finally {
      inFlight.current = false;
      setPendingProvider(null);
    }
  }

  return { signIn, pendingProvider, isReady: isLoaded };
}
