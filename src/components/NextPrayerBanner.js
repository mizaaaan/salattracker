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

// ── Card dimensions — landscape ───────────────────────────────────────────────
const CARD_W = SCREEN_W - 32;
const CARD_H = Math.round(CARD_W * 0.62);   // landscape, UNCHANGED

// ── Arc geometry ──────────────────────────────────────────────────────────────
// KEY IDEA: size arc RADIUS from card HEIGHT → perfect semicircle always fits
// Subtract fixed elements (topBar ~46 + dots ~20 + padding ~24 + margins ~16)
const ARC_RX  = CARD_H - 106;               // radius = available height
const ARC_RY  = ARC_RX;                     // ← EQUAL = 100% perfect semicircle
const ARC_W   = ARC_RX * 2 + 20;            // arc canvas width (10px margin each side)
const LEFT_X  = 10;
const RIGHT_X = ARC_W - 10;
const ARC_CX  = (LEFT_X + RIGHT_X) / 2;
const BASE_Y  = ARC_RY + 8;
const ARC_H   = BASE_Y + 8;

// ── Prayer background images ──────────────────────────────────────────────────
const PRAYER_IMAGES = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Sunrise: require('../../assets/prayers/sunrise.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

const PRAYER_TINT = {
  Fajr:    'rgba(5,  15,  55, 0.28)',
  Sunrise: 'rgba(90, 35,   0, 0.22)',
  Dhuhr:   'rgba(8,  28,  80, 0.20)',
  Asr:     'rgba(90, 45,   0, 0.25)',
  Maghrib: 'rgba(100, 10,  5, 0.28)',
  Isha:    'rgba(5,   5,  18, 0.38)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function arcPointAt(t) {
  const theta = Math.PI * (1 - t);
  return {
    x: ARC_CX + ARC_RX * Math.cos(theta),
    y: BASE_Y - ARC_RY * Math.sin(theta),
  };
}

function calcSunT(sunriseTime, sunsetTime) {
  const now  = new Date();
  const rise = (sunriseTime instanceof Date) ? sunriseTime : (() => {
    const d = new Date(); d.setHours(6, 0, 0, 0); return d;
  })();
  const set  = (sunsetTime  instanceof Date) ? sunsetTime  : (() => {
    const d = new Date(); d.setHours(19, 0, 0, 0); return d;
  })();
  return Math.max(0.03, Math.min(0.97, (now - rise) / (set - rise)));
}

function naturalCountdown(cd) {
  const [h, m, s] = (cd || '00:00:00').split(':').map(Number);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)           return `${h} hour${h !== 1 ? 's' : ''}`;
  if (m > 0)           return `${m} minute${m !== 1 ? 's' : ''}`;
  return `${s}s`;
}

// ── Gradient overlay ──────────────────────────────────────────────────────────
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
          <Stop offset="0"    stopColor="#000" stopOpacity="0.00" />
          <Stop offset="0.40" stopColor="#000" stopOpacity="0.10" />
          <Stop offset="0.70" stopColor="#000" stopOpacity="0.45" />
          <Stop offset="1"    stopColor="#000" stopOpacity="0.72" />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width={CARD_W} height={CARD_H} fill="url(#bannerFade)" />
    </Svg>
  );
}

// ── Perfect semicircle arc + golden sun ───────────────────────────────────────
function SunArc({ sunT }) {
  const sun = arcPointAt(sunT);
  const d   = `M ${LEFT_X} ${BASE_Y} A ${ARC_RX} ${ARC_RY} 0 0 1 ${RIGHT_X} ${BASE_Y}`;

  return (
    <Svg width={ARC_W} height={ARC_H}>
      {/* Glow layers */}
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={10} strokeLinecap="round" />
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth={5}  strokeLinecap="round" />
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={2}  strokeLinecap="round" />

      {/* Endpoint dots */}
      <Circle cx={LEFT_X}  cy={BASE_Y} r={6}   fill="rgba(255,255,255,0.18)" />
      <Circle cx={LEFT_X}  cy={BASE_Y} r={4}   fill="rgba(255,255,255,0.75)" />
      <Circle cx={RIGHT_X} cy={BASE_Y} r={6}   fill="rgba(255,255,255,0.18)" />
      <Circle cx={RIGHT_X} cy={BASE_Y} r={4}   fill="rgba(255,255,255,0.75)" />

      {/* Layered golden sun */}
      <Circle cx={sun.x} cy={sun.y} r={18}  fill="rgba(255,200,0,0.12)" />
      <Circle cx={sun.x} cy={sun.y} r={12}  fill="rgba(255,195,0,0.24)" />
      <Circle cx={sun.x} cy={sun.y} r={8}   fill="#FFC107" />
      <Circle cx={sun.x} cy={sun.y} r={5}   fill="#FFE566" />
      <Circle cx={sun.x} cy={sun.y} r={2.5} fill="#FFFDE7" />
    </Svg>
  );
}

