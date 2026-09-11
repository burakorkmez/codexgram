import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackendToken } from '@/context/social-context';
import { api, errorMessage, type Id } from '@/lib/social';
import { sendUpload, validateMedia } from '@/lib/upload';
import { ui } from './ui';
import { FeedIcon } from '../feed-icon';

export function Composer() {
  const router = useRouter(); const insets = useSafeAreaInsets(); const getToken = useBackendToken();
  const begin = useMutation(api.uploads.begin); const cancel = useMutation(api.uploads.cancel); const publish = useMutation(api.posts.publish);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null); const [caption, setCaption] = useState('');
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'uploading' | 'publishing'>('idle'); const [progress, setProgress] = useState(0); const [error, setError] = useState(''); const [picking, setPicking] = useState(false);
  const uploadId = useRef<Id<'uploads'> | null>(null); const uploaded = useRef(false); const busy = useRef(false); const controller = useRef<AbortController | null>(null); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  function close() {
    if (busy.current) {
      if (phase === 'publishing') { Alert.alert('Finishing publication', 'Keep this screen open while the server confirms your post.'); return; }
      Alert.alert('Cancel upload?', 'Your unfinished upload and caption will be discarded.', [{ text: 'Keep uploading', style: 'cancel' }, { text: 'Cancel upload', style: 'destructive', onPress: () => {
        controller.current?.abort();
        if (uploadId.current) void cancel({ id: uploadId.current }).catch(() => {});
        router.back();
      } }]); return;
    }
    const discard = () => { if (uploadId.current) void cancel({ id: uploadId.current }).catch(() => {}); router.back(); };
    if (asset || caption) Alert.alert('Discard post?', 'Your selected media and caption will be discarded.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: discard }]); else discard();
  }
  async function pick() {
    if (busy.current || picking) return; setPicking(true); setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: false, quality: 1, videoMaxDuration: 30 });
      if (result.canceled) return;
      validateMedia(result.assets[0]);
      if (uploadId.current) await cancel({ id: uploadId.current });
      uploadId.current = null; uploaded.current = false; setAsset(result.assets[0]); setProgress(0);
    } catch (e) { setError(e instanceof Error ? e.message : errorMessage(e)); } finally { setPicking(false); }
  }
  async function submit() {
    if (!asset || busy.current) return; busy.current = true; controller.current = new AbortController(); const signal = controller.current.signal; setError(''); setPhase('preparing');
    try {
      const meta = validateMedia(asset);
      if (!uploadId.current) uploadId.current = await begin({ purpose: 'post', kind: meta.kind, width: meta.width, height: meta.height, ...(meta.duration ? { duration: meta.duration } : {}) });
      if (signal.aborted) { if (uploadId.current) void cancel({ id: uploadId.current }).catch(() => {}); return; }
      if (!uploaded.current) {
        const local = await fetch(asset.uri); const raw = await local.blob();
        if (!raw.size || raw.size > meta.max) throw new Error('This file is empty or exceeds the upload size limit.');
        const blob = raw.slice(0, raw.size, meta.mime);
        const token = await getToken(); if (!token) throw new Error('Session expired. Sign in again.');
        if (signal.aborted) return; setPhase('uploading');
        await sendUpload(uploadId.current, blob, token, setProgress, signal);
        uploaded.current = true;
      }
      if (signal.aborted) return;
      setPhase('publishing'); await publish({ uploadId: uploadId.current, caption });
      uploadId.current = null; uploaded.current = false; busy.current = false; router.back();
    } catch (e) { if (mounted.current) setError(e instanceof Error && !(e as { data?: unknown }).data ? e.message : errorMessage(e)); }
    finally { busy.current = false; if (mounted.current) setPhase('idle'); }
  }
  return <KeyboardAvoidingView style={[ui.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={ui.header}><Pressable accessibilityRole="button" accessibilityLabel="Close composer" onPress={close} style={ui.round}><FeedIcon name="close" /></Pressable><Text style={[ui.title, { flex: 1 }]}>New post</Text><Pressable disabled={phase !== 'idle' || picking || !asset} style={[ui.button, (!asset || phase !== 'idle') && ui.disabled]} onPress={() => void submit()}><Text style={ui.buttonText}>Publish</Text></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 30 }}>
      <Pressable disabled={phase !== 'idle' || picking} onPress={() => void pick()} style={{ backgroundColor: '#EEF3FA', borderRadius: 22, minHeight: 260, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {asset?.type !== 'video' && asset ? <Image source={{ uri: asset.uri }} style={{ width: '100%', aspectRatio: 1 }} contentFit="contain" /> : <View style={{ padding: 30, gap: 14, alignItems: 'center' }}><FeedIcon name="camera" size={40} color="#087EFF" /><Text style={ui.text}>{asset ? `Video selected · ${Math.round((asset.duration ?? 0) / 1000)} seconds` : 'Choose a photo or video'}</Text><Text style={ui.link}>{picking ? 'Opening library…' : asset ? 'Change media' : 'Open photo library'}</Text></View>}
      </Pressable>
      <Text style={ui.muted}>One photo up to 10 MB, or an MP4/MOV video up to 30 seconds and 50 MB.</Text>
      <TextInput accessibilityLabel="Post caption" placeholder="Write a caption…" value={caption} onChangeText={setCaption} editable={phase === 'idle'} multiline maxLength={2200} style={[ui.input, { minHeight: 120, textAlignVertical: 'top' }]} />
      <Text style={[ui.muted, { textAlign: 'right' }]}>{caption.length}/2200</Text>
      {phase !== 'idle' && <View style={{ gap: 10 }}><ActivityIndicator color="#087EFF" /><Text accessibilityLiveRegion="polite" style={ui.muted}>{phase === 'uploading' ? `Uploading ${Math.round(progress * 100)}%` : phase === 'publishing' ? 'Publishing…' : 'Preparing media…'} Keep this screen open.</Text><View style={{ height: 5, backgroundColor: '#E5EDF7', borderRadius: 4 }}><View style={{ height: 5, backgroundColor: '#087EFF', borderRadius: 4, width: `${progress * 100}%` }} /></View></View>}
      {!!error && <View style={{ gap: 12 }}><Text accessibilityRole="alert" style={ui.error}>{error}</Text><Pressable disabled={phase !== 'idle'} style={ui.button} onPress={() => void submit()}><Text style={ui.buttonText}>Retry publication</Text></Pressable></View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
