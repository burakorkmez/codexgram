import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const legalUrls = {
  'Privacy Policy': 'https://codexgram-legal.pages.dev/privacy',
  'Terms of Service': 'https://codexgram-legal.pages.dev/terms',
} as const;

export async function openLegalDocument(document: keyof typeof legalUrls) {
  try {
    await WebBrowser.openBrowserAsync(legalUrls[document], {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: 'done',
      controlsColor: '#007AFF',
      toolbarColor: '#FCFDFE',
    });
  } catch {
    Alert.alert(`Unable to open ${document}`, 'Please try again or open this address in your browser:\n' + legalUrls[document]);
  }
}
