import { Image } from 'expo-image';

export type IconName = 'search' | 'plus' | 'heart' | 'comment' | 'send' | 'bookmark' | 'home' | 'explore' | 'profile' | 'close' | 'grid' | 'video' | 'tagged' | 'person-plus' | 'back' | 'camera' | 'bio' | 'link' | 'location' | 'sign-out' | 'settings' | 'phone' | 'video-call' | 'photo' | 'check' | 'double-check' | 'chat-send';
const paths: Record<IconName, string> = {
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  heart: '<path d="M20.8 4.6a5.6 5.6 0 0 0-8 .1L12 5.5l-.8-.8a5.6 5.6 0 0 0-8 7.9L12 21l8.8-8.4a5.6 5.6 0 0 0 0-8Z"/>',
  comment: '<path d="M21 11.5a9 9 0 0 1-9.5 9 10 10 0 0 1-4-.9L2 22l1.7-5.6A9 9 0 1 1 21 11.5Z"/>',
  send: '<path d="m2 3 20-1-8 20-4-10-8-9Z"/><path d="m10 12 12-10"/>',
  bookmark: '<path d="M5 3h14v19l-7-5-7 5V3Z"/>',
  home: '<path d="m2 10 10-8 10 8v12h-7v-8H9v8H2V10Z"/>',
  explore: '<circle cx="12" cy="12" r="10"/><path d="m16 7-3 7-6 3 3-7 6-3Z"/>',
  profile: '<circle cx="12" cy="6" r="4"/><path d="M3 22v-2a9 7 0 0 1 18 0v2"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  video: '<rect x="3" y="3" width="18" height="18" rx="6"/><path d="m9 8 7 4-7 4V8ZM7 3l3 4M13 3l3 4"/>',
  tagged: '<path d="M9 4 11 1h2l2 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5Z"/><circle cx="12" cy="10" r="3"/><path d="M6 21v-2a6 4 0 0 1 12 0v2"/>',
  'person-plus': '<circle cx="10" cy="6" r="4"/><path d="M14 14a8 7 0 0 0-12 7h12M19 13v8M15 17h8"/>',
  back: '<path d="m15 3-9 9 9 9"/>',
  camera: '<path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="5"/>',
  bio: '<path d="M3 5h18M3 11h14M3 17h8"/><circle cx="18" cy="18" r="2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 .4l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.4l-3 3a5 5 0 0 0 7 7l2-2"/>',
  location: '<path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/>',
  'sign-out': '<path d="M11 3H4v18h7M10 12h12m-5-5 5 5-5 5"/>',
  settings: '<path d="m9.5 2-.5 3a8 8 0 0 0-1.5.9L4.6 5l-2.5 4.3 2.4 1.9a8 8 0 0 0 0 1.6l-2.4 1.9L4.6 19l2.9-.9A8 8 0 0 0 9 19l.5 3h5l.5-3a8 8 0 0 0 1.5-.9l2.9.9 2.5-4.3-2.4-1.9a8 8 0 0 0 0-1.6l2.4-1.9L19.4 5l-2.9.9A8 8 0 0 0 15 5l-.5-3h-5Z"/><circle cx="12" cy="12" r="3"/>',
  phone: '<path d="m5 3 4 4-2 3a16 16 0 0 0 7 7l3-2 4 4-2 3C10 23 1 14 2 5l3-2Z"/>',
  'video-call': '<rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 9 6-3v12l-6-3"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m3 16 6-6 5 5 3-3 4 4"/>',
  check: '<path d="m5 12 5 5L20 6"/>',
  'double-check': '<path d="m2 12 5 5L17 6M11 16l2 2L23 7"/>',
  'chat-send': '<path d="m22 2-7 20-5-9-9-4 21-7Z" fill="white"/><path d="m10 13 8-7" stroke="#087EFF"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
};
export function FeedIcon({ name, size = 24, color = '#101B32', filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? color : 'none'}" stroke="${color}" stroke-width="${name === 'grid' ? 2.6 : 1.9}" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`)}`;
  return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" />;
}
