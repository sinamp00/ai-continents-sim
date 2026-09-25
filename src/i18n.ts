/**
 * Internationalization + continent characters.
 *
 * - `Lang`: 'fa' (Persian, default, RTL) or 'en' (English, LTR).
 * - `STRINGS`: every static UI label in both languages.
 * - `CHARACTERS`: each continent personified as a character (ادمک) with
 *   emoji avatar, glow color, map marker position, name/title/bio in both
 *   languages.
 */
import type { ContinentId } from './engine/types';

export type Lang = 'fa' | 'en';

export interface CharacterText {
  name: string;
  title: string;
  bio: string;
}

export interface Character {
  emoji: string;
  color: string;
  /** Marker position on the world map image, in percent. */
  mapX: number;
  mapY: number;
  fa: CharacterText;
  en: CharacterText;
}

export const CHARACTERS: Record<ContinentId, Character> = {
  asia: {
    emoji: '🐉',
    color: '#ef4444',
    mapX: 74,
    mapY: 30,
    fa: {
      name: 'آسیا',
      title: 'اژدهای کهن',
      bio: 'امپراتوری صبور و پرجمعیت؛ بازی هزارساله را با خرد انجام می‌دهد. اما وقتی اژدها بیدار شود، جهان می‌لرزد.',
    },
    en: {
      name: 'Asia',
      title: 'The Ancient Dragon',
      bio: 'A patient, populous empire playing the thousand-year game. But when the dragon wakes, the world trembles.',
    },
  },
  europe: {
    emoji: '🦉',
    color: '#3b82f6',
    mapX: 55,
    mapY: 20,
    fa: {
      name: 'اروپا',
      title: 'دیپلمات کهن',
      bio: 'استاد ائتلاف و معاهده؛ جنگ‌ها را با کاغذ و امضا می‌برد، نه با شمشیر.',
    },
    en: {
      name: 'Europe',
      title: 'The Old Diplomat',
      bio: 'Master of alliances and treaties; wins wars with paper and signatures, not swords.',
    },
  },
  africa: {
    emoji: '🦁',
    color: '#f59e0b',
    mapX: 57,
    mapY: 56,
    fa: {
      name: 'آفریقا',
      title: 'شیر صحرا',
      bio: 'جوان، پر انرژی و تشنه‌ی رشد؛ باور دارد آینده از آنِ اوست.',
    },
    en: {
      name: 'Africa',
      title: 'Lion of the Savannah',
      bio: 'Young, energetic and hungry for growth; believes the future belongs to it.',
    },
  },
  north_america: {
    emoji: '🦅',
    color: '#8b5cf6',
    mapX: 15,
    mapY: 38,
    fa: {
      name: 'آمریکای شمالی',
      title: 'عقاب',
      bio: 'ابرقدرت پر سر و صدا؛ با تکنولوژی و ارتشش حرف می‌زند و به کمتر کسی باج می‌دهد.',
    },
    en: {
      name: 'North America',
      title: 'The Eagle',
      bio: 'The loud superpower; speaks through technology and military might, and bows to few.',
    },
  },
  south_america: {
    emoji: '🐆',
    color: '#10b981',
    mapX: 29,
    mapY: 62,
    fa: {
      name: 'آمریکای جنوبی',
      title: 'جگوار',
      bio: 'پرشور و غیرقابل پیش‌بینی؛ در جنگل دیپلماسی شکار می‌کند.',
    },
    en: {
      name: 'South America',
      title: 'The Jaguar',
      bio: 'Passionate and unpredictable; hunts in the jungle of diplomacy.',
    },
  },
  oceania: {
    emoji: '🌊',
    color: '#06b6d4',
    mapX: 88,
    mapY: 68,
    fa: {
      name: 'اقیانوسیه',
      title: 'موج‌سوار',
      bio: 'آرام و دور از هیاهو؛ اما وقتی موج بلند شود، همه را با خود می‌برد.',
    },
    en: {
      name: 'Oceania',
      title: 'The Wave Rider',
      bio: 'Calm and far from the noise — but when the wave rises, it carries everyone with it.',
    },
  },
  antarctica: {
    emoji: '❄️',
    color: '#94a3b8',
    mapX: 50,
    mapY: 88,
    fa: {
      name: 'قطب جنوب',
      title: 'نگهبان یخ',
      bio: 'ساکت و مرموز؛ در سکوت یخی‌اش نقشه‌های بزرگی می‌کشد.',
    },
    en: {
      name: 'Antarctica',
      title: 'The Ice Guardian',
      bio: 'Silent and mysterious; draws grand plans in icy silence.',
    },
  },
};

