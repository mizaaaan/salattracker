import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../constants/ThemeContext';

/**
 * A single prayer row.
 *
 * Props:
 *   name        — 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
 *   meta        — { icon, color }
 *   timeLabel   — preformatted "start – end" string, e.g. "11:57 – 04:35"
 *   isCompleted — boolean
 *   isCurrent   — boolean, highlights the row for the active prayer window
 *   onToggle    — () => void
 */
export default function PrayerCard({ name, meta, timeLabel, isCompleted, isCurrent, onToggle }) {
  const { colors: Colors } = useTheme();
  const styles = getStyles(Colors);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.row, isCurrent && styles.rowCurrent]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.left}>
          <Text style={styles.icon}>{meta.icon}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.time}>{timeLabel}</Text>
          <View style={[styles.circle, isCompleted && styles.circleDone]}>
            {isCompleted && <Text style={styles.check}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius:    12,
  },
  rowCurrent: {
    backgroundColor: Colors.primaryDim,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  icon: { fontSize: 18 },
  name: {
    color:      Colors.text,
    fontSize:   15,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
  },
  time: {
    color:    Colors.textSecondary,
    fontSize: 14,
  },
  circle: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    2,
    borderColor:    Colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },
  check: {
    color:      Colors.background,
    fontSize:   12,
    fontWeight: '800',
  },
});
