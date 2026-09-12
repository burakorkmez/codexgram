import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { FeedIcon } from './feed-icon';

export function HomeHeader() {
  const router = useRouter(); const preview = usePathname().startsWith('/design-preview'); const { width, height } = useWindowDimensions(); const s = width / 390; const v = height / 916;
  return <View style={{ height: 50 * v, marginHorizontal: 14 * s, flexDirection: 'row', alignItems: 'center', gap: 10 * s }}>
    <Image source={require('../../assets/images/logo.png')} style={{ width: 38 * s, height: 38 * s }} />
    <Text style={{ flex: 1, color: '#0D1529', fontSize: 23 * s, fontWeight: '700', letterSpacing: -0.8 * s }}>Codexgram</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Search people and posts" onPress={() => router.navigate(preview ? '/design-preview/explore' : '/explore')} style={{ width: 38 * s, height: 38 * s, borderRadius: 99, backgroundColor: '#F3F5F9', alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="search" size={22 * s} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Create a post" onPress={() => router.push('/compose')} style={{ width: 38 * s, height: 38 * s, borderRadius: 99, backgroundColor: '#E8F1FF', alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="plus" size={23 * s} color="#087EFF" /></Pressable>
  </View>;
}
