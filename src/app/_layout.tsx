import { MessagesProvider } from '@/context/messages-context';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
if (!publishableKey) {
  throw new Error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env and restart Expo.');
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) throw new Error('Set EXPO_PUBLIC_CONVEX_URL in .env.local and restart Expo.');
const convex = new ConvexReactClient(convexUrl);

function AuthenticatedRoutes() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  if (!isLoaded) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#1680FF" accessibilityLabel="Loading your account" /></View>;
  }
  return (
    <MessagesProvider key={userId ?? "signed-out"}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FCFDFE' } }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story-compose" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="compose" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="member/[id]" />
        <Stack.Screen name="chat/[id]" />
      </Stack.Protected>
      <Stack.Screen name="sso-callback" />
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="design-preview" />
      </Stack.Protected>
    </Stack></MessagesProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthenticatedRoutes />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCFDFE' },
});
