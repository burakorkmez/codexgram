import type { ImageSource } from 'expo-image';

export const media = {
  lake: require('../../assets/images/feed/lake.png'), dog: require('../../assets/images/feed/dog.png'),
  alex: require('../../assets/images/feed/alex.png'), maya: require('../../assets/images/feed/maya.png'),
  jordan: require('../../assets/images/feed/jordan.png'), taylor: require('../../assets/images/feed/taylor.png'),
  casey: require('../../assets/images/feed/casey.png'), dogAvatar: require('../../assets/images/feed/dog-avatar.png'),
};
export type Post = { id: string; name: string; avatar: ImageSource; photo: ImageSource; location: string; time: string; title: string; caption: string; tags: string[]; likes: number; comments: number; compact?: boolean; carousel?: boolean };
export const initialPosts: Post[] = [
  { id: 'alex', name: 'alex.rivera', avatar: media.alex, photo: media.lake, location: 'Lake Louise, Canada', time: '2h ago', title: 'Morning views at Lake Louise 🏔️', caption: 'Grateful for days like this.', tags: ['travel', 'nature', 'canada'], likes: 124, comments: 3, carousel: true },
  { id: 'maya', name: 'maya.b', avatar: media.dogAvatar, photo: media.dog, location: 'San Diego, CA', time: '1d ago', title: 'Beach days are always better 💙', caption: 'Sandy paws, happy heart.', tags: ['dogs', 'ocean', 'goodvibes'], likes: 86, comments: 5, compact: true },
  { id: 'jordan', name: 'jordan.k', avatar: media.jordan, photo: media.lake, location: 'Banff National Park', time: '3d ago', title: 'A little closer to the mountains.', caption: 'Taking the scenic route.', tags: ['mountains', 'weekend'], likes: 62, comments: 2 },
];
export const stories = [
  { name: 'alex.rivera', image: media.alex, ring: ['#00BCFA', '#006DFF'] },
  { name: 'maya.b', image: media.maya, ring: ['#EC5EDC', '#FFC662'] },
  { name: 'jordan.k', image: media.jordan, ring: ['#B798FF', '#F2CFDD'] },
  { name: 'taylor.b', image: media.taylor, ring: ['#DF84EF', '#FADDB5'] },
  { name: 'casey.dev', image: media.casey, ring: ['#C8E0FC', '#C8E0FC'] },
];
