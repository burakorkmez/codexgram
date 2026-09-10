import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

// Handles a direct deep-link launch. The active browser flow finishes in useSSO.
export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return <Redirect href={isSignedIn ? '/home' : '/'} />;
}
