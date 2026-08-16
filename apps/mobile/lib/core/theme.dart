import 'package:flutter/material.dart';

/// GitHub/Supabase-inspired palette.
///
/// Light mode mirrors GitHub's clean neutrals (white canvas, slate ink, gray
/// borders). Dark mode mirrors Supabase's near-black canvas with subtle
/// surfaces. A single violet "brand" accent ties the two together.
class FhusoColors {
  // Brand
  static const Color brand = Color(0xFF3B82F6);
  static const Color brandHover = Color(0xFF2563EB);

  // Light
  static const Color bgLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF6F8FA);
  static const Color borderLight = Color(0xFFD0D7DE);
  static const Color inkLight = Color(0xFF1F2328);
  static const Color mutedLight = Color(0xFF59636E);
  static const Color canvasLight = Color(0xFFF6F8FA);

  // Dark
  static const Color bgDark = Color(0xFF09090B);
  static const Color surfaceDark = Color(0xFF111113);
  static const Color borderDark = Color(0xFF27272A);
  static const Color inkDark = Color(0xFFE4E4E7);
  static const Color mutedDark = Color(0xFFA1A1AA);
  static const Color canvasDark = Color(0xFF111113);

  // Status
  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFDC2626);
  static const Color warning = Color(0xFFF59E0B);
}

/// Shared Material 3 theme options for both modes.
ThemeData _baseTheme({
  required Brightness brightness,
  required Color bg,
  required Color surface,
  required Color border,
  required Color ink,
  required Color muted,
}) {
  final scheme = ColorScheme.fromSeed(
    seedColor: FhusoColors.brand,
    brightness: brightness,
    surface: surface,
  );

  final outline = BorderSide(color: border);
  const radius = BorderRadius.all(Radius.circular(10));

  final theme = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    fontFamily: 'Nunito',
    colorScheme: scheme.copyWith(
      primary: FhusoColors.brand,
      onPrimary: Colors.white,
      secondary: FhusoColors.brand,
      onSurface: ink,
      onSurfaceVariant: muted,
      surface: surface,
      outline: border,
      error: FhusoColors.danger,
    ),
    scaffoldBackgroundColor: bg,
    dividerColor: border,
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: bg,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: ink),
      titleTextStyle: TextStyle(
        fontFamily: 'Nunito',
        color: ink,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: FhusoColors.brand,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: FhusoColors.brand,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ink,
        side: outline,
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: FhusoColors.brand),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: radius,
        borderSide: outline,
      ),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: outline),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: FhusoColors.brand, width: 1.6),
      ),
      hintStyle: TextStyle(color: muted),
      labelStyle: TextStyle(color: muted),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: surface,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: outline,
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: bg,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: const BorderRadius.all(Radius.circular(14))),
    ),
    dividerTheme: DividerThemeData(color: border, thickness: 1),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: FhusoColors.brand,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return Colors.white;
        return null;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return FhusoColors.brand;
        return null;
      }),
    ),
  );
  return theme;
}

ThemeData buildLightTheme() {
  return _baseTheme(
    brightness: Brightness.light,
    bg: FhusoColors.bgLight,
    surface: FhusoColors.surfaceLight,
    border: FhusoColors.borderLight,
    ink: FhusoColors.inkLight,
    muted: FhusoColors.mutedLight,
  );
}

ThemeData buildDarkTheme() {
  return _baseTheme(
    brightness: Brightness.dark,
    bg: FhusoColors.bgDark,
    surface: FhusoColors.surfaceDark,
    border: FhusoColors.borderDark,
    ink: FhusoColors.inkDark,
    muted: FhusoColors.mutedDark,
  );
}
