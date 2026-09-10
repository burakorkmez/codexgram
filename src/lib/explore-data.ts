import { media, type Post } from './feed-data';
export const topics = ['All', 'Travel', 'Nature', 'Pets', 'Food', 'Design', 'Lifestyle'];
export const suggestedPeople = [
  { name: 'alex.rivera', topic: 'Travel & Nature', image: require('../../assets/images/explore/alex.png') },
  { name: 'maya.b', topic: 'Lifestyle', image: require('../../assets/images/explore/maya.png') },
  { name: 'jordan.k', topic: 'Photography', image: require('../../assets/images/explore/jordan.png') },
  { name: 'taylor.b', topic: 'Food & Coffee', image: require('../../assets/images/explore/taylor.png') },
  { name: 'casey.dev', topic: 'Outdoor Life', image: require('../../assets/images/explore/casey.png') },
];
export const explorePosts: Post[] = [
  { id: 'explore-lake', name: 'alex.rivera', avatar: media.alex, photo: require('../../assets/images/profile/photo-1.png'), title: 'Morning views at Lake Louise 🏔️', tags: ['travel', 'nature'], likes: 124 },
  { id: 'explore-dog', name: 'maya.b', avatar: media.dogAvatar, photo: require('../../assets/images/profile/photo-2.png'), title: 'Beach days are always better 💙', tags: ['pets', 'lifestyle'], likes: 86 },
  { id: 'explore-palms', name: 'taylor.b', avatar: media.taylor, photo: require('../../assets/images/profile/photo-3.png'), title: 'Golden hour in San Diego 🌅', tags: ['travel', 'nature', 'lifestyle'], likes: 102 },
  { id: 'explore-city', name: 'jordan.k', avatar: media.jordan, photo: require('../../assets/images/profile/photo-4.png'), title: 'City lights, bigger dreams ✨', tags: ['travel', 'design'], likes: 210 },
  { id: 'explore-coast', name: 'casey.dev', avatar: media.casey, photo: require('../../assets/images/profile/photo-7.png'), title: 'Find your next horizon 🌊', tags: ['travel', 'nature'], likes: 178 },
  { id: 'explore-coffee', name: 'maya.b', avatar: media.maya, photo: require('../../assets/images/profile/photo-6.png'), title: 'Good coffee, brighter days ☕', tags: ['food', 'lifestyle'], likes: 95 },
  { id: 'explore-hike', name: 'alex.rivera', avatar: media.alex, photo: require('../../assets/images/profile/photo-8.png'), title: 'A little further outdoors', tags: ['travel', 'nature'], likes: 143 },
  { id: 'explore-peaks', name: 'jordan.k', avatar: media.jordan, photo: require('../../assets/images/profile/photo-9.png'), title: 'Chasing the last light', tags: ['nature', 'travel'], likes: 167 },
  { id: 'explore-greece', name: 'taylor.b', avatar: media.taylor, photo: require('../../assets/images/explore/santorini.png'), title: 'Blue skies in Santorini', tags: ['travel', 'design'], likes: 119 },
].map(post => ({ ...post, location: '', time: 'Today', caption: 'A moment from the Codexgram demo community.', comments: 0 }));
