import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import Svg, {
  Path, Circle, Rect,
  Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 380;

// ── Prayer background images ─────────────────────────────────────────────────
const PRAYER_IMAGES = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Sunrise: require('../../assets/prayers/sunrise.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

// Mood tint per prayer — lighter opacity so the image shows through more
const PRAYER_TINT = {
  Fajr:    'rgba(5,  15,  55, 0.28)',
  Sunrise: 'rgba(90, 35,   0, 0.22)',
  Dhuhr:   'rgba(8,  28,  80, 0.20)',
  Asr:     'rgba(90, 45,   0, 0.25)',
  Maghrib: 'rgba(100, 10,  5, 0.28)',
  Isha:    'rgba(5,   5,  18, 0.38)',
};

// ── Arc geometry constants ───────────────────────────────────────────────────
const ARC_W   = CARD_W - 48;
const ARC_H   = 110;
const PEAK_Y  = 16;
const BASE_Y  = ARC_H - 12;
const LEFT_X  = 14;
const RIGHT_X = ARC_W - 14;
const CTRL_X  = ARC_W / 2;

// Quadratic bezier point at t (0=left end, 0.5=peak, 1=right end)
function bezierAt(t) {
  const x = (1-t)*(1-t)*LEFT_X  + 2*(1-t)*t*CTRL_X + t*t*RIGHT_X;
  const y = (1-t)*(1-t)*BASE_Y  + 2*(1-t)*t*PEAK_Y  + t*t*BASE_Y;
  return { x, y };
}

// Sun's t value: 0=sunrise (left), 0.5=noon (peak/top), 1=sunset (right)
function calcSunT(sunriseTime, sunsetTime) {
  const now = new Date();

  const rise = (sunriseTime instanceof Date) ? sunriseTime : (() => {
    const d = new Date(); d.setHours(6, 0, 0, 0); return d;
  })();
  const set = (sunsetTime instanceof Date) ? sunsetTime : (() => {
    const d = new Date(); d.setHours(19, 0, 0, 0); return d;
  })();

  const t = (now - rise) / (set - rise);
  return Math.max(0.03, Math.min(0.97, t));
}

// ── Countdown to natural language ────────────────────────────────────────────
function naturalCountdown(cd) {
  const [h, m, s] = (cd || '00:00:00').split(':').map(Number);
  if (h > 0 && m > 0) return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  if (h > 0)           return `${h} hour${h !== 1 ? 's' : ''}`;
  if (m > 0)           return `${m} minute${m !== 1 ? 's' : ''}`;
  return `${s} second${s !== 1 ? 's' : ''}`;
}

// ── SVG gradient overlay: transparent top → dark bottom ─────────────────────
function GradientOverlay() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={CARD_W}
      height={CARD_H}
      preserveAspectRatio="none"
    >
      <Defs>
        <SvgGradient id="bannerFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"    stopColor="#000" stopOpacity="0.04" />
          <Stop offset="0.30" stopColor="#000" stopOpacity="0.08" />
          <Stop offset="0.58" stopColor="#000" stopOpacity="0.40" />
          <Stop offset="1"    stopColor="#000" stopOpacity="0.74" />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width={CARD_W} height={CARD_H} fill="url(#bannerFade)" />
    </Svg>
  );
}

// ── Arc + layered golden sun ─────────────────────────────────────────────────
function SunArc({ sunT }) {
  const sun = bezierAt(sunT);
  const d   = `M ${LEFT_X} ${BASE_Y} Q ${CTRL_X} ${PEAK_Y} ${RIGHT_X} ${BASE_Y}`;

  return (
    <Svg width={ARC_W} height={ARC_H}>
      {/* Arc line */}
      <Path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* End-point dots */}
      <Circle cx={LEFT_X}  cy={BASE_Y} r={4} fill="rgba(255,255,255,0.38)" />
      <Circle cx={RIGHT_X} cy={BASE_Y} r={4} fill="rgba(255,255,255,0.38)" />

      {/* ── Layered golden sun ── */}
      {/* Outer glow */}
      <Circle cx={sun.x} cy={sun.y} r={19} fill="rgba(255,200,0,0.16)" />
      {/* Mid glow */}
      <Circle cx={sun.x} cy={sun.y} r={13} fill="rgba(255,195,0,0.28)" />
      {/* Sun body */}
      <Circle cx={sun.x} cy={sun.y} r={9}  fill="#FFC107" />
      {/* Bright inner */}
      <Circle cx={sun.x} cy={sun.y} r={5.5} fill="#FFE566" />
      {/* White core */}
      <Circle cx={sun.x} cy={sun.y} r={2.5} fill="#FFFDE7" />
    </Svg>
  );
}

