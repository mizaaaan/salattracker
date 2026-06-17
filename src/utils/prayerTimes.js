import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';

// The 5 trackable prayers (Sunrise is display-only)
export const TRACKABLE_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const ALL_PRAYERS       = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const PRAYER_META = {
  Fajr:    { icon: '🌅', arabic: 'الفجر',   color: '#7B8CDE' },
  Sunrise: { icon: '🌄', arabic: 'الشروق',  color: '#F9A825' },
  Dhuhr:   { icon: '☀️', arabic: 'الظهر',   color: '#FFD600' },
  Asr:     { icon: '🌤️', arabic: 'العصر',  color: '#FF8F00' },
  Maghrib: { icon: '🌇', arabic: 'المغرب',  color: '#FF7043' },
  Isha:    { icon: '🌙', arabic: 'العشاء',  color: '#5C6BC0' },
};

/**
 * Calculate prayer times for a given location and date.
 * Uses Karachi method (standard in South/Southeast Asia).
 */
export const calculatePrayerTimes = (latitude, longitude, date = new Date()) => {
  const coordinates = new Coordinates(latitude, longitude);
  // Karachi method used widely in Bangladesh, Pakistan, India
  const params     = CalculationMethod.Karachi();
  const times      = new PrayerTimes(coordinates, date, params);

  return {
    Fajr:    times.fajr,
    Sunrise: times.sunrise,
    Dhuhr:   times.dhuhr,
    Asr:     times.asr,
    Maghrib: times.maghrib,
    Isha:    times.isha,
  };
};

/**
 * Returns the Qibla bearing (degrees clockwise from North) for a location.
 */
export const calculateQibla = (latitude, longitude) => {
  const coordinates = new Coordinates(latitude, longitude);
  return Qibla(coordinates); // number: degrees from North
};

/**
 * Finds the next upcoming prayer after now.
 * Returns { name, time } or null if all prayers have passed.
 */
export const getNextPrayer = (prayerTimes) => {
  const now = new Date();
  for (const name of ALL_PRAYERS) {
    if (prayerTimes[name] && prayerTimes[name] > now) {
      return { name, time: prayerTimes[name] };
    }
  }
  return null;
};

/**
 * Returns the prayer whose window we're currently inside — as opposed to
 * getNextPrayer, which returns the upcoming one. Used to show "Duhr —
 * Waqt ends in ..." instead of naming the prayer that hasn't started yet.
 * Falls back to 'Isha' if it's after midnight and before today's Fajr.
 */
export const getCurrentPrayer = (prayerTimes) => {
  const now = new Date();
  let current = null;
  for (const name of ALL_PRAYERS) {
    if (prayerTimes[name] && prayerTimes[name] <= now) {
      current = { name, time: prayerTimes[name] };
    }
  }
  return current ?? { name: 'Isha', time: null };
};

/**
 * Given today's prayer times and tomorrow's Fajr time, returns a
 * { [prayerName]: { start, end } } map for the 5 trackable prayers —
 * used to show "start – end" ranges in the prayer list.
 */
export const getPrayerRanges = (times, tomorrowFajr) => ({
  Fajr:    { start: times.Fajr,    end: times.Sunrise },
  Dhuhr:   { start: times.Dhuhr,   end: times.Asr },
  Asr:     { start: times.Asr,     end: times.Maghrib },
  Maghrib: { start: times.Maghrib, end: times.Isha },
  Isha:    { start: times.Isha,    end: tomorrowFajr },
});

/**
 * Approximate Makruh (disliked) midday moment — the instant of solar noon,
 * a few minutes before Dhuhr begins, when prayer is traditionally avoided.
 * Approximated as the midpoint between sunrise and sunset, which is very
 * close to true solar noon for non-extreme latitudes.
 */
export const getMakruhTime = (sunrise, sunset) => {
  if (!sunrise || !sunset) return null;
  return new Date((sunrise.getTime() + sunset.getTime()) / 2);
};

/**
 * Formats a Date object to a 12-hour time string, e.g. "4:23 AM"
 */
export const formatTime = (date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/** HH:MM in 12-hour time, no AM/PM suffix — matches a compact list style. */
export const formatTimeShort = (date) => {
  if (!date) return '--:--';
  return date
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    .replace(/\s?[AP]M$/i, '');
};

/**
 * Returns a countdown string "HH:MM:SS" for the difference between
 * a future Date and now.
 */
export const getCountdown = (targetDate) => {
  const diff = targetDate - new Date();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};
