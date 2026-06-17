import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../constants/ThemeContext';
import {
  calculatePrayerTimes, formatTimeShort, getCountdown,
  getNextPrayer, getCurrentPrayer, getPrayerRanges, getMakruhTime,
  TRACKABLE_PRAYERS, PRAYER_META,
} from '../utils/prayerTimes';
import { getCompletedPrayers, togglePrayer } from '../utils/storage';
import {
  requestNotificationPermission,
  schedulePrayerNotifications,
} from '../utils/notifications';
import { formatHijriDate } from '../utils/hijriDate';
import PrayerCard from '../components/PrayerCard';
import PrayerArc  from '../components/PrayerArc';

const tomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

/** Small circular progress ring used on the "Tracker" tile. */
const MiniRing = ({ percent, color, track }) => {
  const SIZE = 44, STROKE = 4, R = (SIZE - STROKE) / 2, C = 2 * Math.PI * R;
  return (
    <Svg width={SIZE} height={SIZE}>
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={track} strokeWidth={STROKE} fill="none" />
      <Circle
        cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={color} strokeWidth={STROKE} fill="none"
        strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - percent)}
        strokeLinecap="round"
        rotation={-90}
        origin={`${SIZE / 2}, ${SIZE / 2}`}
      />
    </Svg>
  );
};

