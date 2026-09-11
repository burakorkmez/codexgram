import { ProfileGate } from '@/context/social-context';
import { PostDetail } from '@/components/social/post-detail';
export default function PostRoute() { return <ProfileGate><PostDetail /></ProfileGate>; }