// ── Page dots ─────────────────────────────────────────────────────────────────
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
export default function NextPrayerBanner({
  name, time, countdown, hijriDate,
  location, sunriseTime, maghribTime, onLocationPress,
}) {
  const bgImage  = PRAYER_IMAGES[name] ?? PRAYER_IMAGES.Fajr;
  const tint     = PRAYER_TINT[name]   ?? PRAYER_TINT.Fajr;
  const locLabel = location || 'Local';

  const [sunT, setSunT] = useState(() => calcSunT(sunriseTime, maghribTime));
  useEffect(() => {
    setSunT(calcSunT(sunriseTime, maghribTime));
    const id = setInterval(() => setSunT(calcSunT(sunriseTime, maghribTime)), 60_000);
    return () => clearInterval(id);
  }, [sunriseTime, maghribTime]);

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>

        <Image source={bgImage} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
        <GradientOverlay />

        <View style={styles.overlay}>

          {/* Top bar */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.locationPill} onPress={onLocationPress} activeOpacity={0.75}>
              <Text style={styles.locationIcon}>🌐</Text>
              <Text style={styles.locationLabel}>{locLabel}</Text>
            </TouchableOpacity>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
          </View>

          {/* Flex spacer — pushes arc to bottom half */}
          <View style={{ flex: 1 }} />

          {/* Arc + Info — arc is sized to be perfect semicircle inside landscape card */}
          <View style={styles.arcContainer}>
            <SunArc sunT={sunT} />

            {/* Prayer info inside the arc */}
            <View style={styles.arcInfoOverlay}>
              <Text style={styles.prayerName}>{name}</Text>
              <Text style={styles.bigTime}>{time}</Text>
              <Text style={styles.countdown}>
                will start in {naturalCountdown(countdown)}
              </Text>
            </View>
          </View>

          {/* Page dots */}
          <PageDots prayerName={name} />
          <View style={{ height: 10 }} />

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 16,
    marginVertical:   10,
    borderRadius:     20,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 8 },
    shadowOpacity:    0.40,
    shadowRadius:     16,
    elevation:        12,
  },
  card: {
    borderRadius: 20,
    overflow:     'hidden',
    height:       CARD_H,   // landscape height, unchanged
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingTop:        14,
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
    gap:               5,
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.28)',
  },
  locationIcon:  { fontSize: 12 },
  locationLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  hijriDate:     { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Arc container — centered, sized by height not width
  arcContainer: {
    alignItems: 'center',
    position:   'relative',
    width:      ARC_W,      // smaller than card width → perfect semicircle fits
  },

  // Prayer info inside arc — absolute
  arcInfoOverlay: {
    position:   'absolute',
    bottom:     18,
    left:       0,
    right:      0,
    alignItems: 'center',
  },

  prayerName: {
    color:         'rgba(255,255,255,0.88)',
    fontSize:      13,
    fontWeight:    '500',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom:  1,
  },
  bigTime: {
    color:            '#fff',
    fontSize:         30,
    fontWeight:       '700',
    letterSpacing:    1,
    lineHeight:       36,
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom:     1,
  },
  countdown: {
    color:         'rgba(255,255,255,0.75)',
    fontSize:      11,
    letterSpacing: 0.2,
  },

  // Page dots
  dotsRow: {
    flexDirection:  'row',
    gap:            5,
    justifyContent: 'center',
    marginTop:      6,
  },
  dot:    { height: 5, borderRadius: 3 },
  dotOn:  { width: 18, backgroundColor: 'rgba(255,255,255,0.90)' },
  dotOff: { width:  5, backgroundColor: 'rgba(255,255,255,0.28)' },
});
