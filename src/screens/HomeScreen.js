import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';

import { Colors } from '../constants/colors';
import {
  calculatePrayerTimes, formatTime, getCountdown,
  getNextPrayer, ALL_PRAYERS, TRACKABLE_PRAYERS, PRAYER_META,
} from '../utils/prayerTimes';
import { getCompletedPrayers, togglePrayer } from '../utils/storage';
import {
  requestNotificationPermission,
  schedulePrayerNotifications,
} from '../utils/notifications';
import PrayerCard       from '../components/PrayerCard';
import NextPrayerBanner from '../components/NextPrayerBanner';

export default function HomeScreen() {
  const [prayerTimes,      setPrayerTimes]      = useState(null);
  const [completedPrayers, setCompletedPrayers] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [nextPrayer,       setNextPrayer]       = useState(null);
  const [countdown,        setCountdown]        = useState('--:--:--');

  const timesRef = useRef(null);

  // ── Load prayer times from GPS ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location access is needed to calculate prayer times.');
        return;
      }

      const loc   = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const times = calculatePrayerTimes(loc.coords.latitude, loc.coords.longitude);
      setPrayerTimes(times);
      timesRef.current = times;

      const granted = await requestNotificationPermission();
      if (granted) await schedulePrayerNotifications(times);

      const completed = await getCompletedPrayers();
      setCompletedPrayers(completed);
    } catch (e) {
      setError('Could not get location. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Live countdown ticker ──────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const times = timesRef.current;
      if (!times) return;
      const next = getNextPrayer(times);
      setNextPrayer(next);
      if (next) setCountdown(getCountdown(next.time));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Toggle a prayer done / undone ─────────────────────────────────────────
  const handleToggle = async (prayer) => {
    const updated = await togglePrayer(prayer);
    setCompletedPrayers(updated);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';     // Good morning
    if (h < 17) return 'مرحباً';          // Welcome
    return 'مساء الخير';                  // Good evening
  };

  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const completedCount = completedPrayers.filter(p =>
    TRACKABLE_PRAYERS.includes(p)
  ).length;

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Calculating prayer times…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: main ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>

        {/* Next prayer countdown */}
        {nextPrayer && (
          <NextPrayerBanner
            name={nextPrayer.name}
            time={formatTime(nextPrayer.time)}
            countdown={countdown}
            meta={PRAYER_META[nextPrayer.name]}
          />
        )}

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <Text style={styles.progressLabel}>
            {completedCount} / {TRACKABLE_PRAYERS.length} prayers completed today
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedCount / TRACKABLE_PRAYERS.length) * 100}%` },
              ]}
            />
          </View>
          {/* Mini circles for each prayer */}
          <View style={styles.dotRow}>
            {TRACKABLE_PRAYERS.map((p) => (
              <View
                key={p}
                style={[
                  styles.miniDot,
                  completedPrayers.includes(p) && styles.miniDotDone,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Prayer cards */}
        <View style={styles.list}>
          {ALL_PRAYERS.map((prayer) => (
            <PrayerCard
              key={prayer}
              name={prayer}
              meta={PRAYER_META[prayer]}
              time={formatTime(prayerTimes?.[prayer])}
              isCompleted={completedPrayers.includes(prayer)}
              isTrackable={TRACKABLE_PRAYERS.includes(prayer)}
              onToggle={() => handleToggle(prayer)}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.background,
  },
  center: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    padding:        32,
    gap:            16,
  },
  loadingText: {
    color:    Colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  errorText: {
    color:     Colors.textSecondary,
    fontSize:  15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor:  Colors.primary,
    paddingHorizontal: 28,
    paddingVertical:  12,
    borderRadius:     12,
    marginTop:        8,
  },
  retryText: {
    color:      Colors.background,
    fontWeight: '700',
    fontSize:   16,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     4,
  },
  greeting: {
    fontSize:   26,
    fontWeight: '700',
    color:      Colors.primary,
    textAlign:  'right',
  },
  date: {
    fontSize:  13,
    color:     Colors.textSecondary,
    marginTop: 4,
  },

  // Progress
  progressWrap: {
    marginHorizontal: 16,
    marginVertical:   8,
  },
  progressLabel: {
    color:        Colors.textSecondary,
    fontSize:     12,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  progressTrack: {
    height:          5,
    backgroundColor: Colors.border,
    borderRadius:    3,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: Colors.primary,
    borderRadius:    3,
  },
  dotRow: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     8,
  },
  miniDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.border,
  },
  miniDotDone: {
    backgroundColor: Colors.primary,
  },

  // Prayer list
  list: {
    paddingHorizontal: 16,
    paddingTop:        8,
  },
});
