import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedIcon } from './feed-icon';

type Scenario = 'feed_timeout' | 'upload_rejected' | 'invalid_response' | 'message_retry' | 'log_levels';
const scenarios: { id: Scenario; title: string; description: string; badge: string }[] = [
  { id: 'feed_timeout', title: 'Feed request timed out', description: 'A feed request exceeds its timeout. Sends a captured error and an error log.', badge: 'ERROR + LOG' },
  { id: 'upload_rejected', title: 'Photo upload rejected', description: 'A photo exceeds the upload limit. Sends a captured error and a warning log.', badge: 'ERROR + LOG' },
  { id: 'invalid_response', title: 'Unexpected server response', description: 'A feed response contains malformed JSON. Captures the parsing exception and an error log.', badge: 'ERROR + LOG' },
  { id: 'message_retry', title: 'Message succeeds after retry', description: 'A temporary connection failure recovers. Sends warning and success logs.', badge: 'RECOVERY LOGS' },
  { id: 'log_levels', title: 'Explore all six log levels', description: 'Sends trace, debug, info, warn, error, and fatal examples to the Logs view.', badge: '6 LOGS' },
];

function simulateFailure(scenario: Scenario): never {
  if (scenario === 'invalid_response') JSON.parse('{"posts":');
  const error = new Error(scenario === 'upload_rejected'
    ? '[Sentry test] Photo upload rejected: file exceeds 10 MB limit'
    : '[Sentry test] Feed request timed out after 8000 ms');
  error.name = scenario === 'upload_rejected' ? 'UploadTooLargeError' : 'FeedTimeoutError';
  throw error;
}

export function SentryTestScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const busy = useRef(false);
  const mounted = useRef(true);
  const [running, setRunning] = useState<Scenario | null>(null);
  const [result, setResult] = useState('Choose a scenario to generate test events.');
  useEffect(() => {
    mounted.current = true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => { mounted.current = false; subscription.remove(); };
  }, [onClose]);

  async function run(scenario: Scenario) {
    if (busy.current) return;
    busy.current = true;
    setRunning(scenario);
    setResult('Generating test events…');
    const runId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const attributes = { test_run_id: runId, scenario, source: 'sentry_test', synthetic: true, platform: Platform.OS };
    let eventId: string | undefined;
    try {
      const client = Sentry.getClient();
      if (!client || client.getOptions().enabled === false || !client.getOptions().enableLogs) {
        setResult('Sentry or structured logs are disabled. Enable Sentry logs and reload the app.');
        return;
      }
      Sentry.withScope(scope => {
        scope.setTags({ source: 'sentry_test', scenario, test_run_id: runId, synthetic: 'true' });
        scope.setContext('simulation', attributes);
        scope.addBreadcrumb({ category: 'sentry_test', message: 'Test scenario selected', level: 'info', data: attributes });
        if (scenario === 'message_retry') {
          Sentry.logger.warn('[Sentry test] Message delivery failed; retry scheduled', { ...attributes, attempt: 1, reason: 'connection_reset', retry_delay_ms: 1000 });
          Sentry.logger.info('[Sentry test] Message delivered after retry', { ...attributes, attempt: 2, duration_ms: 1250, recovered: true });
        } else if (scenario === 'log_levels') {
          Sentry.logger.trace('[Sentry test] Feed cache lookup started', attributes);
          Sentry.logger.debug('[Sentry test] Feed cache miss', { ...attributes, cache_key: 'demo_feed' });
          Sentry.logger.info('[Sentry test] Feed loaded', { ...attributes, post_count: 12 });
          Sentry.logger.warn('[Sentry test] Feed request rate limited', { ...attributes, status_code: 429 });
          Sentry.logger.error('[Sentry test] Feed refresh failed', { ...attributes, status_code: 503 });
          Sentry.logger.fatal('[Sentry test] Feed service unavailable', { ...attributes, retry_count: 3 });
        } else {
          const details = scenario === 'upload_rejected'
            ? { operation: 'photo_upload', status_code: 413, file_size_mb: 15, max_size_mb: 10 }
            : scenario === 'invalid_response'
              ? { operation: 'feed_parse', status_code: 200 }
              : { operation: 'feed_fetch', timeout_ms: 8000, retry_count: 2 };
          scope.setContext('operation', details);
          try { simulateFailure(scenario); } catch (error) {
            eventId = Sentry.captureException(error);
            const logAttributes = { ...attributes, ...details, event_id: eventId };
            if (scenario === 'upload_rejected') {
              Sentry.logger.warn('[Sentry test] Photo upload rejected', logAttributes);
            } else {
              Sentry.logger.error('[Sentry test] Feed operation failed', logAttributes);
            }
          }
        }
      });
      const flushed = await client.flush(5000);
      if (mounted.current) setResult(`${flushed ? 'Queue flushed. Check Sentry for delivery.' : 'Events queued; flush timed out. Delivery may be delayed.'}\n\nRun: ${runId}${eventId ? `\nError event: ${eventId}` : ''}`);
    } catch {
      if (mounted.current) setResult(`Could not finish sending. Check your connection and Sentry configuration.\n\nRun: ${runId}`);
    } finally {
      busy.current = false;
      if (mounted.current) setRunning(null);
    }
  }

  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to settings" onPress={onClose} style={styles.back}><FeedIcon name="back" size={24} color="#080E3B" /></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Sentry test</Text>
      <Text style={styles.subtitle}>Explore errors, context, and logs in your dashboard. These simulations use made-up data and keep the app running.</Text>
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>Find your test events</Text>
        <Text style={styles.body}>Select the codexgram project. In Issues or Logs, filter by source:sentry_test. Use test_run_id to match a button press across errors and logs. Log-only tests appear in Logs.</Text>
      </View>
      {scenarios.map(scenario => <Pressable key={scenario.id} accessibilityRole="button" accessibilityLabel={scenario.title} accessibilityState={{ disabled: running !== null, busy: running === scenario.id }} disabled={running !== null} onPress={() => { void run(scenario.id); }} style={({ pressed }) => [styles.card, { opacity: pressed || (running !== null && running !== scenario.id) ? 0.55 : 1 }]}>
        <Text style={styles.badge}>{scenario.badge}</Text>
        <Text style={styles.cardTitle}>{scenario.title}</Text>
        <Text style={styles.body}>{scenario.description}</Text>
        <Text style={styles.action}>{running === scenario.id ? 'Sending…' : 'Run test →'}</Text>
      </Pressable>)}
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>Latest result</Text>
        <Text selectable accessibilityLiveRegion="polite" style={styles.body}>{result}</Text>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFDFE' },
  content: { paddingHorizontal: 22, gap: 14 },
  back: { minHeight: 44, minWidth: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2, color: '#080E3B' },
  subtitle: { color: '#63718C', fontSize: 15, lineHeight: 22 },
  guide: { backgroundColor: '#EAF2FF', borderRadius: 16, padding: 16, gap: 8 },
  guideTitle: { fontWeight: '600', fontSize: 15, color: '#080E3B' },
  body: { fontSize: 14, lineHeight: 21, color: '#52617D' },
  card: { padding: 18, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: '#DCE5F2', backgroundColor: '#FFFFFF', gap: 8 },
  badge: { color: '#68769A', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: '#080E3B', fontSize: 18, fontWeight: '600' },
  action: { color: '#007AFF', fontSize: 15, fontWeight: '600', marginTop: 4 },
});
