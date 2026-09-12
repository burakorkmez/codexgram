import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, type ReactElement, useEffect, useRef } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { topics } from '@/lib/explore-data';
import { FeedIcon } from './feed-icon';

export const exploreColors = { blue: '#087EFF', ink: '#0C1230', muted: '#808AA5' };
export type ExplorePerson = { id: string; name: string; topic: string; portrait: ReactNode; follow: ReactNode; onPress: () => void };
export type ExploreTile = { id: string; name: string; caption: string; media: ReactNode; avatar: ReactNode; likes: number; liked: boolean; pending?: boolean; onLike: () => void; onPress: () => void; onAuthor: () => void };
type Props = {
  people: ExplorePerson[]; posts: ExploreTile[]; query: string; onQuery: (value: string) => void;
  topic: string; onTopic: (value: string) => void; onPeople: () => void; onTopics: () => void; onCompose: () => void;
  notice?: ReactNode; footer?: ReactElement; empty?: ReactElement; onEndReached?: () => void;
};

export function ExploreLayout(props: Props) {
  const { width, height } = useWindowDimensions(); const insets = useSafeAreaInsets(); const s = width / 390; const v = height / 874;
  const search = useRef<TextInput>(null); const list = useRef<FlatList<ExploreTile>>(null);
  const c = exploreColors;
  useEffect(() => { list.current?.scrollToOffset({ offset: 0, animated: false }); }, [props.topic, props.query]);
  const choose = (value: string) => { props.onTopic(value); list.current?.scrollToOffset({ offset: 0, animated: true }); };
  return <View style={{ flex: 1, backgroundColor: '#FCFDFE', paddingTop: Math.max(40 * s, insets.top - 13 * s) }}>
    <StatusBar style="dark" />
    <View style={{ height: 44 * v, marginHorizontal: 14 * s, flexDirection: 'row', alignItems: 'center', gap: 9 * s }}>
      <Image source={require('../../assets/images/codexgram-mark.png')} style={{ width: 35 * s, height: 34 * v }} />
      <Text style={{ flex: 1, fontSize: 23 * s, fontWeight: '700', letterSpacing: -0.8 * s, color: c.ink }}>Codexgram</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Search Explore" onPress={() => { list.current?.scrollToOffset({ offset: 0, animated: true }); search.current?.focus(); }} style={[styles.round, { width: 34 * s, height: 34 * v }]}><FeedIcon name="search" size={22 * s} color={c.ink} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Create a post" onPress={props.onCompose} style={[styles.round, { width: 34 * s, height: 34 * v, backgroundColor: '#EDF3FC' }]}><FeedIcon name="plus" size={23 * s} color={c.blue} /></Pressable>
    </View>
    {props.notice}
    <FlatList ref={list} data={props.posts} numColumns={3} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false} columnWrapperStyle={{ gap: 6 * s, paddingHorizontal: 7 * s }} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} onEndReached={props.onEndReached} onEndReachedThreshold={0.4} ListFooterComponent={props.footer} ListEmptyComponent={props.empty ?? <Text style={{ padding: 28, textAlign: 'center', color: c.muted }}>No posts found. Try another search or topic.</Text>} ListHeaderComponent={<>
      <View style={{ marginHorizontal: 14 * s, marginTop: 4 * v, height: 34 * v, borderRadius: 22 * s, backgroundColor: '#F0F2F7', paddingHorizontal: 13 * s, flexDirection: 'row', alignItems: 'center', gap: 12 * s }}><FeedIcon name="search" size={19 * s} color={c.muted} /><TextInput ref={search} accessibilityLabel="Search people, posts, or topics" placeholder="Search people, posts, or topics..." placeholderTextColor={c.muted} value={props.query} onChangeText={props.onQuery} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" style={{ flex: 1, padding: 0, height: '100%', fontSize: 12 * s, color: c.ink }} /></View>
      <View style={{ marginHorizontal: 14 * s, marginTop: 12 * v, marginBottom: 4 * v, height: 18 * v, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text accessibilityRole="header" style={{ fontSize: 13 * s, fontWeight: '700', letterSpacing: -0.4 * s, color: c.ink }}>Suggested for you</Text><Pressable accessibilityRole="button" accessibilityLabel="See all suggested people" onPress={props.onPeople} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * s }}><Text style={{ fontSize: 10.5 * s, color: c.blue }}>See all</Text><View style={{ transform: [{ rotate: '180deg' }] }}><FeedIcon name="back" size={10 * s} /></View></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 * s, gap: 19 * s, minWidth: width }}>
        {props.people.map(person => <View key={person.id} style={{ width: 57 * s, alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel={`View ${person.name}`} onPress={person.onPress}>{person.portrait}</Pressable><Pressable onPress={person.onPress} style={{ width: '100%' }}><Text numberOfLines={1} style={{ textAlign: 'center', fontSize: 10 * s, lineHeight: 12 * s, fontWeight: '600', color: c.ink, letterSpacing: -0.4 * s, marginTop: 0 }}>{person.name}</Text></Pressable><Text numberOfLines={1} adjustsFontSizeToFit={person.topic.length <= 18} minimumFontScale={0.8} style={{ fontSize: 8.5 * s, lineHeight: 11 * s, color: c.muted, letterSpacing: -0.3 * s, marginBottom: 4 * v }}>{person.topic}</Text>{person.follow}</View>)}
        {!props.people.length && <Text style={{ height: 105 * s, color: c.muted, fontSize: 12 * s, paddingTop: 20 * s }}>No suggested people yet.</Text>}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 5 * s, marginHorizontal: 14 * s, marginTop: 16 * v, marginBottom: 10 * v, height: 23 * v }}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 * s }} style={{ flex: 1 }}>{topics.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} topic`} accessibilityState={{ selected: props.topic === value }} onPress={() => choose(value)} style={{ backgroundColor: props.topic === value ? c.blue : '#EEF1F6', borderRadius: 16 * s, paddingHorizontal: (value === 'All' ? 14 : 8) * s, justifyContent: 'center' }}><Text style={{ fontSize: 9 * s, color: props.topic === value ? 'white' : '#54617D' }}>{value}</Text></Pressable>)}</ScrollView><Pressable accessibilityRole="button" accessibilityLabel="Choose a topic" onPress={props.onTopics} style={[styles.round, { width: 24 * s, height: 23 * v, backgroundColor: '#EEF1F6' }]}><View style={{ transform: [{ rotate: '-90deg' }] }}><FeedIcon name="back" size={12 * s} color="#54617D" /></View></Pressable></View>
    </>} renderItem={({ item, index }) => <View style={{ width: (width - 26 * s) / 3, borderRadius: 8 * s, backgroundColor: '#FCFDFE', boxShadow: '0px 2px 4px #14233C0D', marginBottom: 7 * v }}>
      <View style={{ height: (index < 3 ? 155 : 149) * v, borderRadius: 7 * s, overflow: 'hidden' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.caption || item.name}`} onPress={item.onPress} style={StyleSheet.absoluteFill}>{item.media}</Pressable>
        <LinearGradient pointerEvents="none" colors={['#00000015', 'transparent', 'transparent', '#00000040']} locations={[0, 0.28, 0.72, 1]} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 5 * s, left: 5 * s, right: 5 * s, flexDirection: 'row', alignItems: 'center', gap: 4 * s }} pointerEvents="box-none"><Pressable accessibilityLabel={`View ${item.name}`} onPress={item.onAuthor} style={{ borderRadius: 13 * s, borderWidth: s, borderColor: 'white', overflow: 'hidden' }}>{item.avatar}</Pressable><Pressable onPress={item.onAuthor} style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: 'white', fontSize: 8.2 * s, fontWeight: '600', letterSpacing: -0.3 * s }}>{item.name}</Text></Pressable><Pressable accessibilityLabel={`Options for ${item.caption || item.name}`} onPress={item.onPress} hitSlop={8}><Text style={{ color: 'white', fontSize: 11 * s, fontWeight: '700' }}>•••</Text></Pressable></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${item.liked ? 'Unlike' : 'Like'} ${item.caption || item.name}`} accessibilityState={{ selected: item.liked, disabled: item.pending }} disabled={item.pending} onPress={item.onLike} hitSlop={4} style={{ position: 'absolute', bottom: 4 * s, left: 7 * s, minHeight: 18 * s, flexDirection: 'row', alignItems: 'center', gap: 4 * s }}><FeedIcon name="heart" size={15 * s} color={item.liked ? '#FF4565' : 'white'} filled={item.liked} /><Text style={{ color: 'white', fontSize: 10 * s, fontWeight: '600' }}>{item.likes}</Text></Pressable>
      </View>
      <Pressable onPress={item.onPress} style={{ height: 35 * v, paddingHorizontal: 8 * s, paddingVertical: 5 * v }}><Text numberOfLines={2} style={{ fontSize: 10.5 * s, lineHeight: 12.5 * v, letterSpacing: -0.3 * s, color: c.ink }}>{item.caption}</Text></Pressable>
    </View>} />

  </View>;
}
const styles = StyleSheet.create({ round: { borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F5F9' } });
