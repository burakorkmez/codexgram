import { useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/social';
import { FeedIcon } from '../feed-icon';
import { Avatar, useMediaSource } from './media';
import type { FunctionReturnType } from 'convex/server';

type Story = FunctionReturnType<typeof api.stories.list>[number];
export function Stories() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); const listener = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); }); return () => { clearInterval(timer); listener.remove(); }; }, []);
  const stories = useQuery(api.stories.list, { now }); const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null); const [seen, setSeen] = useState<string[]>([]);
  const { width, height } = useWindowDimensions(); const s = width / 390; const v = height / 916;
  const active = (stories ?? []).filter(story => story.expiresAt > now);
  const people = [...new Map(active.map(story => [story.author._id, story.author])).values()];
  const ordered = people.flatMap(person => active.filter(story => story.author._id === person._id).reverse());
  const index = ordered.findIndex(story => story._id === selected); const current = ordered[index];
  const open = (id: string) => { setSelected(id); setSeen(values => values.includes(id) ? values : [...values, id]); };
  const next = () => { if (ordered[index + 1]) open(ordered[index + 1]._id); else setSelected(null); };
  return <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 9 * v, paddingBottom: 11 * v, paddingHorizontal: 14 * s, gap: 16 * s, alignItems: 'flex-start', minHeight: 91 * v }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Add your story" onPress={() => router.push('/story-compose')} style={{ width: 50 * s, alignItems: 'center', gap: 6 * v }}><View style={{ width: 50 * s, height: 50 * s, borderRadius: 26 * s, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="plus" size={23 * s} color="#087EFF" /></View><Text style={{ color: '#7C879F', fontSize: 9.5 * s }}>Your story</Text></Pressable>
      {people.map((person, i) => { const group = ordered.filter(story => story.author._id === person._id); const unread = group.find(story => !seen.includes(story._id)); return <Pressable key={person._id} accessibilityRole="button" accessibilityLabel={`View ${person.isOwn ? 'your' : person.username + "'s"} stories`} onPress={() => open((unread ?? group[0])._id)} style={{ width: 53 * s, alignItems: 'center', gap: 4 * v, marginTop: -2 * v }}><LinearGradient colors={!unread ? ['#C9CFDA', '#C9CFDA'] : i % 2 ? ['#CF60EC', '#FFD3A4'] : ['#0788FF', '#BBDEFF']} style={{ padding: 1.3 * s, borderRadius: 30 * s }}><View style={{ padding: 2 * s, backgroundColor: 'white', borderRadius: 30 * s }}><Avatar profile={person} size={47 * s} /></View></LinearGradient><Text numberOfLines={1} style={{ color: '#0D1529', fontSize: 9.5 * s }}>{person.isOwn ? 'Your photos' : person.username}</Text></Pressable>; })}
      {stories === undefined ? <ActivityIndicator style={{ padding: 20 * s }} color="#087EFF" /> : !people.length && <Text style={{ color: '#7C879F', fontSize: 11 * s, alignSelf: 'center', maxWidth: 240 * s }}>Share the first story. Photos stay here for 24 hours.</Text>}
    </ScrollView>
    <Modal visible={!!current} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setSelected(null)}>{current && <StoryViewer key={current._id} story={current} index={index} count={ordered.length} onNext={next} onPrevious={() => { if (ordered[index - 1]) open(ordered[index - 1]._id); }} onClose={() => setSelected(null)} />}</Modal>
  </>;
}
function StoryViewer({ story, index, count, onNext, onPrevious, onClose }: { story: Story; index: number; count: number; onNext: () => void; onPrevious: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets(); const { source, error, retry } = useMediaSource(story._id, 'story');
  const remove = useMutation(api.stories.remove); const [ready, setReady] = useState(false); const [failed, setFailed] = useState(false); const [paused, setPaused] = useState(false); const [foreground, setForeground] = useState(AppState.currentState === 'active'); const [progress, setProgress] = useState(0);
  useEffect(() => { const listener = AppState.addEventListener('change', state => setForeground(state === 'active')); return () => listener.remove(); }, []);
  useEffect(() => { if (!ready || paused || !foreground || failed) return; const timer = setInterval(() => setProgress(value => Math.min(1, value + 0.02)), 100); return () => clearInterval(timer); }, [ready, paused, foreground, failed]);
  useEffect(() => { if (progress >= 1) onNext(); }, [progress, onNext]);
  useEffect(() => { const timer = setTimeout(onClose, Math.max(0, story.expiresAt - Date.now())); return () => clearTimeout(timer); }, [story.expiresAt, onClose]);
  function deleteStory() { setPaused(true); Alert.alert('Delete your story?', 'This photo will be removed from stories.', [{ text: 'Cancel', style: 'cancel', onPress: () => setPaused(false) }, { text: 'Delete', style: 'destructive', onPress: () => { void remove({ id: story._id }).then(onClose).catch(e => { Alert.alert('Could not delete story', errorMessage(e)); setPaused(false); }); } }], { onDismiss: () => setPaused(false) }); }
  return <View style={{ flex: 1, backgroundColor: '#080C16', paddingTop: insets.top, paddingBottom: insets.bottom }}>
    <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 8 }}>{Array.from({ length: count }, (_, i) => <View key={i} style={{ flex: 1, height: 3, backgroundColor: '#FFFFFF44', borderRadius: 2, overflow: 'hidden' }}><View style={{ height: 3, width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`, backgroundColor: 'white' }} /></View>)}</View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}><Avatar profile={story.author} size={34} /><View style={{ flex: 1 }}><Text style={{ color: 'white', fontWeight: '600' }}>{story.author.username}</Text><Text style={{ color: '#BBC4D5', fontSize: 11 }}>Story · {Math.max(1, Math.ceil((Date.now() - story._creationTime) / 3600000))}h ago</Text></View>{story.author.isOwn && <Pressable accessibilityRole="button" accessibilityLabel="Delete your story" onPress={deleteStory} style={{ padding: 10 }}><Text style={{ color: 'white' }}>Delete</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Close story" onPress={onClose} hitSlop={12}><FeedIcon name="close" color="white" /></Pressable></View>
    <View style={{ flex: 1 }}>
      {source && <Image source={source} cachePolicy="none" contentFit="contain" style={{ width: '100%', height: '100%' }} onLoad={() => setReady(true)} onError={() => setFailed(true)} />}
      {!ready && !error && !failed && <ActivityIndicator color="white" style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} />}
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}><Pressable accessibilityRole="button" accessibilityLabel="Previous story" onPress={onPrevious} onLongPress={() => setPaused(true)} onPressIn={() => setPaused(true)} onPressOut={() => setPaused(false)} style={{ width: '30%' }} /><Pressable accessibilityRole="button" accessibilityLabel="Next story" onPress={onNext} onLongPress={() => setPaused(true)} onPressIn={() => setPaused(true)} onPressOut={() => setPaused(false)} style={{ flex: 1 }} /></View>
      {(error || failed) && <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setReady(false); retry(); }} style={{ position: 'absolute', top: '45%', alignSelf: 'center', backgroundColor: '#273248', padding: 20, borderRadius: 16 }}><Text style={{ color: 'white' }}>Photo unavailable. Tap to retry.</Text></Pressable>}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={paused ? 'Resume story' : 'Pause story'} onPress={() => setPaused(value => !value)} style={{ alignItems: 'center', padding: 12 }}><Text style={{ color: '#BBC4D5', fontSize: 12 }}>{paused ? 'Tap to resume' : 'Tap to pause · Tap sides to navigate'}</Text></Pressable>
  </View>;
}
