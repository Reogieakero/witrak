import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { ThemeMode } from './src/core/theme';
import { EventsScreen } from './src/scan/EventsScreen';

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [fontsLoaded] = useFonts({
    Nunito: require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('./assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
  });

  function toggleTheme() {
    setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111113', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <EventsScreen themeMode={themeMode} onToggleTheme={toggleTheme} />
    </SafeAreaProvider>
  );
}