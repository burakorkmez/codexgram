import { AppTabs } from '@/components/app-tabs';
import { ProfileGate } from '@/context/social-context';
export const unstable_settings = { initialRouteName: 'home' };
export default function Tabs() { return <ProfileGate><AppTabs /></ProfileGate>; }