/** Localized continent/character name. */
export const cname = (id: ContinentId, lang: Lang): string => CHARACTERS[id][lang].name;

/** Bilingual opening statements shown on the dashboard/diplomacy before the first turn. */
export const INITIAL_STATEMENTS: Record<ContinentId, { fa: string; en: string }> = {
  asia: {
    fa: '«آسیا دنبال شکوفایی از راه تجارت است، اما هیچ‌وقت ببرِ خفته را دست‌کم نگیر.»',
    en: '"Asia seeks prosperity through trade, but never underestimate the sleeping tiger."',
  },
  europe: {
    fa: '«اروپا به دیپلماسی و نهادها باور دارد — قدرت نرم بر شمشیر پیروز می‌شود.»',
    en: '"Europe believes in diplomacy and institutions — soft power beats the sword."',
  },
  africa: {
    fa: '«آفریقا برخاسته است. منابع ما، آینده ما — با احترام بیا، یا اصلاً نیا.»',
    en: '"Africa is rising. Our resources, our future — come with respect, or not at all."',
  },
  north_america: {
    fa: '«آزادی و نوآوری راه ماست. ما از متحدانمان دفاع می‌کنیم و از هیچ رقیبی نمی‌ترسیم.»',
    en: '"Freedom and innovation are our way. We defend our allies and fear no rival."',
  },
  south_america: {
    fa: '«آمریکای جنوبی صدای جنوب جهانی است — مستقل، مغرور و تسلیم‌ناپذیر.»',
    en: '"South America is the voice of the Global South — independent, proud, unbowed."',
  },
  oceania: {
    fa: '«اقیانوسیه نگهبان اقیانوس‌هاست. با طبیعت هماهنگ شو، یا موج تو را می‌برد.»',
    en: '"Oceania guards the oceans. Move with nature, or the wave takes you."',
  },
  antarctica: {
    fa: '«قطب جنوب نظاره می‌کند. یخ صبور است — و صبر، استراتژی است.»',
    en: '"Antarctica watches. Ice is patient — and patience is strategy."',
  },
};

/** Localized government name. */
const GOV: Record<string, { fa: string; en: string }> = {
  democracy: { fa: 'دموکراسی', en: 'democracy' },
  autocracy: { fa: 'خودکامگی', en: 'autocracy' },
  technocracy: { fa: 'تکنوکراسی', en: 'technocracy' },
  theocracy: { fa: 'تئوکراسی', en: 'theocracy' },
  federation: { fa: 'فدراسیون', en: 'federation' },
  monarchy: { fa: 'پادشاهی', en: 'monarchy' },
  commune: { fa: 'کمون', en: 'commune' },
  anarchy: { fa: 'آنارشی', en: 'anarchy' },
};
export const govName = (gov: string, lang: Lang): string =>
  GOV[gov]?.[lang] ?? gov;

/** Localized number with native digits. */
export const fmt = (n: number, lang: Lang): string =>
  Math.round(n).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

const en = {
  'app.title': 'AI Continents',
  'app.subtitle': 'Civilization Simulator',
  'ctrl.play': '▶ Play',
  'ctrl.pause': '⏸ Pause',
  'ctrl.turn': 'Turn',
  'ctrl.liveAi': '🧠 LIVE AI',
  'ctrl.aiFallback': '🧠 AI→LOCAL',
  'ctrl.local': '🔌 LOCAL',
  'ctrl.thinking': 'thinking…',
  'ctrl.realAi': '🧠 Real AI',
  'ctrl.offline': '🔌 Offline',
  'ctrl.saves': '💾 Saves',
  'ctrl.quickSave': '＋ Quick save',
  'ctrl.new': '🆕 New',
  'ctrl.savePh': 'Save name…',
  'ctrl.save': 'Save',
  'ctrl.noSaves': 'No saves yet.',
  'ctrl.load': 'Load',
  'ctrl.newConfirm': 'Start a new simulation? Unsaved progress will be lost.',
  'tab.map': 'Map',
  'tab.feed': 'Feed',
  'tab.stats': 'Stats',
  'tab.ranks': 'Ranks',
  'tab.time': 'Time',
  'tab.diplo': 'Diplo',
  'map.title': '🗺️ WORLD MAP',
  'map.hint': 'tap a character',
  'map.legendWar': '🔴 pulsing = at war',
  'map.legendPower': '✨ glow = power',
  'feed.title': '📡 EVENT FEED',
  'feed.major': '⭐ Major only',
  'feed.empty': 'No events yet.',
  'stat.population': '👥 Population',
  'stat.economy': '💰 Economy',
  'stat.military': '⚔️ Military',
  'stat.technology': '🔬 Technology',
  'stat.resources': '⛏️ Resources',
  'stat.happiness': '😊 Happiness',
  'dash.government': 'Government',
  'dash.power': 'power',
  'dash.relations': 'Relations',
  'dash.orgs': 'orgs',
  'dash.warWith': '⚔️ WAR:',
  'dash.unitM': 'M',
  'dash.unitK': 'K',
  'ranks.title': '🏆 CIVILIZATION RANKINGS',
  'time.title': '⏳ HISTORY TIMELINE',
  'diplo.communiques': '💬 AGENT COMMUNIQUÉS',
  'diplo.matrix': '🤝 RELATIONS MATRIX',
  'diplo.institutions': '🏛️ INSTITUTIONS',
  'diplo.atWar': '⚔️ at war',
  'diplo.empty': 'No treaties or organizations yet — make history!',
  'footer': 'Every turn, 7 AI agents decide their civilization\u2019s fate',
};

