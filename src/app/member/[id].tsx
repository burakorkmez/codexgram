import { ProfileGate } from '@/context/social-context';
import { MemberRoute } from '@/components/social/profile';
export default function ProfileRoute() { return <ProfileGate><MemberRoute /></ProfileGate>; }
