import 'package:flutter_test/flutter_test.dart';

import 'package:fhusocom_mobile/main.dart';

void main() {
  testWidgets('App boots to onboarding', (WidgetTester tester) async {
    await tester.pumpWidget(const FhusoMobileApp());

    expect(find.text('FHUSOCOM QR Attendance'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
  });
}
