import { Image } from 'expo-image';
import { View } from 'react-native';

// Display the supplied reference's portrait regions without resampling its assets.
const top = [481, 653, 824, 995, 1164];
export function DemoMessageAvatar({ index, size }: { index: number; size: number }) {
  const scale = size / 116;
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}><Image source={require('../../design/messages-tab-ref.png')} style={{ position: 'absolute', width: 941 * scale, height: 1672 * scale, left: -150 * scale, top: -top[index] * scale }} contentFit="fill" /></View>;
}
