import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeMode } from './src/core/theme';
import { OnboardingScreen } from './src/onboarding/OnboardingScreen';
import { EventsScreen } from './src/scan/EventsScreen';

const ONBOARDING_KEY = 'onboarding_seen_v1';

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [fontsLoaded] = useFonts({
    Nunito: require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('./assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
  });

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => {
        setShowOnboarding(seen !== '1');
      })
      .catch(() => {
        setShowOnboarding(true);
      })
      .finally(() => setOnboardingChecked(true));
  }, []);

  async function completeOnboarding() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    setShowOnboarding(false);
  }

  function toggleTheme() {
    setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  if (!fontsLoaded || !onboardingChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1e40af', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
        <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {showOnboarding ? (
        <OnboardingScreen themeMode={themeMode} onDone={completeOnboarding} />
      ) : (
        <EventsScreen themeMode={themeMode} onToggleTheme={toggleTheme} />
      )}
    </SafeAreaProvider>
  );
}