const FeatureTile = ({ icon, label, onPress, styles, badge }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.tileIconWrap}>
      {badge ?? <Text style={styles.tileIcon}>{icon}</Text>}
    </View>
    <Text style={styles.tileLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const { colors: Colors } = useTheme();
  const navigation = useNavigation();
  const styles = getStyles(Colors);

  const [prayerTimes,      setPrayerTimes]      = useState(null);
  const [tomorrowFajr,     setTomorrowFajr]     = useState(null);
  const [completedPrayers, setCompletedPrayers] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [locationLabel,    setLocationLabel]    = useState('Current Location');

  const [currentName, setCurrentName] = useState('');
  const [countdown,   setCountdown]   = useState('--:--:--');
  const [dayProgress, setDayProgress] = useState(0);
  const [isDaytime,   setIsDaytime]   = useState(true);

  const timesRef        = useRef(null);
  const tomorrowFajrRef = useRef(null);

  // ── Recompute "live" values (current prayer, countdown, day arc) ──────────
  const computeLive = useCallback(() => {
    const times = timesRef.current;
    if (!times) return;

    const current = getCurrentPrayer(times);
    setCurrentName(current.name);

    const next   = getNextPrayer(times);
    const target = next ? next.time : tomorrowFajrRef.current;
    setCountdown(target ? getCountdown(target) : '00:00:00');

    const sunrise = times.Sunrise?.getTime();
    const sunset  = times.Maghrib?.getTime();
    const now     = Date.now();
    if (sunrise && sunset && sunset > sunrise) {
      const p = (now - sunrise) / (sunset - sunrise);
      setDayProgress(Math.max(0, Math.min(1, p)));
      setIsDaytime(now >= sunrise && now <= sunset);
    }
  }, []);

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

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const times    = calculatePrayerTimes(latitude, longitude);
      const tmrTimes = calculatePrayerTimes(latitude, longitude, tomorrowDate());
      setPrayerTimes(times);
      setTomorrowFajr(tmrTimes.Fajr);
      timesRef.current        = times;
      tomorrowFajrRef.current = tmrTimes.Fajr;
      computeLive();

      // Best-effort: show a district/city name instead of raw coordinates
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place  = places?.[0];
        const label  = place?.subregion || place?.city || place?.region;
        if (label) setLocationLabel(label);
      } catch {
        // Not critical — keep the "Current Location" fallback
      }

      const granted = await requestNotificationPermission();
      if (granted) await schedulePrayerNotifications(times);

      const completed = await getCompletedPrayers();
      setCompletedPrayers(completed);
    } catch (e) {
      setError('Could not get location. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [computeLive]);

  useEffect(() => { load(); }, [load]);

  // ── Live ticker, once per second ───────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(computeLive, 1000);
    return () => clearInterval(tick);
  }, [computeLive]);

  const handleToggle = async (prayer) => {
    const updated = await togglePrayer(prayer);
    setCompletedPrayers(updated);
  };

  const completedCount = completedPrayers.filter(p => TRACKABLE_PRAYERS.includes(p)).length;
  const completedPct   = completedCount / TRACKABLE_PRAYERS.length;

  const dateString  = new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long',
  });
  const hijriString = formatHijriDate();

  const headerText     = isDaytime ? Colors.background : Colors.text;
  const headerSubtext  = isDaytime ? 'rgba(8,8,20,0.65)' : Colors.textSecondary;
  const gradientColors = isDaytime
    ? [Colors.primaryLight, Colors.primary]
    : [Colors.night, Colors.background];

  const ranges = prayerTimes ? getPrayerRanges(prayerTimes, tomorrowFajr) : null;
  const makruh = prayerTimes ? getMakruhTime(prayerTimes.Sunrise, prayerTimes.Maghrib) : null;

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        <LinearGradient colors={gradientColors} style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateLine, { color: headerText }]}>📅 {dateString}</Text>
              <Text style={[styles.dateLineSub, { color: headerSubtext }]}>{hijriString}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => Alert.alert('Support', 'Thanks for using Salat Tracker! 🤲')}>
                <Text style={[styles.headerIcon, { color: headerText }]}>🤍</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Notifications', 'Azan alerts are on for all 5 prayers.')}>
                <Text style={[styles.headerIcon, { color: headerText }]}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          <PrayerArc
            progress={dayProgress}
            label={currentName}
            sublabel="Waqt ends in"
            countdown={countdown}
            trackColor={isDaytime ? 'rgba(8,8,20,0.18)' : 'rgba(255,255,255,0.12)'}
            fillColor={headerText}
            dotColor={headerText}
            textColor={headerText}
            subTextColor={headerSubtext}
          />

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={[styles.pillText, { color: headerText }]} numberOfLines={1}>
                📍 {locationLabel}
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={[styles.pillText, { color: headerText }]} numberOfLines={1}>
                ☀️ {formatTimeShort(prayerTimes?.Sunrise)}  ·  🌙 {formatTimeShort(prayerTimes?.Maghrib)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.listCard}>
          {TRACKABLE_PRAYERS.map((prayer) => (
            <PrayerCard
              key={prayer}
              name={prayer}
              meta={PRAYER_META[prayer]}
              timeLabel={ranges ? `${formatTimeShort(ranges[prayer].start)} – ${formatTimeShort(ranges[prayer].end)}` : '--:-- – --:--'}
              isCompleted={completedPrayers.includes(prayer)}
              isCurrent={prayer === currentName}
              onToggle={() => handleToggle(prayer)}
            />
          ))}

          {makruh && (
            <View style={styles.makruhRow}>
              <View style={styles.makruhDot} />
              <Text style={styles.makruhText}>Makruh (avoid praying): {formatTimeShort(makruh)}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => Alert.alert('Alarm', 'Azan alerts are already scheduled automatically for each prayer.')}
            >
              <Text style={styles.footerIcon}>🔔</Text>
              <Text style={styles.footerLabel}>Alarm</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => Alert.alert('Calendar', 'A monthly prayer calendar is coming soon.')}
            >
              <Text style={styles.footerIcon}>📅</Text>
              <Text style={styles.footerLabel}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featuresHeader}>
            <Text style={styles.featuresTitle}>Top Features</Text>
          </View>
          <View style={styles.tileGrid}>
            <FeatureTile
              styles={styles}
              label="Tracker"
              onPress={() => navigation.navigate('Streak')}
              badge={<MiniRing percent={completedPct} color={Colors.primary} track={Colors.border} />}
            />
            <FeatureTile styles={styles} icon="🧭" label="Qibla" onPress={() => navigation.navigate('Qibla')} />
            <FeatureTile styles={styles} icon="📖" label="Quran" onPress={() => Alert.alert('Quran', 'Coming soon — building this next!')} />
            <FeatureTile styles={styles} icon="📿" label="Tasbeeh" onPress={() => Alert.alert('Tasbeeh', 'Coming soon — building this next!')} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 15, marginTop: 12 },
  errorText: {
    color: Colors.textSecondary, fontSize: 15,
    textAlign: 'center', lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  retryText: { color: Colors.background, fontWeight: '700', fontSize: 16 },

  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateBlock: { gap: 2, flexShrink: 1 },
  dateLine: { fontSize: 14, fontWeight: '700' },
  dateLineSub: { fontSize: 12, marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 14 },
  headerIcon: { fontSize: 20 },

  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  pillText: { fontSize: 12, fontWeight: '600' },

  listCard: {
    backgroundColor: Colors.card,
    marginTop: -18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  makruhRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 4,
  },
  makruhDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.warning },
  makruhText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  footerIcon: { fontSize: 17 },
  footerLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  footerDivider: { width: 1, height: 24, backgroundColor: Colors.divider },

  featuresSection: { paddingHorizontal: 16, marginTop: 22 },
  featuresHeader: { marginBottom: 14 },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  tileGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { alignItems: 'center', width: 72, gap: 8 },
  tileIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  tileIcon: { fontSize: 24 },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});
