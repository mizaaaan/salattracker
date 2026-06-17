// Lightweight Hijri (Islamic) calendar conversion using the standard
// tabular/civil algorithm — no extra package required.
//
// NOTE: This is a calculated approximation. Real-world Hijri dates are
// often announced locally based on moon sighting and can differ by
// ±1 day from this calculation. If your local date is consistently
// off by one day, adjust HIJRI_OFFSET_DAYS below.

const HIJRI_OFFSET_DAYS = 0;

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-awwal", "Rabi' al-thani",
  'Jumada al-awwal', 'Jumada al-thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

const gregorianToJDN = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

/** Returns { day, month (1-12), year, monthName } for the Hijri calendar. */
export const gregorianToHijri = (date = new Date()) => {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate()) + HIJRI_OFFSET_DAYS;

  const l1 = jdn - 1948440 + 10632;
  const n  = Math.floor((l1 - 1) / 10631);
  const l2 = l1 - 10631 * n + 354;
  const j  =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day   = l3 - Math.floor((709 * month) / 24);
  const year  = 30 * n + j - 30;

  return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
};

export const formatHijriDate = (date = new Date()) => {
  const { day, year, monthName } = gregorianToHijri(date);
  return `${day} ${monthName}, ${year} AH`;
};
