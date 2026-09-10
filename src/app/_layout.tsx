import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
if (!publishableKey) {
  throw new Error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env and restart Expo.');
}

function AuthenticatedRoutes() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#1680FF" accessibilityLabel="Loading your account" /></View>;
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FCFDFE' } }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen name="sso-callback" />
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="design-preview" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthenticatedRoutes />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCFDFE' },
});
