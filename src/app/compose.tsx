import { ProfileGate } from '@/context/social-context';
import { Composer } from '@/components/social/composer';
export default function ComposeRoute() { return <ProfileGate><Composer /></ProfileGate>; }
