import { Redirect } from 'expo-router';
import { AppTabs } from '@/components/app-tabs';
export const unstable_settings = { initialRouteName: 'home' };
export default function PreviewTabs() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AppTabs />;
}
