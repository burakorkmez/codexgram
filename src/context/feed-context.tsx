import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { initialPosts, type Post } from '@/lib/feed-data';

type FeedState = {
  posts: Post[]; setPosts: Dispatch<SetStateAction<Post[]>>;
  unliked: string[]; setUnliked: Dispatch<SetStateAction<string[]>>;
  saved: string[]; setSaved: Dispatch<SetStateAction<string[]>>;
  comments: Record<string, string[]>; setComments: Dispatch<SetStateAction<Record<string, string[]>>>;
};
const FeedContext = createContext<FeedState | null>(null);
export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState(initialPosts);
  const [unliked, setUnliked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  return <FeedContext.Provider value={{ posts, setPosts, unliked, setUnliked, saved, setSaved, comments, setComments }}>{children}</FeedContext.Provider>;
}
export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) throw new Error('Feed screens must be inside FeedProvider');
  return context;
}
