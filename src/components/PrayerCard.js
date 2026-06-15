import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { Colors } from '../constants/colors';

/**
 * A single prayer row card.
 *
 * Props:
 *   name        — 'Fajr' | 'Dhuhr' | ... | 'Sunrise'
 *   meta        — { icon, arabic, color }
 *   time        — formatted string, e.g. '4:23 AM'
 *   isCompleted — boolean
 *   isTrackable — boolean (Sunrise is display-only)
 *   onToggle    — () => void
 */
export default function PrayerCard({
  name, meta, time, isCompleted, isTrackable, onToggle,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!isTrackable) return;
    // Quick bounce animation
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          isCompleted  && styles.cardDone,
          !isTrackable && styles.cardSunrise,
        ]}
        onPress={handlePress}
        activeOpacity={isTrackable ? 0.85 : 1}
      >
        {/* Left: icon + names */}
        <View style={styles.left}>
          <View style={[styles.iconWrapper, { backgroundColor: meta.color + '25' }]}>
            <Text style={styles.icon}>{meta.icon}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={[styles.arabic, { color: meta.color }]}>{meta.arabic}</Text>
          </View>
        </View>

        {/* Right: time + checkbox */}
        <View style={styles.right}>
          <Text style={[styles.time, isCompleted && styles.timeDone]}>{time}</Text>
          {isTrackable && (
            <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius:    16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    10,
  },
  cardDone: {
    borderColor:     Colors.primary + '50',
    backgroundColor: Colors.primary + '12',
  },
  cardSunrise: {
    opacity: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  iconWrapper: {
    width:         44,
    height:        44,
    borderRadius:  12,
    alignItems:    'center',
    justifyContent:'center',
  },
  icon: {
    fontSize: 22,
  },
  name: {
    color:      Colors.text,
    fontSize:   15,
    fontWeight: '600',
  },
  arabic: {
    fontSize:   13,
    marginTop:  2,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  time: {
    color:    Colors.textSecondary,
    fontSize: 14,
  },
  timeDone: {
    color: Colors.primary,
  },
  checkbox: {
    width:          30,
    height:         30,
    borderRadius:   15,
    borderWidth:    2,
    borderColor:    Colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },
  checkmark: {
    color:      Colors.background,
    fontSize:   15,
    fontWeight: '800',
  },
});
