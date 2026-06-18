import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Prayer background images ─────────────────────────────────────────────────
// Replace each file in assets/prayers/ with your own mosque photo.
const PRAYER_IMAGES = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Sunrise: require('../../assets/prayers/sunrise.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

// ── Mood overlay per prayer (keeps text readable over any photo) ──────────────
const PRAYER_TINT = {
  Fajr:    'rgba(13,  27,  62, 0.62)',   // deep blue-purple dawn
  Sunrise: 'rgba(100, 45,   0, 0.56)',   // warm amber
  Dhuhr:   'rgba(10,  40,  90, 0.52)',   // bright midday blue
  Asr:     'rgba(120, 55,   0, 0.56)',   // warm orange
  Maghrib: 'rgba(110, 20,  10, 0.62)',   // deep red sunset
  Isha:    'rgba(8,    8,  20, 0.72)',   // night
};

// ── "02:29:45"  →  "2 hours 29 minutes" ──────────────────────────────────────
function naturalCountdown(cd) {
  const [h, m, s] = (cd || '00:00:00').split(':').map(Number);
  if (h > 0 && m > 0) return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  if (h > 0)           return `${h} hour${h !== 1 ? 's' : ''}`;
  if (m > 0)           return `${m} minute${m !== 1 ? 's' : ''}`;
  return `${s} second${s !== 1 ? 's' : ''}`;
}

// ── SVG semicircle arch (⌒ shape, bows upward) ───────────────────────────────
function SemiArc() {
  const W   = SCREEN_W - 80;   // arc width
  const R   = W / 2;            // circle radius
  const PAD = 14;               // space above apex dot
  const H   = R + PAD + 16;    // total SVG height

  // Arc: center at (R, R+PAD), from left edge (0, R+PAD) → apex (R, PAD) → right edge (W, R+PAD)
  // "M 0 y A R R 0 0 0 W y" = counter-clockwise short arc = top half = ⌒
  const d = `M 0 ${R + PAD} A ${R} ${R} 0 0 0 ${W} ${R + PAD}`;

  return (
    <Svg width={W} height={H}>
      {/* The arch line */}
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={1.5} />

      {/* Apex dot — top of arch */}
      <Circle cx={R}     cy={PAD}      r={5} fill="rgba(255,255,255,0.90)" />
      {/* Left end dot */}
      <Circle cx={6}     cy={R + PAD}  r={5} fill="rgba(255,255,255,0.55)" />
      {/* Right end dot */}
      <Circle cx={W - 6} cy={R + PAD}  r={5} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

// ── Page indicator: which prayer is active ────────────────────────────────────
const TRACKABLE = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function PageDots({ prayerName }) {
  const idx = TRACKABLE.indexOf(prayerName);
  const active = idx >= 0 ? idx : 0;
  return (
    <View style={styles.dotsRow}>
      {TRACKABLE.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Props:
 *   name             — next prayer name e.g. 'Fajr'
 *   time             — formatted start time e.g. '3:43 AM'
 *   endTime          — formatted end time (next prayer start) e.g. '5:10 AM'
 *   countdown        — 'HH:MM:SS' string
 *   meta             — { icon, arabic, color }
 *   onLocationPress  — called when user taps [Local]
 *   hijriDate        — e.g. '4 Muharram 1448 AH'
 *   gregorianDate    — e.g. 'Fri, 19 Jun 2026'
 */
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

  return (
    <View style={styles.shadow}>
      <ImageBackground
        source={bgImage}
        style={styles.imageBg}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        {/* Mood colour overlay */}
        <View style={[styles.tintOverlay, { backgroundColor: tint }]} />

        {/* ── Top row ──────────────────────────────────────────────────── */}
        <View style={styles.topRow}>
          {/* Local GPS button */}
          <TouchableOpacity
            style={styles.localBtn}
            onPress={onLocationPress}
            activeOpacity={0.75}
          >
            <Text style={styles.localIcon}>🌐</Text>
            <Text style={styles.localLabel}>Local</Text>
          </TouchableOpacity>

          {/* Date block (right-aligned) */}
          <View style={styles.dateBlock}>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
            <Text style={styles.gregDate}>{gregorianDate}</Text>
          </View>
        </View>

        {/* ── Prayer name ───────────────────────────────────────────────── */}
        <Text style={styles.prayerName}>
          {meta?.icon}{'  '}{name}
        </Text>

        {/* ── BIG focal time ────────────────────────────────────────────── */}
        <Text style={styles.bigTime}>{time ? time.toLowerCase() : '--:--'}</Text>

        {/* ── Countdown ─────────────────────────────────────────────────── */}
        <Text style={styles.countdownText}>
          will start in {naturalCountdown(countdown)}
        </Text>

        {/* ── Start – End pill ──────────────────────────────────────────── */}
        <View style={styles.rangePill}>
          <Text style={styles.rangeText}>
            {time ? time.toLowerCase() : '--:--'}
            {'   —   '}
            {endTime ? endTime.toLowerCase() : '--:--'}
          </Text>
        </View>

        {/* ── Arc + page dots ───────────────────────────────────────────── */}
        <View style={styles.arcWrap}>
          <SemiArc />
          <PageDots prayerName={name} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer shadow wrapper (overflow:hidden on ImageBackground kills shadows)
  shadow: {
    marginHorizontal: 16,
    marginVertical:   12,
    borderRadius:     24,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 10 },
    shadowOpacity:    0.50,
    shadowRadius:     22,
    elevation:        14,
  },
  imageBg: {
    borderRadius:      24,
    overflow:          'hidden',
    paddingTop:        22,
    paddingBottom:     16,
    paddingHorizontal: 20,
  },
  imageStyle: {
    borderRadius: 24,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },

  // Top row
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   18,
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
    borderColor:       'rgba(255,255,255,0.30)',
  },
  localIcon: { fontSize: 14 },
  localLabel: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '600',
  },
  dateBlock: { alignItems: 'flex-end' },
  hijriDate: {
    color:      '#fff',
    fontSize:   14,
    fontWeight: '700',
  },
  gregDate: {
    color:     'rgba(255,255,255,0.65)',
    fontSize:  12,
    marginTop: 2,
  },

  // Prayer name
  prayerName: {
    color:         'rgba(255,255,255,0.90)',
    fontSize:      17,
    fontWeight:    '600',
    textAlign:     'center',
    letterSpacing: 0.5,
    marginBottom:  2,
  },

  // Big time — the hero
  bigTime: {
    color:            '#fff',
    fontSize:         60,
    fontWeight:       '800',
    textAlign:        'center',
    letterSpacing:    2,
    marginVertical:   6,
    textShadowColor:  'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Countdown
  countdownText: {
    color:        'rgba(255,255,255,0.80)',
    fontSize:     15,
    textAlign:    'center',
    marginBottom: 14,
  },

  // Start–end pill
  rangePill: {
    alignSelf:         'center',
    backgroundColor:   'rgba(255,255,255,0.13)',
    borderRadius:      20,
    paddingHorizontal: 18,
    paddingVertical:   7,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.28)',
    marginBottom:      2,
  },
  rangeText: {
    color:         'rgba(255,255,255,0.92)',
    fontSize:      13,
    fontWeight:    '500',
    letterSpacing: 0.5,
  },

  // Arc section
  arcWrap: {
    alignItems: 'center',
    marginTop:  6,
  },

  // Page dots
  dotsRow: {
    flexDirection:  'row',
    gap:            6,
    justifyContent: 'center',
    marginTop:      6,
  },
  dot: {
    height:       6,
    borderRadius: 3,
  },
  dotActive: {
    width:           20,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  dotInactive: {
    width:           6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
