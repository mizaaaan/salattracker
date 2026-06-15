import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

/**
 * Glowing card that shows the next prayer name + live countdown.
 *
 * Props: name, time (formatted string), countdown ('HH:MM:SS'), meta
 */
export default function NextPrayerBanner({ name, time, countdown, meta }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderColor = glow.interpolate({
    inputRange:  [0, 1],
    outputRange: [Colors.primary + '30', Colors.primary + '90'],
  });

  return (
    <Animated.View style={[styles.card, { borderColor }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Text style={styles.label}>NEXT PRAYER</Text>
        <View style={styles.namePill}>
          <Text style={styles.nameText}>
            {meta?.icon}  {name}
          </Text>
        </View>
      </View>

      {/* Countdown */}
      <Text style={styles.countdown}>{countdown}</Text>

      {/* Scheduled time */}
      <Text style={styles.scheduledTime}>
        Iqamah at  {time}
      </Text>

      {/* Progress dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical:   12,
    backgroundColor:  Colors.night,
    borderRadius:     24,
    padding:          22,
    borderWidth:      1.5,
    alignItems:       'center',
    shadowColor:      Colors.primary,
    shadowOffset:     { width: 0, height: 0 },
    shadowOpacity:    0.25,
    shadowRadius:     20,
    elevation:        8,
  },
  topRow: {
    flexDirection:  'row',
    width:          '100%',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   16,
  },
  label: {
    color:         Colors.textSecondary,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1.5,
  },
  namePill: {
    backgroundColor: Colors.primary + '20',
    borderRadius:    20,
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderWidth:     1,
    borderColor:     Colors.primary + '50',
  },
  nameText: {
    color:      Colors.primary,
    fontSize:   13,
    fontWeight: '700',
  },
  countdown: {
    color:         Colors.text,
    fontSize:      50,
    fontWeight:    '800',
    letterSpacing: 3,
    fontVariant:   ['tabular-nums'],
    marginBottom:  6,
  },
  scheduledTime: {
    color:    Colors.textSecondary,
    fontSize: 13,
  },
  dots: {
    flexDirection:  'row',
    marginTop:      16,
    gap:            6,
  },
  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width:           18,
  },
});
