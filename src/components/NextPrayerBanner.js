import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

// ── Prayer background images ──────────────────────────────────────────────────
// Replace each file in assets/prayers/ with your own LANDSCAPE mosque photo
const PRAYER_IMAGES = {
  Fajr:    require('../../assets/prayers/fajr.png'),
  Sunrise: require('../../assets/prayers/sunrise.png'),
  Dhuhr:   require('../../assets/prayers/dhuhr.png'),
  Asr:     require('../../assets/prayers/asr.png'),
  Maghrib: require('../../assets/prayers/maghrib.png'),
  Isha:    require('../../assets/prayers/isha.png'),
};

// ── Per-prayer mood tint (overlay on image for readability) ───────────────────
const PRAYER_TINT = {
  Fajr:    'rgba(13,  27,  62, 0.55)',
  Sunrise: 'rgba(100, 45,   0, 0.50)',
  Dhuhr:   'rgba(10,  40,  90, 0.48)',
  Asr:     'rgba(120, 55,   0, 0.50)',
  Maghrib: 'rgba(110, 20,  10, 0.55)',
  Isha:    'rgba(8,    8,  20, 0.65)',
};

// ── Dark bg for content section — matches prayer mood ─────────────────────────
const PRAYER_DARK = {
  Fajr:    'rgba(10,  20,  55, 0.97)',
  Sunrise: 'rgba(80,  35,   0, 0.97)',
  Dhuhr:   'rgba(8,   32,  75, 0.97)',
  Asr:     'rgba(85,  38,   0, 0.97)',
  Maghrib: 'rgba(85,  12,   8, 0.97)',
  Isha:    'rgba(6,    6,  18, 0.97)',
};

// ── "02:29:45" → "2 hours 29 minutes" ────────────────────────────────────────
function naturalCountdown(cd) {
  const [h, m, s] = (cd || '00:00:00').split(':').map(Number);
  if (h > 0 && m > 0) return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  if (h > 0)           return `${h} hour${h !== 1 ? 's' : ''}`;
  if (m > 0)           return `${m} minute${m !== 1 ? 's' : ''}`;
  return `${s} second${s !== 1 ? 's' : ''}`;
}

// ── Arch arc (quadratic bezier ⌒) — reliable & visible ───────────────────────
function SemiArc({ color = 'rgba(255,255,255,0.70)' }) {
  const W  = CARD_W - 40;   // arc width (fits within card padding)
  const H  = 72;             // arch height
  const Y0 = 10;             // apex y
  const YB = H - 10;        // base y

  // Quadratic bezier: bottom-left → apex at center-top → bottom-right
  const d = `M 10 ${YB} Q ${W / 2} ${Y0} ${W - 10} ${YB}`;

  return (
    <Svg width={W} height={H} style={{ marginTop: 4 }}>
      <Path d={d} fill="none" stroke={color} strokeWidth={2} />
      {/* Apex dot */}
      <Circle cx={W / 2} cy={Y0 + 1} r={6} fill="rgba(255,255,255,0.90)" />
      {/* Left end dot */}
      <Circle cx={10}     cy={YB}     r={6} fill="rgba(255,255,255,0.60)" />
      {/* Right end dot */}
      <Circle cx={W - 10} cy={YB}     r={6} fill="rgba(255,255,255,0.60)" />
    </Svg>
  );
}

// ── Prayer page dots ───────────────────────────────────────────────────────────
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
  const darkBg  = PRAYER_DARK[name]   ?? PRAYER_DARK.Fajr;
  const timeStr = time ? time.toLowerCase() : '--:--';
  const endStr  = endTime ? endTime.toLowerCase() : '—';

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>

        {/* ══ TOP: LANDSCAPE IMAGE SECTION ══════════════════════════════ */}
        <View style={styles.imageSection}>
          {/* Mosque background — landscape crop */}
          <Image
            source={bgImage}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* Mood tint overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />

          {/* ── Top row: Local btn + dates ── */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.localBtn} onPress={onLocationPress} activeOpacity={0.75}>
              <Text style={styles.localIcon}>🌐</Text>
              <Text style={styles.localLabel}>Local</Text>
            </TouchableOpacity>
            <View style={styles.dateBlock}>
              <Text style={styles.hijriDate}>{hijriDate}</Text>
              <Text style={styles.gregDate}>{gregorianDate}</Text>
            </View>
          </View>

          {/* ── Prayer name at bottom of image ── */}
          <Text style={styles.prayerName}>
            {meta?.icon}{'  '}{name}
          </Text>
        </View>

        {/* ══ BOTTOM: DARK CONTENT SECTION ══════════════════════════════ */}
        <View style={[styles.darkSection, { backgroundColor: darkBg }]}>

          {/* Big focal time */}
          <Text style={styles.bigTime}>{timeStr}</Text>

          {/* Countdown */}
          <Text style={styles.countdownText}>
            will start in {naturalCountdown(countdown)}
          </Text>

          {/* Start – End time pill */}
          <View style={styles.rangePill}>
            <Text style={styles.rangeText}>{timeStr}{'   —   '}{endStr}</Text>
          </View>

          {/* Arc + page dots */}
          <View style={styles.arcWrap}>
            <SemiArc />
            <PageDots prayerName={name} />
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow wrapper (keeps shadows with overflow:hidden on card)
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
  card: {
    borderRadius: 24,
    overflow:     'hidden',   // clips image to rounded corners
  },

  // ── Image section (landscape crop) ───────────────────────────────────────
  imageSection: {
    height:            210,           // landscape height on ~360px-wide card = ~1.7:1 ratio
    paddingHorizontal: 18,
    paddingTop:        20,
    paddingBottom:     16,
    justifyContent:    'space-between',
  },

  // ── Top row ──────────────────────────────────────────────────────────────
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
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

  dateBlock: { alignItems: 'flex-end' },
  hijriDate: { color: '#fff', fontSize: 14, fontWeight: '700' },
  gregDate:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },

  // ── Prayer name (bottom of image section) ────────────────────────────────
  prayerName: {
    color:         '#fff',
    fontSize:      18,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },

  // ── Dark content section ──────────────────────────────────────────────────
  darkSection: {
    paddingHorizontal: 20,
    paddingTop:        18,
    paddingBottom:     14,
    alignItems:        'center',
  },

  // Big time
  bigTime: {
    color:            '#fff',
    fontSize:         58,
    fontWeight:       '800',
    letterSpacing:    1.5,
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom:     4,
  },

  // Countdown
  countdownText: {
    color:        'rgba(255,255,255,0.75)',
    fontSize:     14,
    marginBottom: 14,
  },

  // Start–end pill
  rangePill: {
    backgroundColor:   'rgba(255,255,255,0.12)',
    borderRadius:      20,
    paddingHorizontal: 20,
    paddingVertical:   8,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.25)',
    marginBottom:      4,
  },
  rangeText: {
    color:         'rgba(255,255,255,0.92)',
    fontSize:      13,
    fontWeight:    '500',
    letterSpacing: 0.5,
  },

  // Arc container
  arcWrap: {
    alignItems: 'center',
    marginTop:  6,
    width:      '100%',
  },

  // Page dots
  dotsRow: {
    flexDirection:  'row',
    gap:            6,
    justifyContent: 'center',
    marginTop:      8,
  },
  dot:    { height: 6, borderRadius: 3 },
  dotOn:  { width: 20, backgroundColor: 'rgba(255,255,255,0.92)' },
  dotOff: { width: 6,  backgroundColor: 'rgba(255,255,255,0.35)' },
});