// ── Page indicator dots ───────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Props:
 *   name          – 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
 *   time          – pre-formatted 12hr string e.g. '3:15 PM'   (kept as-is)
 *   countdown     – 'HH:MM:SS' string
 *   hijriDate     – e.g. '3 Muharram 1448 AH'
 *   location      – city name string, defaults to 'Local'
 *   sunriseTime   – Date object (Sunrise prayer) for sun position on arc
 *   maghribTime   – Date object (Maghrib prayer) used as sunset proxy
 *   onLocationPress – () => void
 */
export default function NextPrayerBanner({
  name,
  time,
  countdown,
  hijriDate,
  location,
  sunriseTime,
  maghribTime,
  onLocationPress,
}) {
  const bgImage  = PRAYER_IMAGES[name] ?? PRAYER_IMAGES.Fajr;
  const tint     = PRAYER_TINT[name]   ?? PRAYER_TINT.Fajr;
  const locLabel = location || 'Local';

  // Recompute sun position once per minute
  const [sunT, setSunT] = useState(() => calcSunT(sunriseTime, maghribTime));
  useEffect(() => {
    setSunT(calcSunT(sunriseTime, maghribTime));
    const id = setInterval(
      () => setSunT(calcSunT(sunriseTime, maghribTime)),
      60_000
    );
    return () => clearInterval(id);
  }, [sunriseTime, maghribTime]);

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>

        {/* Background image — landscape/cover fill */}
        <Image
          source={bgImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Mood colour tint (lighter than before) */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />

        {/* SVG gradient: transparent top → dark bottom */}
        <GradientOverlay />

        {/* ══ CONTENT ══════════════════════════════════════════════════════ */}
        <View style={styles.overlay}>

          {/* Top bar */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.locationPill}
              onPress={onLocationPress}
              activeOpacity={0.75}
            >
              <Text style={styles.locationIcon}>🌐</Text>
              <Text style={styles.locationLabel}>{locLabel}</Text>
            </TouchableOpacity>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
          </View>

          {/* Push prayer info to lower half */}
          <View style={{ flex: 1 }} />

          {/* Prayer name */}
          <Text style={styles.prayerName}>{name}</Text>

          {/* 12hr time — big focal number */}
          <Text style={styles.bigTime}>{time}</Text>

          {/* Countdown */}
          <Text style={styles.countdown}>
            will start in {naturalCountdown(countdown)}
          </Text>

          {/* Arc with moving golden sun */}
          <View style={styles.arcWrap}>
            <SunArc sunT={sunT} />
          </View>

          {/* Page dots */}
          <PageDots prayerName={name} />

          <View style={{ height: 14 }} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 16,
    marginVertical:   10,
    borderRadius:     24,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 10 },
    shadowOpacity:    0.45,
    shadowRadius:     20,
    elevation:        14,
  },
  card: {
    borderRadius: 24,
    overflow:     'hidden',
    height:       CARD_H,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingTop:        18,
    alignItems:        'center',
  },

  // Top bar
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    width:          '100%',
  },
  locationPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.28)',
  },
  locationIcon:  { fontSize: 14 },
  locationLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  hijriDate:     { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Prayer name (spaced, uppercase)
  prayerName: {
    color:         'rgba(255,255,255,0.88)',
    fontSize:      17,
    fontWeight:    '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom:  2,
  },

  // Big 12hr time — kept in 12hr as requested
  bigTime: {
    color:            '#fff',
    fontSize:         58,
    fontWeight:       '800',
    letterSpacing:    1,
    lineHeight:       66,
    textShadowColor:  'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom:     2,
  },

  countdown: {
    color:         'rgba(255,255,255,0.75)',
    fontSize:      14,
    letterSpacing: 0.2,
    marginBottom:  2,
  },

  arcWrap: {
    alignItems: 'center',
    width:      '100%',
    marginTop:  8,
  },

  dotsRow: {
    flexDirection: 'row',
    gap:           6,
    justifyContent:'center',
    marginTop:     2,
  },
  dot:    { height: 6, borderRadius: 3 },
  dotOn:  { width: 20, backgroundColor: 'rgba(255,255,255,0.90)' },
  dotOff: { width:  6, backgroundColor: 'rgba(255,255,255,0.28)' },
});
