import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const SIZE   = 270;
const STROKE = 14;
const R      = (SIZE - STROKE) / 2;
const CX     = SIZE / 2;
const CY     = SIZE / 2 + 8;

/**
 * A dome-shaped (half-circle) progress arc with a moving dot, plus a
 * centered name / sublabel / countdown — used on the Home screen to show
 * progress through the daylight hours and time left in the current prayer.
 */
export default function PrayerArc({
  progress, label, sublabel, countdown,
  trackColor, fillColor, dotColor, textColor, subTextColor,
}) {
  const clamped    = Math.max(0, Math.min(1, progress));
  const pathLength = Math.PI * R;
  const angle       = Math.PI * (1 - clamped); // 180° (left) → 0° (right)
  const dotX        = CX + R * Math.cos(angle);
  const dotY        = CY - R * Math.sin(angle);
  const d           = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={CY + STROKE} viewBox={`0 0 ${SIZE} ${CY + STROKE}`}>
        <Path d={d} stroke={trackColor} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        <Path
          d={d}
          stroke={fillColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${pathLength} ${pathLength}`}
          strokeDashoffset={pathLength * (1 - clamped)}
        />
        <Circle cx={dotX} cy={dotY} r={7} fill={dotColor} />
      </Svg>

      <View style={styles.overlay} pointerEvents="none">
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        <Text style={[styles.sublabel, { color: subTextColor }]}>{sublabel}</Text>
        <Text style={[styles.countdown, { color: textColor }]}>{countdown}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label:     { fontSize: 20, fontWeight: '700' },
  sublabel:  { fontSize: 12, marginTop: 2, opacity: 0.85 },
  countdown: { fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: 1, fontVariant: ['tabular-nums'] },
});
