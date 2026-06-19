import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 420; // taller card for full-bleed feel

const PRAYER_IMAGES = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Sunrise: require('../../assets/prayers/sunrise.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

// Lighter tint — image should breathe more
const PRAYER_TINT = {
  Fajr:    'rgba(5,  15,  40, 0.45)',
  Sunrise: 'rgba(80, 30,   0, 0.40)',
  Dhuhr:   'rgba(8,  28,  70, 0.38)',
  Asr:     'rgba(90, 40,   0, 0.42)',
  Maghrib: 'rgba(90, 10,   5, 0.45)',
  Isha:    'rgba(5,   5,  15, 0.55)',
};

function naturalCountdown(cd) {
  const [h, m, s] = (cd || '00:00:00').split(':').map(Number);
  if (h > 0 && m > 0) return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  if (h > 0)           return `${h} hour${h !== 1 ? 's' : ''}`;
  if (m > 0)           return `${m} minute${m !== 1 ? 's' : ''}`;
  return `${s} second${s !== 1 ? 's' : ''}`;
}

function SemiArc({ color = 'rgba(255,255,255,0.65)' }) {
  const W  = CARD_W - 60;
  const H  = 80;
  const Y0 = 12;
  const YB = H - 12;
  const d  = `M 10 ${YB} Q ${W / 2} ${Y0} ${W - 10} ${YB}`;
  return (
    <Svg width={W} height={H}>
      <Path d={d} fill="none" stroke={color} strokeWidth={1.8} />
      <Circle cx={W / 2} cy={Y0 + 1} r={5} fill="rgba(255,255,255,0.90)" />
      <Circle cx={10}     cy={YB}     r={5} fill="rgba(255,255,255,0.50)" />
      <Circle cx={W - 10} cy={YB}     r={5} fill="rgba(255,255,255,0.50)" />
    </Svg>
  );
}

const TRACKABLE = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function PageDots({ prayerName }) {
  const active = Math.max(0, TRACKABLE.indexOf(prayerName));
  return (
    <View style={styles.dotsRow}>
      {TRACKABLE.map((_, i) => (
        <View key={i} style={[styles.dot, i === active ? styles.dotOn : styles.dotOff]} />
      ))}
    </View>
  );
}

export default function NextPrayerBanner({
  name,
  time,
  endTime,
  countdown,
  meta,
  onLocationPress,
  hijriDate,
  gregorianDate,
}) {
  const bgImage = PRAYER_IMAGES[name] ?? PRAYER_IMAGES.Fajr;
  const tint    = PRAYER_TINT[name]   ?? PRAYER_TINT.Fajr;
  const timeStr = time ? time.toLowerCase() : '--:--';
  const endStr  = endTime ? endTime.toLowerCase() : '—';

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>

        {/* ── Full-bleed background image ── */}
        <Image
          source={bgImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* ── Flat mood tint ── */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />

        {/* ── Bottom gradient for text readability ── */}
        {/* Pure CSS gradient via nested Views (no LinearGradient dep needed) */}
        <View style={styles.bottomGradient} />

        {/* ══ ALL CONTENT OVERLAID ══════════════════════════════════════ */}
        <View style={styles.overlay}>

          {/* Top row */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.localBtn} onPress={onLocationPress} activeOpacity={0.75}>
              <Text style={styles.localIcon}>🌐</Text>
              <Text style={styles.localLabel}>Local</Text>
            </TouchableOpacity>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
          </View>

          {/* Center spacer — pushes content down */}
          <View style={{ flex: 1 }} />

          {/* Prayer name */}
          <Text style={styles.prayerName}>{name}</Text>

          {/* Big time */}
          <Text style={styles.bigTime}>{timeStr}</Text>

          {/* Countdown */}
          <Text style={styles.countdownText}>
            will start in {naturalCountdown(countdown)}
          </Text>

          {/* Arc */}
          <View style={styles.arcWrap}>
            <SemiArc />
          </View>

          {/* Page dots */}
          <PageDots prayerName={name} />

          {/* Bottom padding */}
          <View style={{ height: 16 }} />

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 16,
    marginVertical:   12,
    borderRadius:     24,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 12 },
    shadowOpacity:    0.55,
    shadowRadius:     24,
    elevation:        16,
  },
  card: {
    borderRadius: 24,
    overflow:     'hidden',
    height:       CARD_H,
  },

  // Dark fade at the bottom half of the card
  bottomGradient: {
    position: 'absolute',
    left:     0,
    right:    0,
    bottom:   0,
    height:   CARD_H * 0.72,  // covers lower 72% of card
    // Simulated gradient: four stacked semi-transparent layers
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingTop:        20,
    alignItems:        'center',
  },

  // Top row
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    width:          '100%',
  },
  localBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.32)',
  },
  localIcon:  { fontSize: 14 },
  localLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  hijriDate:  { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Prayer name
  prayerName: {
    color:         'rgba(255,255,255,0.90)',
    fontSize:      20,
    fontWeight:    '600',
    letterSpacing: 1.2,
    marginBottom:  6,
  },

  // Big focal time
  bigTime: {
    color:            '#fff',
    fontSize:         62,
    fontWeight:       '800',
    letterSpacing:    1.5,
    textShadowColor:  'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom:     6,
  },

  // Countdown
  countdownText: {
    color:        'rgba(255,255,255,0.80)',
    fontSize:     14,
    marginBottom: 2,
  },

  // Arc
  arcWrap: {
    alignItems: 'center',
    width:      '100%',
    marginTop:  4,
  },

  // Page dots
  dotsRow: {
    flexDirection:  'row',
    gap:            6,
    justifyContent: 'center',
    marginTop:      4,
  },
  dot:    { height: 6, borderRadius: 3 },
  dotOn:  { width: 20, backgroundColor: 'rgba(255,255,255,0.92)' },
  dotOff: { width: 6,  backgroundColor: 'rgba(255,255,255,0.35)' },
});
