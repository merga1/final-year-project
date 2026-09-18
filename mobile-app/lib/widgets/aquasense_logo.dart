import 'package:flutter/material.dart';

/// Custom vector icon painter matching the exact AquaSense logo.
class AquaSenseIconPainter extends CustomPainter {
  const AquaSenseIconPainter();

  @override
  void paint(Canvas canvas, Size size) {
    // Standard coordinates mapped from 140x160 canvas
    final scaleX = size.width / 140.0;
    final scaleY = size.height / 160.0;
    final scale = scaleX < scaleY ? scaleX : scaleY;

    final offsetX = (size.width - 140.0 * scale) / 2;
    final offsetY = (size.height - 160.0 * scale) / 2;

    canvas.save();
    canvas.translate(offsetX, offsetY);
    canvas.scale(scale);

    // 1. Water Droplet
    final dropPaint = Paint()
      ..color = const Color(0xFF1E6B52)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final dropPath = Path();
    dropPath.moveTo(65, 10);
    // Left shoulder down to circular bottom
    dropPath.cubicTo(65, 10, 15, 75, 15, 105);
    // Bottom circular arc: center at (65, 105), radius 50
    dropPath.arcToPoint(
      const Offset(115, 105),
      radius: const Radius.circular(50),
      clockwise: false,
    );
    // Right shoulder back up to apex
    dropPath.cubicTo(115, 75, 65, 10, 65, 10);
    dropPath.close();

    canvas.drawPath(dropPath, dropPaint);

    // 2. Copper / Terracotta circular dot on top right slope
    final dotPaint = Paint()
      ..color = const Color(0xFFCC7A42)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    canvas.drawCircle(const Offset(102, 40), 9.0, dotPaint);

    // 3. Heartbeat / Pulse ECG line in white
    final pulsePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;

    final pulsePath = Path();
    pulsePath.moveTo(22, 105);
    pulsePath.lineTo(48, 105);
    pulsePath.lineTo(60, 78);
    pulsePath.lineTo(74, 128);
    pulsePath.lineTo(86, 105);
    pulsePath.lineTo(108, 105);

    canvas.drawPath(pulsePath, pulsePaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Standalone icon widget
class AquaSenseIcon extends StatelessWidget {
  const AquaSenseIcon({super.key, this.size = 56.0});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size * (160.0 / 140.0),
      child: const CustomPaint(
        painter: AquaSenseIconPainter(),
      ),
    );
  }
}

/// Complete horizontal or stacked AquaSense logo with typography
class AquaSenseLogo extends StatelessWidget {
  const AquaSenseLogo({
    super.key,
    this.iconSize = 56.0,
    this.showSubtitle = true,
    this.horizontal = true,
    this.textColor,
  });

  final double iconSize;
  final bool showSubtitle;
  final bool horizontal;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    final titleColor = textColor ?? const Color(0xFF1E6B52);
    final subtitleColor = textColor != null
        ? textColor!.withValues(alpha: 0.8)
        : const Color(0xFF5A6E7F);

    final textColumn = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment:
          horizontal ? CrossAxisAlignment.start : CrossAxisAlignment.center,
      children: [
        Text(
          'AquaSense',
          style: TextStyle(
            color: titleColor,
            fontSize: iconSize * 0.55,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            height: 1.1,
          ),
        ),
        if (showSubtitle)
          Text(
            'Smart water monitoring',
            style: TextStyle(
              color: subtitleColor,
              fontSize: iconSize * 0.25,
              fontWeight: FontWeight.w500,
              height: 1.2,
            ),
          ),
      ],
    );

    if (horizontal) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          AquaSenseIcon(size: iconSize),
          SizedBox(width: iconSize * 0.28),
          textColumn,
        ],
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        AquaSenseIcon(size: iconSize),
        const SizedBox(height: 12),
        textColumn,
      ],
    );
  }
}
