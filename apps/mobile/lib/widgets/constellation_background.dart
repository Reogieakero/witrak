import 'dart:math';

import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Animated starfield with faint connecting "constellation" lines.
///
/// Drifting stars that wrap around the edges, gently twinkle, and draw lines
/// to nearby neighbours — used as an ambient moving background.
class ConstellationBackground extends StatefulWidget {
  final bool isDark;

  const ConstellationBackground({super.key, this.isDark = true});

  @override
  State<ConstellationBackground> createState() => _ConstellationBackgroundState();
}

class _ConstellationBackgroundState extends State<ConstellationBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<_Star> _stars;
  final Random _random = Random(42);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 48),
    )..repeat();
    _stars = List.generate(48, (_) {
      return _Star(
        x: _random.nextDouble(),
        y: _random.nextDouble(),
        r: 0.6 + _random.nextDouble() * 1.7,
        vx: (_random.nextDouble() - 0.5) * 0.018,
        vy: (_random.nextDouble() - 0.5) * 0.018,
        tw: _random.nextDouble() * 6.2832,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.isDark ? const Color(0xFF070B16) : FhusoColors.canvasLight;
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, _) => CustomPaint(
        painter: _ConstellationPainter(_stars, _controller.value, widget.isDark, bg),
        size: Size.infinite,
      ),
    );
  }
}

class _Star {
  final double x;
  final double y;
  final double r;
  final double vx;
  final double vy;
  final double tw;

  _Star({
    required this.x,
    required this.y,
    required this.r,
    required this.vx,
    required this.vy,
    required this.tw,
  });
}

class _ConstellationPainter extends CustomPainter {
  final List<_Star> stars;
  final double t;
  final bool isDark;
  final Color bg;

  _ConstellationPainter(this.stars, this.t, this.isDark, this.bg);

  double _px(_Star s) => ((s.x + s.vx * t) % 1 + 1) % 1;
  double _py(_Star s) => ((s.y + s.vy * t) % 1 + 1) % 1;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = bg);

    final starColor = isDark ? Colors.white : const Color(0xFF1F2937);
    final lineColor = isDark ? Colors.white : const Color(0xFF3B82F6);
    final positions = stars
        .map((s) => Offset(_px(s) * size.width, _py(s) * size.height))
        .toList();

    final linePaint = Paint()..strokeWidth = 1;
    for (var i = 0; i < positions.length; i++) {
      for (var j = i + 1; j < positions.length; j++) {
        final d = (positions[i] - positions[j]).distance;
        if (d < 120) {
          linePaint.color = lineColor.withValues(alpha: (1 - d / 120) * 0.16);
          canvas.drawLine(positions[i], positions[j], linePaint);
        }
      }
    }

    final starPaint = Paint();
    for (var i = 0; i < positions.length; i++) {
      final twinkle = 0.6 + 0.4 * (0.5 + 0.5 * sin(t * 6.2832 * 2 + stars[i].tw));
      starPaint.color = starColor.withValues(alpha: 0.35 + 0.45 * twinkle);
      canvas.drawCircle(positions[i], stars[i].r + 0.4, starPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _ConstellationPainter old) => true;
}
