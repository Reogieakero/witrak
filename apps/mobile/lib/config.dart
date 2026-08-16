class AppConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://imizzvmjdwyxlcmovlch.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltaXp6dm1qZHd5eGxjbW92bGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTkwOTksImV4cCI6MjEwMjAzNTA5OX0.SEozChFyk1fjLujRid9dBYx6-Zwspsr4CEWP77i30y0',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}