export type Strings = typeof en;

const fa: Strings = {
  'app.title': 'قاره‌های هوش مصنوعی',
  'app.subtitle': 'شبیه‌ساز تمدن',
  'ctrl.play': '▶ شروع',
  'ctrl.pause': '⏸ توقف',
  'ctrl.turn': 'نوبت',
  'ctrl.liveAi': '🧠 هوش زنده',
  'ctrl.aiFallback': '🧠 هوش→محلی',
  'ctrl.local': '🔌 محلی',
  'ctrl.thinking': 'در حال تفکر…',
  'ctrl.realAi': '🧠 هوش واقعی',
  'ctrl.offline': '🔌 آفلاین',
  'ctrl.saves': '💾 ذخیره‌ها',
  'ctrl.quickSave': '＋ ذخیره سریع',
  'ctrl.new': '🆕 جدید',
  'ctrl.savePh': 'نام ذخیره…',
  'ctrl.save': 'ذخیره',
  'ctrl.noSaves': 'هنوز ذخیره‌ای نیست.',
  'ctrl.load': 'بارگذاری',
  'ctrl.newConfirm': 'شبیه‌سازی جدید شروع شود؟ پیشرفت ذخیره‌نشده از دست می‌رود.',
  'tab.map': 'نقشه',
  'tab.feed': 'فید',
  'tab.stats': 'آمار',
  'tab.ranks': 'رتبه',
  'tab.time': 'تاریخ',
  'tab.diplo': 'دیپلماسی',
  'map.title': '🗺️ نقشه جهان',
  'map.hint': 'یک شخصیت را لمس کن',
  'map.legendWar': '🔴 چشمک‌زن = در جنگ',
  'map.legendPower': '✨ درخشش = قدرت',
  'feed.title': '📡 فید رویدادها',
  'feed.major': '⭐ فقط مهم‌ها',
  'feed.empty': 'هنوز رویدادی نیست.',
  'stat.population': '👥 جمعیت',
  'stat.economy': '💰 اقتصاد',
  'stat.military': '⚔️ ارتش',
  'stat.technology': '🔬 تکنولوژی',
  'stat.resources': '⛏️ منابع',
  'stat.happiness': '😊 شادی',
  'dash.government': 'حکومت',
  'dash.power': 'قدرت',
  'dash.relations': 'روابط',
  'dash.orgs': 'سازمان',
  'dash.warWith': '⚔️ جنگ با',
  'dash.unitM': 'میلیون',
  'dash.unitK': 'هزار',
  'ranks.title': '🏆 رتبه‌بندی تمدن‌ها',
  'time.title': '⏳ خط زمانی تاریخ',
  'diplo.communiques': '💬 بیانیه‌های ایجنت‌ها',
  'diplo.matrix': '🤝 ماتریس روابط',
  'diplo.institutions': '🏛️ نهادها',
  'diplo.atWar': '⚔️ در جنگ',
  'diplo.empty': 'هنوز معاهده یا سازمانی نیست — تاریخ بساز!',
  'footer': 'هر نوبت، ۷ ایجنت هوش مصنوعی سرنوشت تمدن خود را رقم می‌زنند',
};

export const STRINGS: Record<Lang, Strings> = { en, fa };
