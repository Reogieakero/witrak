import 'package:flutter/material.dart';

import 'core/theme.dart';
import 'scan/events_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const FhusoMobileApp());
}

class FhusoMobileApp extends StatefulWidget {
  const FhusoMobileApp({super.key});

  @override
  State<FhusoMobileApp> createState() => _FhusoMobileAppState();
}

class _FhusoMobileAppState extends State<FhusoMobileApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void _toggleTheme() {
    setState(() {
      _themeMode =
          _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Liberal Scanner',
      debugShowCheckedModeBanner: false,
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: _themeMode,
      home: EventsScreen(
        themeMode: _themeMode,
        onToggleTheme: _toggleTheme,
      ),
    );
  }
}
