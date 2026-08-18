import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { alpha, FhusoColors, FhusoFonts, ThemeMode } from '../core/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'qr-code-outline',
    title: 'Scan member QR codes',
    body: 'Point the camera at a member\u2019s QR code to log their attendance in seconds.',
  },
  {
    icon: 'wifi-outline',
    title: 'Works offline',
    body: 'No signal? Scans are saved on this device and upload the moment you hit Sync.',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Instant feedback',
    body: 'See who checked in, who was already counted, and a full scan history.',
  },
];

interface OnboardingScreenProps {
  themeMode: ThemeMode;
  onDone: () => void;
}

export function OnboardingScreen({ themeMode, onDone }: OnboardingScreenProps) {
  const isDark = themeMode === 'dark';
  const colors = {
    canvas: isDark ? FhusoColors.canvasDark : FhusoColors.canvasLight,
    surface: isDark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight,
    border: isDark ? FhusoColors.borderDark : FhusoColors.borderLight,
    ink: isDark ? FhusoColors.inkDark : FhusoColors.inkLight,
    muted: isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <View style={styles.hero}>
            <View style={[styles.logoWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.ink }]}>Liberal Scanner</Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>
              The official attendance scanner for the FHU Student Organization.
            </Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[
                  styles.feature,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  i < FEATURES.length - 1 && styles.featureGap,
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: alpha(FhusoColors.brand, 0.12) }]}>
                  <Ionicons name={f.icon} size={22} color={FhusoColors.brand} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={[styles.featureTitle, { color: colors.ink }]}>{f.title}</Text>
                  <Text style={[styles.featureText, { color: colors.muted }]}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onDone}
            style={[styles.cta, { backgroundColor: FhusoColors.brand }]}
          >
            <Text style={styles.ctaLabel}>Get started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Text style={[styles.footerNote, { color: colors.muted }]}>
            You can switch between light and dark mode any time.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  hero: { alignItems: 'center' },
  logoWrap: {
    width: 132,
    height: 132,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 132, height: 132 },
  appName: {
    fontSize: 28,
    fontFamily: FhusoFonts.extraBold,
    marginTop: 18,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: FhusoFonts.medium,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  features: { marginTop: 32 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  featureGap: { marginBottom: 12 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1, marginLeft: 14 },
  featureTitle: { fontSize: 15, fontFamily: FhusoFonts.bold },
  featureText: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 8 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
  },
  ctaLabel: { color: '#fff', fontSize: 16, fontFamily: FhusoFonts.bold, marginRight: 8 },
  footerNote: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});